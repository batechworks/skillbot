import { execSync } from "node:child_process";
import path from "node:path";
import type { Message, ToolDef } from "./types.js";
import { createMockBashTool, createMockSpawnTool } from "./mock.js";
import { chat } from "./llm.js";
import { dbg } from "./debug.js";

// ── Safety guards ──

// Layer 1: Deny patterns (always active — catches obviously destructive commands)
const DENY_PATTERNS: RegExp[] = [
  /\brm\s+-[rf]{1,2}\s+[~\/]/, /\bdel\s+\/[fq]\b/i,
  /\b(format|mkfs|diskpart)\b/i, /\bdd\s+if=/, />\s*\/dev\/sd/,
  /\b(shutdown|reboot|poweroff)\b/, /:\(\)\s*\{.*\};\s*:/, /\bchmod\s+-R\s+777\s+\//,
];

// Layer 2: Command whitelist (opt-in — only whitelisted base commands may execute)
const DEFAULT_WHITELIST = [
  // Shell builtins & coreutils
  "echo", "cat", "head", "tail", "grep", "rg", "find", "ls", "pwd", "date",
  "wc", "sort", "uniq", "sed", "awk", "tr", "tee", "xargs", "test", "[",
  "true", "false", "mkdir", "cp", "mv", "touch", "rm", "file", "diff",
  "chmod", "chown", "sleep", "kill", "pgrep", "which", "whoami", "uname",
  "env", "basename", "dirname", "realpath", "mktemp", "printf",
  // Data & network
  "curl", "wget", "python3", "python", "node", "jq",
  // Dev tools
  "git", "gh", "npm", "npx", "docker", "tmux", "crontab",
  // System info
  "df", "du", "ps", "top", "uptime", "ifconfig", "nslookup", "lsof",
  "sw_vers", "sysctl", "system_profiler", "pmset",
  // macOS tools
  "osascript", "screencapture", "pbcopy", "pbpaste", "say", "open",
  "icalBuddy", "launchctl", "at", "sips",
  // Skill CLIs
  "himalaya", "gh", "spogo", "spotify_player", "openhue", "imsg", "memo",
  "remindctl", "obsidian-cli", "gog", "summarize", "nano-pdf",
  "whisper", "codex", "claude", "pi", "opencode",
  // Package managers (install only — users may need to set up tools)
  "brew", "pip", "uv", "cargo", "apt",
];

