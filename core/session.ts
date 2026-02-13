import fs from "node:fs";
import path from "node:path";
import type { Message, Session, ToolDef } from "./types.js";
import { dbg } from "./debug.js";

const sessions = new Map<string, Session>();
let counter = 0;

// ── Persistence ──
const SESSIONS_DIR = path.resolve(process.env.SKILLBOTS_SESSIONS_DIR || ".sessions");

function sessionFilePath(key: string): string {
  return path.join(SESSIONS_DIR, `${key.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`);
}

/** Load persisted sessions from disk on startup. */
export function loadPersistedSessions(): void {
  if (!fs.existsSync(SESSIONS_DIR)) return;
  for (const file of fs.readdirSync(SESSIONS_DIR).filter((f) => f.endsWith(".jsonl"))) {
    const key = path.basename(file, ".jsonl");
    try {
      const lines = fs.readFileSync(path.join(SESSIONS_DIR, file), "utf-8").split("\n").filter(Boolean);
      const history: Message[] = [];
      for (const line of lines) { try { history.push(JSON.parse(line)); } catch { /* skip */ } }
      if (history.length > 0) sessions.set(key, { id: `sess-${++counter}`, history, createdAt: Date.now() });
    } catch { /* skip */ }
  }
  dbg("session:load", `${sessions.size} sessions loaded`);
  // Cleanup stale sessions (>7 days, <3 messages)
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  for (const [key, s] of sessions) {
    if (Date.now() - s.createdAt > maxAge && s.history.length < 3) {
      sessions.delete(key);
      try { fs.unlinkSync(sessionFilePath(key)); } catch { /* ignore */ }
    }
  }
}

/** Persist a session to disk as JSONL. */
function persistSession(key: string): void {
  const session = sessions.get(key);
  if (!session) return;
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    fs.writeFileSync(sessionFilePath(key), session.history.map((m) => JSON.stringify(m)).join("\n") + "\n");
  } catch (e) { dbg("session:persist-error", e instanceof Error ? e.message : String(e)); }
}

// ── Core session API ──

/** Get or create a session by key. */
export function getSession(key: string): Session {
  let session = sessions.get(key);
  if (!session) {
    session = { id: `sess-${++counter}`, history: [], createdAt: Date.now() };
    sessions.set(key, session);
  }
  return session;
}

/** Append messages to a session's history and persist. */
export function appendMessages(key: string, messages: Message[]): void {
  getSession(key).history.push(...messages);
  persistSession(key);
}

/** Reset a session's history and remove persisted file. */
export function resetSession(key: string): void {
  sessions.delete(key);
  try { fs.unlinkSync(sessionFilePath(key)); } catch { /* ignore */ }
}

// ── Auto-compaction ──

/** Estimate token count (~4 chars per token). */
export function estimateTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => {
    let chars = m.content.length;
    if (m.tool_calls) chars += JSON.stringify(m.tool_calls).length;
    return sum + chars;
  }, 0) / 4;
}

const CONTEXT_WINDOW = Number(process.env.SKILLBOTS_CONTEXT_WINDOW) || 128000;
const COMPACT_THRESHOLD = Number(process.env.SKILLBOTS_COMPACT_THRESHOLD) || 0.8;
const KEEP_RECENT = 6;

/** Check if session needs compaction. */
export function needsCompaction(key: string, promptTokens: number): boolean {
  const session = sessions.get(key);
  if (!session) return false;
  const total = promptTokens + estimateTokens(session.history);
  const threshold = CONTEXT_WINDOW * COMPACT_THRESHOLD;
  dbg("compaction:check", { total: Math.round(total), threshold: Math.round(threshold) });
  return total > threshold;
}

export interface CompactOpts {
  chatFn: (history: Message[], opts: { systemPrompt: string; tools: ToolDef[]; maxToolRounds?: number }) => Promise<Message[]>;
  systemPrompt: string;
  tools: ToolDef[];
}

/** Run auto-compaction: flush memory, summarize, trim history. */
export async function compactSession(key: string, opts: CompactOpts): Promise<void> {
  const session = sessions.get(key);
  if (!session || session.history.length < KEEP_RECENT + 2) return;
  dbg("compaction:start", `${session.history.length} messages`);

  const today = new Date().toISOString().slice(0, 10);

  // Step 1: Memory flush — ask LLM to save important context
  try {
    const flushMsgs: Message[] = [...session.history, {
      role: "user",
      content: `[SYSTEM] Conversation will be compacted. Save important context to memory/${today}.md via bash. Reply: FLUSH_DONE`,
    }];
    await opts.chatFn(flushMsgs, { systemPrompt: opts.systemPrompt, tools: opts.tools, maxToolRounds: 3 });
    dbg("compaction:flush", "done");
  } catch (e) { dbg("compaction:flush-error", e instanceof Error ? e.message : String(e)); }

  // Step 2: Summarize conversation
  let summary = "Previous conversation context was compacted.";
  try {
    const sumMsgs: Message[] = [...session.history, {
      role: "user",
      content: "[SYSTEM] Summarize this conversation in ~200 words: decisions, tasks done, preferences, pending items. Just the summary, no preamble.",
    }];
    const result = await opts.chatFn(sumMsgs, { systemPrompt: opts.systemPrompt, tools: [], maxToolRounds: 0 });
    const reply = result.find((m) => m.role === "assistant" && m.content);
    if (reply?.content) summary = reply.content;
    dbg("compaction:summary", summary.slice(0, 200));
  } catch (e) { dbg("compaction:summary-error", e instanceof Error ? e.message : String(e)); }

  // Step 3: Replace history with summary + recent messages
  session.history = [
    { role: "assistant", content: `[Compacted conversation summary]\n\n${summary}` },
    ...session.history.slice(-KEEP_RECENT),
  ];
  persistSession(key);
  dbg("compaction:done", `trimmed to ${session.history.length} messages`);
}
