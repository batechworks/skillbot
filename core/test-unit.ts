/**
 * Deterministic unit tests — no LLM calls, no API key needed, runs in <1 second.
 *
 * Usage: npx tsx core/test-unit.ts
 */
import fs from "node:fs";
import path from "node:path";
import { loadSkills, parseFrontmatter, buildSystemPrompt } from "./skills.js";
import { createBashTool, extractBaseCommand, splitCommandSegments, guardCommand } from "./tools.js";
import {
  getSession, appendMessages, resetSession, estimateTokens, needsCompaction,
} from "./session.js";
import type { Message } from "./types.js";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

// ══════════════════════════════════════════════════════════════════
// 1. Skill Loading
// ══════════════════════════════════════════════════════════════════

function testFrontmatterParsing() {
  console.log("\n--- Frontmatter Parsing ---");

  const { meta, body } = parseFrontmatter("---\nname: test\ndescription: A test skill\nalways: true\n---\n\n# Body\nHello");
  assert("parses name", meta.name === "test");
  assert("parses description", meta.description === "A test skill");
  assert("parses always", meta.always === "true");
  assert("parses body", body.trim().startsWith("# Body"));

  const noFm = parseFrontmatter("# No frontmatter\nJust body.");
  assert("no frontmatter: empty meta", Object.keys(noFm.meta).length === 0);
  assert("no frontmatter: full body", noFm.body.includes("Just body."));
}

function testSkillLoading() {
  console.log("\n--- Skill Loading ---");

  const skillsDir = path.resolve(import.meta.dirname, "..", "skills");
  const skills = loadSkills(skillsDir);

  assert("loads skills", skills.length > 0, `got ${skills.length}`);
  assert("every skill has name", skills.every((s) => s.name.length > 0));
  assert("every skill has body", skills.every((s) => s.body.length > 0));
  assert("has always skills", skills.some((s) => s.always === true));
  assert("has on-demand skills", skills.some((s) => !s.always));

  // Ensure no cron.md skill (was deleted)
  assert("cron.md removed", !skills.some((s) => s.name === "cron"), `found cron: ${skills.map(s => s.name).filter(n => n === 'cron')}`);

  // Non-existent directory returns empty
  const empty = loadSkills("/tmp/nonexistent-skills-dir-12345");
  assert("nonexistent dir returns []", empty.length === 0);
}

function testBuildSystemPrompt() {
  console.log("\n--- Build System Prompt ---");

  const skillsDir = path.resolve(import.meta.dirname, "..", "skills");
  const skills = loadSkills(skillsDir);
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const prompt = buildSystemPrompt(skills, projectRoot);

  assert("prompt not empty", prompt.length > 100);
  assert("contains 'Available Skills'", prompt.includes("Available Skills"));
  assert("contains 'Core Skills'", prompt.includes("Core Skills"));
  assert("contains guidelines", prompt.includes("Guidelines"));
  assert("contains tool instruction", prompt.includes("bash tool"));
}

// ══════════════════════════════════════════════════════════════════
// 2. Safety Guards
// ══════════════════════════════════════════════════════════════════

async function testSafetyGuards() {
  console.log("\n--- Safety Guards ---");

  const tool = createBashTool();

  // Dangerous commands should be blocked
  const dangerous = [
    "rm -rf /",
    "rm -rf ~/Documents",
    "dd if=/dev/zero of=/dev/sda",
    "shutdown -h now",
    "reboot",
    ":(){ :|:& };:",
    "chmod -R 777 /",
    "mkfs.ext4 /dev/sda1",
  ];

  for (const cmd of dangerous) {
    const result = await tool.execute({ command: cmd });
    assert(`blocks: ${cmd.slice(0, 40)}`, result.includes("blocked") || result.includes("Error"), result.slice(0, 80));
  }

  // Safe commands should NOT be blocked (they'll fail since they're real execution, but not blocked by guard)
  const safe = [
    "echo hello",
    "ls -la",
    "date",
  ];

  for (const cmd of safe) {
    const result = await tool.execute({ command: cmd });
    assert(`allows: ${cmd}`, !result.includes("blocked by safety guard"), result.slice(0, 80));
  }
}