/** Parse the SKILLBOT_COMMAND_WHITELIST env var. Returns null if whitelist is disabled. */
function loadWhitelist(): Set<string> | null {
  const raw = process.env.SKILLBOT_COMMAND_WHITELIST;
  if (!raw) return null;                            // whitelist disabled
  if (raw === "1" || raw === "true" || raw === "default") return new Set(DEFAULT_WHITELIST);
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

const COMMAND_WHITELIST = loadWhitelist();

/** Extract the base command name from a single shell segment (handles env vars, sudo, paths). */
export function extractBaseCommand(segment: string): string {
  const trimmed = segment.trim();
  if (!trimmed) return "";
  const tokens = trimmed.split(/\s+/);
  for (const tok of tokens) {
    if (tok.includes("=") && !tok.startsWith("-")) continue;  // skip VAR=val
    if (tok === "sudo" || tok === "env" || tok === "nohup" || tok === "time") continue;
    return tok.replace(/^.*\//, "");  // strip path prefix: /usr/bin/curl → curl
  }
  return tokens[0] || "";
}

/** Split a command string into individual command segments (handles |, &&, ||, ;). */
export function splitCommandSegments(command: string): string[] {
  return command.split(/\s*(?:\|\||&&|[|;])\s*/).map((s) => s.trim()).filter(Boolean);
}

const restrictToWorkspace = !!process.env.SKILLBOT_RESTRICT_WORKSPACE;

export function guardCommand(command: string, workdir: string): string | null {
  // Layer 1: Deny patterns (always active)
  for (const p of DENY_PATTERNS) {
    if (p.test(command)) {
      dbg("safety:deny", { command: command.slice(0, 100), pattern: p.source });
      return "Error: Command blocked by safety guard (dangerous pattern detected).";
    }
  }

  // Layer 2: Command whitelist (when enabled)
  if (COMMAND_WHITELIST) {
    const segments = splitCommandSegments(command);
    for (const seg of segments) {
      const base = extractBaseCommand(seg);
      if (base && !COMMAND_WHITELIST.has(base)) {
        dbg("safety:whitelist-deny", { command: command.slice(0, 100), rejected: base });
        return `Error: Command "${base}" is not in the allowed command list. Set SKILLBOT_COMMAND_WHITELIST to adjust.`;
      }
    }
  }

  // Layer 3: Workspace restriction (when enabled)
  if (restrictToWorkspace) {
    if (command.includes("../") || command.includes("..\\"))
      return "Error: Command blocked — path traversal not allowed in restricted mode.";
    const absMatches = command.match(/(?:^|[\s|>])\/[^\s"'>]+/g);
    if (absMatches) {
      const cwd = path.resolve(workdir);
      for (const raw of absMatches) {
        const p = raw.trim();
        if (/^\/(dev\/null|tmp|usr|bin|etc|proc|var)/.test(p)) continue;
        try { if (!path.resolve(p).startsWith(cwd)) return `Error: Command blocked — path "${p}" is outside workspace.`; } catch {}
      }
    }
  }
  return null;
}

/** Bash tool — executes shell commands. */
export function createBashTool(): ToolDef {
  return {
    name: "bash",
    description: "Execute a shell command and return its output. Use for any CLI task.",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to execute" },
        workdir: { type: "string", description: "Working directory (optional)" },
        timeout: { type: "number", description: "Timeout in seconds (default 30)" },
      },
      required: ["command"],
    },
    execute: async (args) => {
      const command = args.command as string;
      const workdir = (args.workdir as string) || process.cwd();
      const timeout = ((args.timeout as number) || 30) * 1000;
      const blocked = guardCommand(command, workdir);
      if (blocked) return blocked;
      try {
        const out = execSync(command, { cwd: workdir, timeout, encoding: "utf-8", maxBuffer: 1024 * 1024, stdio: ["pipe", "pipe", "pipe"] });
        return out.trim() || "(no output)";
      } catch (err: unknown) {
        const e = err as { stderr?: string; message?: string; status?: number };
        return `Error (exit ${e.status ?? 1}): ${(e.stderr?.trim() || e.message || "Command failed")}`;
      }
    },
  };
}

/** Get bash tools. Mock mode: commands are pattern-matched. */
export function createTools(mock = false): ToolDef[] {
  return [mock ? createMockBashTool() : createBashTool()];
}

/** Convert ToolDef[] to OpenAI function tool format. */
export function toolsToOpenAI(tools: ToolDef[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

// ── Spawn (subagent) tool ──
export interface SpawnOpts {
  tools: ToolDef[];
  projectRoot: string;
  getSession: (key: string) => { history: Message[] };
  channelSend: (text: string) => void;
  sessionKey: string;
}

export function createSpawnTool(opts: SpawnOpts): ToolDef {
  return {
    name: "spawn",
    description: "Spawn a background subagent for complex or time-consuming tasks. Reports results when done.",
    parameters: {
      type: "object",
      properties: {
        task: { type: "string", description: "Detailed task description for the subagent" },
        label: { type: "string", description: "Short label for tracking (optional)" },
      },
      required: ["task"],
    },
    execute: async (args) => {
      const task = args.task as string;
      if (!task) return "Error: task is required.";
      const label = (args.label as string) || task.slice(0, 40);
      dbg("spawn:start", { label });
      const sysPrompt = `You are a focused subagent. Complete ONLY the assigned task.\nUse the bash tool as needed. Be concise.\nWorkspace: ${opts.projectRoot}`;
      (async () => {
        try {
          const msgs = await chat([{ role: "user", content: task }], { systemPrompt: sysPrompt, tools: opts.tools, maxToolRounds: 15 });
          const reply = [...msgs].reverse().find((m) => m.role === "assistant" && m.content);
          const result = reply?.content || "Task completed (no output).";
          dbg("spawn:done", { label, len: result.length });
          opts.getSession(opts.sessionKey).history.push({
            role: "user",
            content: `[Subagent "${label}" completed]\n\nResult:\n${result}\n\nSummarize for the user.`,
          });
          opts.channelSend(`Subagent "${label}" finished.`);
        } catch (err) {
          dbg("spawn:error", { label, error: err instanceof Error ? err.message : String(err) });
          opts.channelSend(`Subagent "${label}" failed.`);
        }
      })();
      return `Subagent "${label}" started. You'll be notified when it completes.`;
    },
  };
}

export { createMockSpawnTool } from "./mock.js";
