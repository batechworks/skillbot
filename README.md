# skillBots

**Skill is all you need.**

A personal AI assistant where capabilities live in Markdown files, not code. Inspired by [OpenClaw](https://github.com/nicepkg/openclaw) and [nanobot](https://github.com/AgenTuring/nanobot), skillBots pushes the "skill-as-code" philosophy to its logical extreme: **815 lines of core TypeScript** replaces what took 300,000+ lines in OpenClaw and 8,500+ in nanobot — with the same features.

> Every new capability is a `.md` file. No code changes, no redeployment, no dependencies.

```
Core:  815 lines  ·  33 skills  ·  9 providers  ·  5 channels  ·  1 dependency
```

## Why skillBots?

| | OpenClaw | nanobot | **skillBots** |
|---|---|---|---|
| Core code | ~300,000 lines (TS) | ~8,500 lines (Python) | **815 lines (TS)** |
| Skills | 52 (complex plugin system) | 0 (hardcoded) | **33 (pure Markdown)** |
| Dependencies | 200+ npm packages | 21 Python packages | **1** (`openai` SDK) |
| Tools | 50+ custom implementations | ~10 custom tools | **2** (`bash` + `spawn`) |
| Add a feature | Write TypeScript plugin | Write Python module | **Write a `.md` file** |
| Mock testing | Vitest + fixtures | Partial | **Full coverage, all 33 skills** |
| Setup time | ~30 min | ~10 min | **< 2 min** |

### How is this possible?

The insight is simple: **LLMs can read instructions**. Instead of writing code that calls APIs, parses responses, and handles errors — write a Markdown file that tells the LLM *how to use existing CLI tools*. The LLM becomes the integration layer.

```
Traditional:  User → Code → API → Parse → Format → User     (hundreds of lines per feature)
skillBots:    User → LLM → bash → CLI tool → LLM → User     (one .md file per feature)
```

This works because:
- Most tools already have CLIs (`gh`, `curl`, `docker`, `git`, `crontab`, ...)
- LLMs are excellent at following structured instructions
- Markdown is the most readable format for both humans and LLMs

## Quick Start

```bash
git clone <repo-url> skillBots && cd skillBots
npm install
```

Create `.env`:

```env
SKILLBOTS_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
```

Start chatting:

```bash
npm start
```

That's it. You have an AI assistant with 33 skills, persistent memory, background agents, and auto-compaction.

## Architecture

```
┌───────────────────────────────────────────┐
│ Channels: CLI · Telegram · Discord        │
│           Slack · iMessage                │
├───────────────────────────────────────────┤
│          Core (815 lines total)           │
│                                           │
│  index.ts ─── llm.ts ─── tools.ts        │
│     │          │            │             │
│  session.ts  skills.ts   models.ts        │
│     │                                     │
│  channel.ts  types.ts   debug.ts          │
├───────────────────────────────────────────┤
│       33 Skills (pure Markdown)           │
│  weather · github · memory · coding-agent │
│  market-data · scheduler · subagent · ... │
├───────────────────────────────────────────┤
│       2 Tools: bash · spawn               │
└───────────────────────────────────────────┘
```

The entire core is 9 files. Every feature — from weather queries to market analysis to smart home control — is a Markdown skill that teaches the LLM what commands to run.

## Key Design Advantages

### 1. Skill-Driven Memory (vs hardcoded memory systems)

Most agents hardcode memory into the runtime. skillBots uses a **dual-layer Markdown memory** that the LLM manages itself:

- `MEMORY.md` — long-term facts (user preferences, important context)
- `memory/YYYY-MM-DD.md` — daily interaction logs
- Search with `grep -ri "keyword" MEMORY.md memory/`

The memory skill (`always: true`) is injected into every prompt, so the LLM proactively saves and retrieves context. Before auto-compaction, it flushes important context to daily logs — no memory is ever lost.

### 2. On-Demand Skill Loading (vs bloated prompts)

Only `always: true` skills (memory, context-manager, persona, security) are fully injected into the system prompt. All other skills show only their name and one-line description in a catalog. When the LLM needs a skill, it reads the file:

```
cat skills/market-data.md
```

This keeps the prompt small (~2K tokens for the catalog vs ~30K if all skills were injected), while giving the LLM access to 33 capabilities.

### 3. Persona System (SOUL.md + USER.md)

Two Markdown files define who the bot is and who it's talking to:

```bash
cp SOUL.md.example SOUL.md   # Bot identity, tone, boundaries
cp USER.md.example USER.md   # User profile, preferences
```

Both are injected at the top of every system prompt. Change the bot's personality by editing a file.

### 4. Two Tools, Infinite Capabilities

Instead of building custom tool implementations for each integration, skillBots has exactly two tools:

- **`bash`** — execute any shell command (with safety guards)
- **`spawn`** — run a background subagent for complex tasks

Everything else (`curl`, `gh`, `docker`, `crontab`, `osascript`, ...) is accessed through bash, guided by skills. This means skillBots can do anything your shell can do — which is effectively everything.

### 5. Comprehensive Mock Testing

Every skill can be tested without real execution:

```bash
npm run test-unit     # 56 deterministic tests, <1 second, no API key needed
npm run test-skills   # 33 skill smoke tests + 4 complex scenario tests
```

The mock system pattern-matches bash commands and returns realistic fake outputs. Complex scenarios test multi-turn reasoning, compaction flow, subagent spawning, and on-demand skill loading.

## Features

| Feature | How it works |
|---------|-------------|
| **Persistent Memory** | Dual-layer Markdown: `MEMORY.md` + daily logs |
| **Auto-Compaction** | LLM summarizes history when approaching context limit |
| **Background Agents** | `spawn` tool runs subagents with isolated context |
| **Heartbeat** | Reads `HEARTBEAT.md` periodically for proactive task execution |
| **Safety Guards** | Dangerous commands blocked; optional workspace sandboxing |
| **Interleaved Reflection** | LLM reflects between tool rounds for better reasoning |
| **Session Persistence** | JSONL sessions survive restarts |
| **9 LLM Providers** | Azure, OpenAI, Anthropic, DeepSeek, Gemini, OpenRouter, Groq, Moonshot, local |
| **5 Chat Channels** | CLI, Telegram, Discord, Slack, iMessage |

## Skills (33)

| Category | Skills |
|----------|--------|
| **Productivity** | weather · calendar · scheduler · notifications · clipboard · screenshot |
| **Development** | github · coding-agent · tmux · file-ops · system-info |
| **Communication** | email · imessage · google-workspace |
| **Intelligence** | memory · market-data · web-search · summarize · obsidian |
| **Media** | spotify · image-gen · whisper · voice · pdf-edit |
| **Smart Home** | smart-home · apple-notes · apple-reminders |
| **System** | subagent · heartbeat · skill-creator · security · context-manager · persona |

### Creating a new skill

```bash
cat > skills/docker.md << 'EOF'
---
name: docker
description: Manage Docker containers, images, and compose stacks
---

# Docker

## List containers
```bash
docker ps -a
```

## Build and run
```bash
docker compose up -d
```
EOF
```

Done. No code changes needed. The bot can now manage Docker.

## Providers

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

## Chat Channels

| Channel | Script | Setup |
|---------|--------|-------|
| CLI | `npm start` | Built-in |
| Telegram | `npm run telegram` | `TELEGRAM_BOT_TOKEN` from @BotFather |
| Discord | `npm run discord` | Bot token + MESSAGE CONTENT intent |
| Slack | `npm run slack` | `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` (Socket Mode) |
| iMessage | `npm run imessage` | macOS + `imsg` CLI |

## Configuration

All config via `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SKILLBOTS_PROVIDER` | `azure` | LLM provider name |
| `SKILLBOTS_CHANNEL` | CLI | `telegram`, `discord`, `slack`, `imessage` |
| `SKILLBOTS_MOCK` | — | `1` for mock mode |
| `SKILLBOTS_DEBUG` | — | `1` for debug logging |
| `SKILLBOTS_RESTRICT_WORKSPACE` | — | `1` to sandbox commands to project dir |
| `SKILLBOTS_HEARTBEAT_INTERVAL` | `1800000` | Heartbeat interval in ms (0 to disable) |
| `SKILLBOTS_CONTEXT_WINDOW` | `128000` | Context window size for auto-compaction |

## Testing

```bash
# Deterministic unit tests (no API key, <1 second)
npm run test-unit

# Integration tests with mock tools (needs API key for LLM)
npm run test-skills

# Interactive mock mode
npm run mock
```

## Project Structure

```
skillBots/
├── core/               # Core agent (815 lines in 9 files)
│   ├── index.ts        #   Entry point, heartbeat, wiring
│   ├── llm.ts          #   LLM client with reflection
│   ├── tools.ts        #   bash + spawn tools, safety guards
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
├── skills/             # 33 Markdown skills
├── SOUL.md.example     # Bot persona template
├── USER.md.example     # User profile template
└── package.json        # 1 dependency (openai)
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `/reset` | Clear conversation history |
| `/compact` | Manually trigger compaction |
| `/quit` | Exit CLI |

## Local Models

```bash
vllm serve meta-llama/Llama-3.1-8B-Instruct --port 8000

echo 'SKILLBOTS_PROVIDER=local' >> .env
echo 'VLLM_BASE_URL=http://localhost:8000/v1' >> .env

npm start
```

## Comparison with OpenClaw and nanobot

| Dimension | OpenClaw | nanobot | skillBots |
|-----------|----------|---------|-----------|
| Language | TypeScript | Python | TypeScript |
| Core code | ~300,000 lines | ~8,500 lines | **815 lines** |
| Approach | Plugin system | Monolithic agent | **Markdown skills** |
| Skills | 52 (TS plugins) | 0 (built-in) | **33 (pure .md)** |
| Dependencies | 200+ packages | 21 packages | **1 package** |
| Tools | 50+ custom | ~10 custom | **2 (bash + spawn)** |
| Memory | Custom DB | Markdown files | **Dual-layer Markdown + grep** |
| Auto-compaction | No | No | **Yes** |
| Mock testing | Partial | Partial | **Full (all skills)** |
| Add a feature | Write TS plugin | Write Python | **Write .md file** |

skillBots proves that with the right abstraction — Markdown skills + a minimal LLM loop — you can match the functionality of projects 100-300x larger.

---

<p align="center"><b>Skill is all you need.</b></p>
