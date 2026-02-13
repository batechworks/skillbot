<div align="center">
  <img src="static/skillbot_icon.jpg" alt="skillbot" width="180">
  <br><br>
  <p>A personal AI assistant where every capability is a Markdown file — plain English instructions, not code.</p>
  <p>
    <img src="https://img.shields.io/badge/core-815_lines-blue?style=for-the-badge" alt="Core Lines">
    <img src="https://img.shields.io/badge/skills-33_markdown-orange?style=for-the-badge" alt="Skills">
    <img src="https://img.shields.io/badge/npm_dep-1_(openai)-green?style=for-the-badge" alt="npm Dependencies">
  </p>
  <p>
    <a href="https://github.com/batechworks/skillbot/stargazers"><img src="https://img.shields.io/github/stars/batechworks/skillbot?style=flat-square" alt="Stars"></a>
    <a href="https://github.com/batechworks/skillbot/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License"></a>
    <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/node-≥18-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node">
  </p>
</div>

---

## ✨ Why skillbot?

The insight is simple: **LLMs can read instructions**. Instead of writing TypeScript/Python code that calls APIs, parses responses, and handles errors — write a Markdown file with plain English instructions and examples. The LLM reads the instructions and decides what commands to run.

```
Traditional:  User → Code → API → Parse → Format → User     (hundreds of lines per feature)
skillbot:     User → LLM → bash → tool/API → LLM → User     (one .md file per feature)
```

Skills are **declarative, not procedural** — you describe *what* to do, not *how* to implement it. There's no control flow, error handling, or parsing logic in a skill file. The LLM handles all of that.

This works because:
- Many services have CLIs (`gh`, `curl`, `docker`, `git`, `himalaya`, ...) or REST APIs
- LLMs are excellent at following structured instructions and adapting to context
- Markdown is the most readable format for both humans and LLMs
- Skills can use `curl` for direct HTTP API calls just as easily as CLI tools

### Comparison