// ══════════════════════════════════════════════════════════════════
// 3. Session Management
// ══════════════════════════════════════════════════════════════════

function testSessionCRUD() {
  console.log("\n--- Session CRUD ---");

  const key = "test-unit-session";
  resetSession(key);

  // Create
  const session = getSession(key);
  assert("session created", session.id.startsWith("sess-"));
  assert("empty history", session.history.length === 0);

  // Get same session
  const same = getSession(key);
  assert("returns same session", same.id === session.id);

  // Append
  const msgs: Message[] = [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there!" },
  ];
  appendMessages(key, msgs);
  assert("appended 2 messages", getSession(key).history.length === 2);

  // Append more
  appendMessages(key, [{ role: "user", content: "How are you?" }]);
  assert("appended 3rd message", getSession(key).history.length === 3);

  // Reset
  resetSession(key);
  const fresh = getSession(key);
  assert("reset creates new session", fresh.id !== session.id);
  assert("reset clears history", fresh.history.length === 0);

  resetSession(key);
}

function testTokenEstimation() {
  console.log("\n--- Token Estimation ---");

  const empty: Message[] = [];
  assert("empty = 0 tokens", estimateTokens(empty) === 0);

  const msgs: Message[] = [
    { role: "user", content: "a".repeat(400) },  // 100 tokens
    { role: "assistant", content: "b".repeat(800) },  // 200 tokens
  ];
  const tokens = estimateTokens(msgs);
  assert("estimates ~300 tokens for 1200 chars", tokens >= 250 && tokens <= 350, `got ${tokens}`);
}

function testCompactionThreshold() {
  console.log("\n--- Compaction Threshold ---");

  const key = "test-compact-threshold";
  resetSession(key);

  // Small session should NOT need compaction
  const session = getSession(key);
  session.history.push({ role: "user", content: "Hello" });
  assert("small session: no compaction", !needsCompaction(key, 100));

  // Massive session should trigger compaction (128000 * 0.8 = 102400 tokens)
  for (let i = 0; i < 120; i++) {
    session.history.push({ role: "assistant", content: "x".repeat(4000) }); // ~1000 tokens each = ~120000
  }
  assert("large session: needs compaction", needsCompaction(key, 1000));

  resetSession(key);
}

// ══════════════════════════════════════════════════════════════════
// 4. Spawn Tool Validation
// ══════════════════════════════════════════════════════════════════

async function testSpawnToolValidation() {
  console.log("\n--- Spawn Tool Validation ---");

  const { createMockSpawnTool } = await import("./mock.js");
  const spawnTool = createMockSpawnTool();

  assert("spawn tool name", spawnTool.name === "spawn");
  assert("spawn tool has task param", JSON.stringify(spawnTool.parameters).includes("task"));

  const result = await spawnTool.execute({ task: "Analyze the codebase", label: "Code analysis" });
  assert("spawn returns started message", result.includes("started"), result.slice(0, 80));

  // Empty label falls back to task slice
  const result2 = await spawnTool.execute({ task: "A very long task description that should be truncated" });
  assert("spawn fallback label", result2.includes("started"), result2.slice(0, 80));
}

// ══════════════════════════════════════════════════════════════════
// 5. Mock Bash Tool Coverage
// ══════════════════════════════════════════════════════════════════

async function testMockBashCoverage() {
  console.log("\n--- Mock Bash Coverage ---");

  const { createMockBashTool } = await import("./mock.js");
  const mockBash = createMockBashTool();

  const testCases: [string, string][] = [
    ["curl wttr.in/London", "Weather"],
    ["gh pr list", "OPEN"],
    ["crontab -l", "osascript"],
    ["echo hello world", "hello world"],
    ["cat MEMORY.md", "favorite color"],
    ["cat HEARTBEAT.md", "Recurring Tasks"],
    ["cat skills/weather.md", "weather"],
    ["tmux list-sessions", "mysession"],
    ["df -h", "Filesystem"],
    ["pbpaste", "clipboard"],
    ["screencapture", "Screenshot"],
  ];

  for (const [cmd, expected] of testCases) {
    const result = await mockBash.execute({ command: cmd });
    assert(`mock: ${cmd.slice(0, 40)}`, result.includes(expected), `expected "${expected}" in: ${result.slice(0, 80)}`);
  }

  // Unmatched command
  const unmatched = await mockBash.execute({ command: "some-random-unknown-command-xyz" });
  assert("mock: unmatched returns mock prefix", unmatched.includes("(mock) unmatched"));
}

