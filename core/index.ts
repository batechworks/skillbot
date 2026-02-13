import fs from "node:fs";
import path from "node:path";
import { loadSkills, buildSystemPrompt } from "./skills.js";
import { createTools, createSpawnTool, createMockSpawnTool } from "./tools.js";
import { chat } from "./llm.js";
import { getModelConfig } from "./models.js";
import { getSession, appendMessages, resetSession, loadPersistedSessions, needsCompaction, compactSession } from "./session.js";
import { createCLIChannel } from "./channel.js";
import { createIMessageChannel } from "./channel-imessage.js";
import { createTelegramChannel } from "./channel-telegram.js";
import { createDiscordChannel } from "./channel-discord.js";
import { createSlackChannel } from "./channel-slack.js";
import { dbg, isDebug } from "./debug.js";
import type { ToolDef } from "./types.js";

// ── Load .env (zero-dependency) ──
const envPath = path.resolve(import.meta.dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DEFAULT_KEY = "cli-default";
const isMock = !!process.env.SKILLBOTS_MOCK;

async function main() {
  loadPersistedSessions();
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const skillsDir = path.join(projectRoot, "skills");
  const skills = loadSkills(skillsDir);
  const config = getModelConfig();
  console.log(`Loaded ${skills.length} skills | provider: ${config.name} | model: ${config.model}`);
  if (isMock) console.log("MOCK MODE — bash commands are simulated.\n");

  // Channel
  const ch = process.env.SKILLBOTS_CHANNEL;
  const channel = ch === "telegram" ? createTelegramChannel() : ch === "imessage" ? createIMessageChannel()
    : ch === "discord" ? createDiscordChannel() : ch === "slack" ? createSlackChannel() : createCLIChannel();

  // Tools
  const bashTools = createTools(isMock);
  const spawnTool: ToolDef = isMock ? createMockSpawnTool()
    : createSpawnTool({ tools: bashTools, projectRoot, getSession, channelSend: (t) => channel.send(t), sessionKey: DEFAULT_KEY });
  const tools: ToolDef[] = [...bashTools, spawnTool];

  // Heartbeat
  const hbInterval = Number(process.env.SKILLBOTS_HEARTBEAT_INTERVAL) || 30 * 60 * 1000;
  if (!isMock && hbInterval > 0) {
    setInterval(() => {
      const file = path.join(projectRoot, "HEARTBEAT.md");
      if (!fs.existsSync(file)) return;
      const content = fs.readFileSync(file, "utf-8").trim();
      if (!content || content.split("\n").every((l) => !l.trim() || l.startsWith("#") || l.startsWith("<!--"))) return;
      dbg("heartbeat:fire", "actionable content found");
      const session = getSession(DEFAULT_KEY);
      session.history.push({ role: "user", content: "Read HEARTBEAT.md and follow any instructions. Reply HEARTBEAT_OK if nothing needs attention." });
      const sp = buildSystemPrompt(skills, projectRoot);
      chat(session.history, { systemPrompt: sp, tools }).then((msgs) => {
        appendMessages(DEFAULT_KEY, msgs);
        const reply = [...msgs].reverse().find((m) => m.role === "assistant" && m.content);
        if (reply?.content && !reply.content.includes("HEARTBEAT_OK")) channel.send(reply.content);
      }).catch((e) => dbg("heartbeat:error", e instanceof Error ? e.message : String(e)));
    }, hbInterval);
    dbg("heartbeat:start", `interval ${hbInterval / 1000}s`);
  }

  if (isDebug()) {
    const sp = buildSystemPrompt(skills, projectRoot);
    dbg("prompt", sp.slice(0, 1500) + (sp.length > 1500 ? "..." : ""));
    dbg("tools", tools.map((t) => t.name));
  }

  // Main message handler
  channel.start(async (text, sessionKey) => {
    const key = sessionKey || DEFAULT_KEY;
    if (text === "/reset") { resetSession(key); return; }
    if (text === "/compact") {
      const sp = buildSystemPrompt(skills, projectRoot);
      channel.send("(compacting...)");
      await compactSession(key, { chatFn: chat, systemPrompt: sp, tools });
      channel.send("Conversation compacted.");
      return;
    }

    const systemPrompt = buildSystemPrompt(skills, projectRoot);
    const session = getSession(key);
    session.history.push({ role: "user", content: text });

    try {
      const newMsgs = await chat(session.history, { systemPrompt, tools });
      appendMessages(key, newMsgs);
      const reply = [...newMsgs].reverse().find((m) => m.role === "assistant" && m.content);
      channel.send(reply?.content || "(no response)");
      if (needsCompaction(key, systemPrompt.length / 4)) {
        channel.send("(compacting...)");
        await compactSession(key, { chatFn: chat, systemPrompt, tools });
      }
    } catch (err) {
      channel.send(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });
}

main();