| | [OpenClaw](https://github.com/nicepkg/openclaw) | [nanobot](https://github.com/AgenTuring/nanobot) | **skillbot** |
|---|---|---|---|
| Core code | ~300,000 lines (TS) | ~3,500 lines (Python) | **815 lines (TS)** |
| Skills | 52 (complex plugin system) | 7 (Markdown) | **33 (pure Markdown)** |
| npm dependencies | 200+ packages | 21 Python packages | **1** (`openai` SDK) |
| Runtime deps | Self-contained | Self-contained | CLI tools per skill (curl, gh, etc.) |
| Tools | 50+ custom implementations | ~10 custom tools | **2** (`bash` + `spawn`) |
| Add a feature | Write TypeScript plugin | Write Python module | **Write a `.md` file** |
| Security | Sandboxed | Partial | **Deny-list + opt-in whitelist** |
| Mock testing | Vitest + fixtures | Partial | **Full coverage, all 33 skills** |

> **Trade-off**: skillbot's 815-line core doesn't implement integrations — it delegates to existing CLI tools and HTTP APIs. The complexity moves from application code to Markdown instructions that the LLM interprets. This is intentional: less code to maintain, but you need the underlying tools installed.
>
> Inspired by [OpenClaw](https://github.com/nicepkg/openclaw) and [nanobot](https://github.com/AgenTuring/nanobot).

---

## 🚀 Quick Start

```bash
git clone <repo-url> skillbot && cd skillbot
npm install
```

Create `.env`:

```env
SKILLBOT_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

Start chatting:

```bash
npm start
```

That's it. You have an AI assistant with 33 skills, persistent memory, background agents, and auto-compaction.

---

## 🏗️ Architecture

<p align="center">
  <img src="static/skillbot_architecture.png" alt="skillbot architecture" width="800">
</p>

The entire core is **9 files, 815 lines**. Every feature — from weather queries to market analysis to smart home control — is a Markdown skill that teaches the LLM what commands to run.

---

## 🧩 Features

| Feature | How it works |
|---------|-------------|
| **Persistent Memory** | Dual-layer Markdown: `MEMORY.md` + daily logs |
| **Auto-Compaction** | LLM summarizes history when approaching context limit |
| **Background Agents** | `spawn` tool runs subagents with isolated context |
| **Heartbeat** | Reads `HEARTBEAT.md` periodically for proactive task execution |
| **Safety Guards** | Deny-list + opt-in command whitelist + workspace sandboxing |
| **Interleaved Reflection** | LLM reflects between tool rounds for better reasoning |
| **Session Persistence** | JSONL sessions survive restarts |
| **9 LLM Providers** | Azure, OpenAI, Anthropic, DeepSeek, Gemini, OpenRouter, Groq, Moonshot, local |
| **5 Chat Channels** | CLI, Telegram, Discord, Slack, iMessage |

---

## 🎯 Skills (33)

| Category | Skills | Platform |
|----------|--------|----------|
| **Productivity** | weather · scheduler · file-ops · system-info | 🌐 Cross-platform |
| **Development** | github · coding-agent · tmux | 🌐 Cross-platform |
| **Communication** | email · google-workspace | 🌐 Cross-platform |
| **Intelligence** | memory · market-data · web-search · summarize · obsidian | 🌐 Cross-platform |
| **Media** | spotify · image-gen · whisper · voice · pdf-edit | 🌐 Cross-platform |
| **Smart Home** | smart-home | 🌐 Cross-platform |
| **System** | subagent · heartbeat · skill-creator · security · context-manager · persona | 🌐 Cross-platform |
| **macOS** | calendar · notifications · clipboard · screenshot · imessage · apple-notes · apple-reminders | 🍎 macOS only |

> **26 of 33 skills** are cross-platform (use `curl`, `gh`, `himalaya`, etc.). The 7 macOS-specific skills use native APIs (AppleScript, screencapture, pbcopy). Contributing Linux/Windows equivalents is welcome!

### Creating a new skill

```bash
cat > skills/docker.md << 'EOF'
---
name: docker
description: Manage Docker containers, images, and compose stacks
---

# Docker

## List containers
docker ps -a

## Build and run
docker compose up -d
EOF
```

Done. No code changes needed. The bot can now manage Docker.

---

## 🔑 Key Design

<details>
<summary><b>1. Skill-Driven Memory</b> — dual-layer Markdown, not a hardcoded system</summary>

Most agents hardcode memory into the runtime. skillbot uses a **dual-layer Markdown memory** that the LLM manages itself:

- `MEMORY.md` — long-term facts (user preferences, important context)
- `memory/YYYY-MM-DD.md` — daily interaction logs
- Search with `grep -ri "keyword" MEMORY.md memory/`

The memory skill (`always: true`) is injected into every prompt, so the LLM proactively saves and retrieves context. Before auto-compaction, it flushes important context to daily logs — no memory is ever lost.

</details>

<details>
<summary><b>2. On-Demand Skill Loading</b> — small prompts, full capability</summary>

Only `always: true` skills (memory, context-manager, persona, security) are fully injected into the system prompt. All other skills show only their name and one-line description in a catalog. When the LLM needs a skill, it reads the file:

```bash
cat skills/market-data.md
```

This keeps the prompt small (~2K tokens for the catalog vs ~30K if all skills were injected), while giving the LLM access to 33 capabilities.

</details>

<p align="center">
  <img src="static/skillbot_skill_loading.jpg" alt="On-Demand Skill Loading" width="800">
</p>

<details>
<summary><b>3. Persona System</b> — SOUL.md + USER.md</summary>

Two Markdown files define who the bot is and who it's talking to:

```bash
cp SOUL.md.example SOUL.md   # Bot identity, tone, boundaries
cp USER.md.example USER.md   # User profile, preferences
```

Both are injected at the top of every system prompt. Change the bot's personality by editing a file.

</details>

<details>
<summary><b>4. Two Tools, Infinite Capabilities</b></summary>

Instead of building custom tool implementations for each integration, skillbot has exactly two tools:

- **`bash`** — execute any shell command (with three-layer safety: deny-list → whitelist → workspace restriction)
- **`spawn`** — run a background subagent for complex tasks

Everything else (`curl`, `gh`, `docker`, `crontab`, ...) is accessed through bash, guided by skills. Skills can use **HTTP APIs directly** via `curl` — there's no requirement to install CLI tools. Many built-in skills (weather, market-data, image-gen, web-search) already use `curl` with no extra dependencies.

</details>

---

## 🌐 Providers

| Provider | Env Var | Default Model |
|----------|---------|---------------|
| Azure OpenAI | `AZURE_OPENAI_API_KEY` | gpt-5.2 |
| OpenAI | `OPENAI_API_KEY` | gpt-4o-mini |
| Anthropic | `ANTHROPIC_API_KEY` | claude-sonnet-4 |
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek-chat |
| Gemini | `GEMINI_API_KEY` | gemini-2.0-flash |
| OpenRouter | `OPENROUTER_API_KEY` | openai/gpt-4o |
| Groq | `GROQ_API_KEY` | llama-3.3-70b |
| Moonshot | `MOONSHOT_API_KEY` | moonshot-v1-8k |
| Local (vLLM) | `VLLM_BASE_URL` | default |

<details>
<summary><b>Local Models (vLLM)</b></summary>

```bash
vllm serve meta-llama/Llama-3.1-8B-Instruct --port 8000

echo 'SKILLBOT_PROVIDER=local' >> .env
echo 'VLLM_BASE_URL=http://localhost:8000/v1' >> .env

npm start
```

</details>

---

## 💬 Chat Channels

| Channel | Script | Setup |
|---------|--------|-------|
| CLI | `npm start` | Built-in |
| Telegram | `npm run telegram` | `TELEGRAM_BOT_TOKEN` from @BotFather |
| Discord | `npm run discord` | Bot token + MESSAGE CONTENT intent |
| Slack | `npm run slack` | `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` (Socket Mode) |
| iMessage | `npm run imessage` | macOS + `imsg` CLI |

---

## ⚙️ Configuration

All config via `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SKILLBOT_PROVIDER` | `azure` | LLM provider name |
| `SKILLBOT_CHANNEL` | CLI | `telegram`, `discord`, `slack`, `imessage` |
| `SKILLBOT_MOCK` | — | `1` for mock mode |
| `SKILLBOT_DEBUG` | — | `1` for debug logging |
| `SKILLBOT_COMMAND_WHITELIST` | — | `default` or comma-separated list (see Security) |
| `SKILLBOT_RESTRICT_WORKSPACE` | — | `1` to sandbox commands to project dir |
| `SKILLBOT_HEARTBEAT_INTERVAL` | `1800000` | Heartbeat interval in ms (0 to disable) |
| `SKILLBOT_CONTEXT_WINDOW` | `128000` | Context window size for auto-compaction |

### CLI Commands

| Command | Description |
|---------|-------------|
| `/reset` | Clear conversation history |
| `/compact` | Manually trigger compaction |
| `/quit` | Exit CLI |

---

## 🔒 Security

skillbot executes shell commands — that's the point. Security is addressed with **three independent layers**:

| Layer | Mode | What it does |
|-------|------|-------------|
| **Deny-list** | Always on | Blocks known destructive patterns (`rm -rf /`, `mkfs`, fork bombs, etc.) |
| **Command whitelist** | Opt-in | Only whitelisted base commands may execute. Unknown commands are rejected. |
| **Workspace restriction** | Opt-in | All file paths must stay within the project directory. |

### Recommended production config

```env
SKILLBOT_COMMAND_WHITELIST=default   # use built-in whitelist (curl, gh, cat, echo, ...)
SKILLBOT_RESTRICT_WORKSPACE=1        # sandbox to project dir
```

**Why whitelist > deny-list**: Deny-lists can never cover all attack vectors (base64-encoded payloads, aliased commands, etc.). A whitelist is sound security — if a command isn't on the list, it doesn't run. The built-in default whitelist covers all commands used by the 33 shipped skills plus common shell utilities.

Custom whitelist example:

```env
SKILLBOT_COMMAND_WHITELIST=curl,cat,echo,grep,ls,gh,python3,node
```

---

## 🖥️ Platform

The core runtime (Node.js + TypeScript) runs on **macOS, Linux, and Windows**.

Skills are tagged with `platform:` in their frontmatter:

| Platform | Skills | Examples |
|----------|--------|---------|
| 🌐 **cross-platform** | 26 | weather (curl), github (gh), email (himalaya), market-data (curl), whisper (pip) |
| 🍎 **macos** | 7 | calendar (AppleScript), clipboard (pbcopy), screenshot (screencapture) |

Skills that use CLI tools list install commands for multiple package managers where available (brew, apt, pip, cargo). Many skills use only `curl` for HTTP APIs and have **zero additional dependencies**.

**Contributing**: Linux/Windows equivalents for macOS skills (e.g. `xclip` for clipboard, `notify-send` for notifications) are welcome as PRs.

---

## 🧪 Testing

```bash
# Deterministic unit tests (no API key, <1 second)
npm run test-unit

# Integration tests with mock tools (needs API key for LLM)
npm run test-skills

# Interactive mock mode
npm run mock
```

---

## 📁 Project Structure

```
skillbot/
├── core/               # Core agent (815 lines in 9 files)
│   ├── index.ts        #   Entry point, heartbeat, wiring
│   ├── llm.ts          #   LLM client with reflection
│   ├── tools.ts        #   bash + spawn tools, 3-layer security
│   ├── session.ts      #   Persistent sessions + auto-compaction
│   ├── skills.ts       #   Skill loader + prompt builder
│   ├── models.ts       #   9-provider registry
│   ├── channel.ts      #   CLI channel + interface
│   ├── types.ts        #   Core type definitions
│   ├── debug.ts        #   Debug logging
│   ├── channel-*.ts    #   Telegram, Discord, Slack, iMessage
│   ├── mock.ts         #   Mock tools for testing
│   ├── test-unit.ts    #   Unit tests
│   └── test-skills.ts  #   Integration tests
├── skills/             # 33 Markdown skills (26 cross-platform, 7 macOS)
├── SOUL.md.example     # Bot persona template
├── USER.md.example     # User profile template
└── package.json        # 1 npm dependency (openai)
```

---

<p align="center"><b>Skill is all you need.</b></p>