// ══════════════════════════════════════════════════════════════════
// 6. Command Parsing (whitelist helpers)
// ══════════════════════════════════════════════════════════════════

function testCommandParsing() {
  console.log("\n--- Command Parsing ---");

  // extractBaseCommand
  assert("simple command", extractBaseCommand("curl wttr.in") === "curl");
  assert("with path prefix", extractBaseCommand("/usr/bin/curl wttr.in") === "curl");
  assert("with env vars", extractBaseCommand("LANG=en curl wttr.in") === "curl");
  assert("with sudo", extractBaseCommand("sudo apt install gh") === "apt");
  assert("with nohup", extractBaseCommand("nohup python3 script.py") === "python3");

  // splitCommandSegments
  const piped = splitCommandSegments("curl wttr.in | head -5");
  assert("pipe splits into 2", piped.length === 2);
  assert("pipe first cmd", piped[0].startsWith("curl"));
  assert("pipe second cmd", piped[1].startsWith("head"));

  const chained = splitCommandSegments("mkdir -p dir && cd dir && ls");
  assert("&& splits into 3", chained.length === 3);

  const orChain = splitCommandSegments("command1 || command2");
  assert("|| splits into 2", orChain.length === 2);

  const semicolon = splitCommandSegments("echo hello; echo world");
  assert("; splits into 2", semicolon.length === 2);

  // guardCommand — deny patterns still work without whitelist
  assert("deny rm -rf /", guardCommand("rm -rf /", "/tmp") !== null);
  assert("deny shutdown", guardCommand("shutdown -h now", "/tmp") !== null);
  assert("allow echo", guardCommand("echo hello", "/tmp") === null);
  assert("allow curl", guardCommand("curl wttr.in", "/tmp") === null);
}

// ══════════════════════════════════════════════════════════════════
// 7. Skill Platform Tags
// ══════════════════════════════════════════════════════════════════

function testSkillPlatformTags() {
  console.log("\n--- Skill Platform Tags ---");

  const skillsDir = path.resolve(import.meta.dirname, "..", "skills");
  const files = fs.readdirSync(skillsDir).filter((f) => f.endsWith(".md"));

  let allHavePlatform = true;
  const missing: string[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(skillsDir, file), "utf-8");
    const { meta } = parseFrontmatter(raw);
    if (!meta.platform) {
      allHavePlatform = false;
      missing.push(file);
    }
  }
  assert("all skills have platform tag", allHavePlatform, `missing: ${missing.join(", ")}`);

  // Check specific known tags
  const appleNotes = fs.readFileSync(path.join(skillsDir, "apple-notes.md"), "utf-8");
  assert("apple-notes is macos", parseFrontmatter(appleNotes).meta.platform === "macos");

  const weather = fs.readFileSync(path.join(skillsDir, "weather.md"), "utf-8");
  assert("weather is cross-platform", parseFrontmatter(weather).meta.platform === "cross-platform");
}

// ══════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════

async function main() {
  console.log("\nskillbot Unit Tests (no LLM required)\n" + "=".repeat(50));

  testFrontmatterParsing();
  testSkillLoading();
  testBuildSystemPrompt();
  await testSafetyGuards();
  testSessionCRUD();
  testTokenEstimation();
  testCompactionThreshold();
  await testSpawnToolValidation();
  await testMockBashCoverage();
  testCommandParsing();
  testSkillPlatformTags();

  console.log("\n" + "=".repeat(50));
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
