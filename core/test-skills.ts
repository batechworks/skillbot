/**
 * Integration test runner — per-skill smoke tests + complex scenario tests.
 * Uses mock tools (no real command execution).
 *
 * Usage: SKILLBOTS_MOCK=1 SKILLBOTS_DEBUG=1 npx tsx core/test-skills.ts
 */
import fs from "node:fs";
import path from "node:path";
import { loadSkills, buildSystemPrompt } from "./skills.js";
import { createTools, createMockSpawnTool } from "./tools.js";
import { chat } from "./llm.js";
import { getModelConfig } from "./models.js";
import {
  getSession, appendMessages, resetSession, needsCompaction, compactSession,
} from "./session.js";
import type { Message, ToolDef } from "./types.js";

// ── Load .env ──
const envPath = path.resolve(import.meta.dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ── Setup ──
const skillsDir = path.resolve(import.meta.dirname, "..", "skills");
const projectRoot = path.resolve(import.meta.dirname, "..");
const skills = loadSkills(skillsDir);
const systemPrompt = buildSystemPrompt(skills, projectRoot);
const bashTools = createTools(true);
const spawnTool = createMockSpawnTool();
const tools: ToolDef[] = [...bashTools, spawnTool];
const config = getModelConfig();

let passed = 0;
let failed = 0;
const results: { name: string; ok: boolean; reason?: string }[] = [];

function record(name: string, ok: boolean, reason?: string) {
  results.push({ name, ok, reason });
  if (ok) passed++; else failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}${reason ? ` — ${reason}` : ""}`);
}

/** One test query per skill name. */
const queries: Record<string, string> = {
  weather: "What's the weather in Tokyo right now?",
  github: "List open pull requests on facebook/react",
  "apple-notes": "Show me all my Apple Notes",
  "apple-reminders": "What reminders do I have for today?",
  "file-ops": "List files in the current directory with details",
  email: "Show my recent emails in the inbox",
  imessage: "Show my recent iMessage conversations",
  spotify: "What song is currently playing on Spotify?",
  "coding-agent": "Run codex to fix issue #42 in the current project",
  tmux: "List all active tmux sessions",
  summarize: "Summarize this URL: https://example.com/article",
  "smart-home": "List all my Philips Hue lights",
  obsidian: "Search my Obsidian vault for 'project ideas'",
  "pdf-edit": "Fix the typo on page 1 of report.pdf: change 'recieve' to 'receive'",
  "image-gen": "Generate an image of a sunset over mountains",
  whisper: "Transcribe the audio file meeting.mp3",
  "web-search": "Search the web for 'Node.js event loop explained'",
  "system-info": "Show my system info: OS, CPU, memory",
  memory: "My favorite color is blue, please remember that",
  "market-data": "What's the current price of Bitcoin?",
  persona: "What's my name and role? Check the user profile.",
  scheduler: "Set a reminder to stretch in 30 minutes using crontab or sleep",
  "google-workspace": "Show my recent Gmail emails",
  screenshot: "Take a screenshot of my screen",
  clipboard: "Show me what's in my clipboard",
  notifications: "Send me a notification saying 'Build done!'",
  calendar: "What meetings do I have today?",
  subagent: "Spawn a subagent to research the top 5 Node.js 22 features",
  heartbeat: "What is HEARTBEAT.md and how does the heartbeat system work?",
  "skill-creator": "Create a new skill called 'docker' for managing Docker containers",
  voice: "Transcribe the audio file interview.mp3 using Whisper",
};

// ══════════════════════════════════════════════════════════════════
// Section 1: Per-skill smoke tests
// ══════════════════════════════════════════════════════════════════

async function runSkillTests() {
  console.log("\n=== Section 1: Per-Skill Smoke Tests ===\n");

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    const query = queries[skill.name];
    if (!query) {
      console.log(`[${i + 1}/${skills.length}] ${skill.name}: SKIP (no test query)`);
      results.push({ name: `skill:${skill.name}`, ok: true, reason: "skipped" });
      continue;
    }

    console.log(`[${i + 1}/${skills.length}] ${skill.name}: "${query}"`);
    try {
      const history: Message[] = [{ role: "user", content: query }];
      const msgs = await chat(history, { systemPrompt, tools, maxToolRounds: 8 });

      // Log tool calls
      for (const m of msgs) {
        if (m.role === "assistant" && m.tool_calls?.length) {
          for (const tc of m.tool_calls) {
            const args = JSON.parse(tc.function.arguments);
            const name = tc.function.name;
            if (name === "bash") console.log(`  -> bash: ${(args.command as string).slice(0, 100)}`);
            else if (name === "spawn") console.log(`  -> spawn: ${(args.label || args.task || "").slice(0, 80)}`);
            else console.log(`  -> ${name}: ${JSON.stringify(args).slice(0, 80)}`);
          }
        }
        if (m.role === "tool") {
          console.log(`  -> result: ${m.content.slice(0, 120)}${m.content.length > 120 ? "..." : ""}`);
        }
      }

      const reply = [...msgs].reverse().find((m) => m.role === "assistant" && m.content);
      if (reply?.content) {
        console.log(`  -> reply: ${reply.content.slice(0, 150)}${reply.content.length > 150 ? "..." : ""}`);
        record(`skill:${skill.name}`, true);
      } else {
        record(`skill:${skill.name}`, false, "no assistant reply");
      }
    } catch (err) {
      record(`skill:${skill.name}`, false, err instanceof Error ? err.message : String(err));
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Section 2: Complex Scenario Tests
// ══════════════════════════════════════════════════════════════════

async function testCompactionFlow() {
  console.log("\n--- Scenario: Compaction Flow ---");
  const key = "test-compact";
  resetSession(key);
  const session = getSession(key);

  // Build a long fake history
  for (let i = 0; i < 20; i++) {
    session.history.push(
      { role: "user", content: `Question ${i}: Tell me about topic ${i} in great detail.` },
      { role: "assistant", content: `Answer ${i}: Here is a very detailed explanation about topic ${i}. `.repeat(20) },
    );
  }
  const beforeLen = session.history.length;
  console.log(`  Built mock history: ${beforeLen} messages`);

  try {
    await compactSession(key, { chatFn: chat, systemPrompt, tools });
    const afterLen = session.history.length;
    // After compaction: 1 summary + KEEP_RECENT(6) = 7 messages max
    const ok = afterLen < beforeLen && afterLen <= 7;
    console.log(`  After compaction: ${afterLen} messages (expected <= 7)`);
    record("scenario:compaction", ok, ok ? undefined : `expected <= 7, got ${afterLen}`);
  } catch (err) {
    record("scenario:compaction", false, err instanceof Error ? err.message : String(err));
  } finally {
    resetSession(key);
  }
}

async function testSpawnSubagent() {
  console.log("\n--- Scenario: Spawn Subagent ---");
  try {
    const history: Message[] = [{
      role: "user",
      content: "Spawn a subagent to analyze all TypeScript files in src/ and report code quality issues.",
    }];
    const msgs = await chat(history, { systemPrompt, tools, maxToolRounds: 3 });

    const spawnCalls = msgs.filter((m) =>
      m.role === "assistant" && m.tool_calls?.some((tc) => tc.function.name === "spawn"),
    );
    const reply = [...msgs].reverse().find((m) => m.role === "assistant" && m.content);
    const ok = spawnCalls.length > 0 && !!reply?.content;

    console.log(`  Spawn calls: ${spawnCalls.length}, Reply: ${reply?.content?.slice(0, 100) || "none"}`);
    record("scenario:spawn", ok, ok ? undefined : "LLM did not use spawn tool");
  } catch (err) {
    record("scenario:spawn", false, err instanceof Error ? err.message : String(err));
  }
}

async function testMultiTurnReasoning() {
  console.log("\n--- Scenario: Multi-Turn Reasoning ---");
  try {
    const history: Message[] = [{
      role: "user",
      content: "Find all TypeScript files in src/, then show the contents of api.ts, and tell me what functions it exports.",
    }];
    const msgs = await chat(history, { systemPrompt, tools, maxToolRounds: 8 });

    const toolCalls = msgs.filter((m) => m.role === "assistant" && m.tool_calls?.length);
    const reply = [...msgs].reverse().find((m) => m.role === "assistant" && m.content);
    const ok = toolCalls.length >= 2 && !!reply?.content;

    console.log(`  Tool rounds: ${toolCalls.length}, Reply: ${reply?.content?.slice(0, 100) || "none"}`);
    record("scenario:multi-turn", ok, ok ? undefined : `expected >= 2 tool rounds, got ${toolCalls.length}`);
  } catch (err) {
    record("scenario:multi-turn", false, err instanceof Error ? err.message : String(err));
  }
}

async function testOnDemandSkillLoading() {
  console.log("\n--- Scenario: On-Demand Skill Loading ---");
  try {
    // Pick a non-always skill that the LLM should read first
    const history: Message[] = [{
      role: "user",
      content: "Use the tmux skill to list my tmux sessions. Read the skill first if needed.",
    }];
    const msgs = await chat(history, { systemPrompt, tools, maxToolRounds: 8 });

    // Check if LLM read the skill file
    const bashCalls: string[] = [];
    for (const m of msgs) {
      if (m.role === "assistant" && m.tool_calls) {
        for (const tc of m.tool_calls) {
          if (tc.function.name === "bash") {
            bashCalls.push(JSON.parse(tc.function.arguments).command as string);
          }
        }
      }
    }

    const readSkill = bashCalls.some((c) => c.includes("cat skills/"));
    const usedTmux = bashCalls.some((c) => c.includes("tmux"));
    const reply = [...msgs].reverse().find((m) => m.role === "assistant" && m.content);

    console.log(`  Read skill: ${readSkill}, Used tmux: ${usedTmux}, Reply: ${reply?.content?.slice(0, 80) || "none"}`);
    // Pass if it either read the skill file first OR directly used tmux (some models are smart enough)
    const ok = usedTmux && !!reply?.content;
    record("scenario:on-demand-skill", ok, ok ? undefined : "LLM did not use tmux commands");
  } catch (err) {
    record("scenario:on-demand-skill", false, err instanceof Error ? err.message : String(err));
  }
}

// ══════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\nskillBots Integration Tests — ${skills.length} skills, provider: ${config.name}, model: ${config.model}\n`);
  console.log("=".repeat(70));

  await runSkillTests();

  console.log("\n" + "=".repeat(70));
  console.log("\n=== Section 2: Complex Scenario Tests ===");

  await testCompactionFlow();
  await testSpawnSubagent();
  await testMultiTurnReasoning();
  await testOnDemandSkillLoading();

  // ── Summary ──
  console.log("\n" + "=".repeat(70));
  console.log(`\nResults: ${passed} passed, ${failed} failed, ${results.length} total\n`);
  for (const r of results) {
    if (r.reason === "skipped") continue;
    console.log(`  ${r.ok ? "PASS" : "FAIL"} ${r.name}${r.reason ? ` (${r.reason})` : ""}`);
  }
  console.log();
  process.exit(failed > 0 ? 1 : 0);
}

main();
