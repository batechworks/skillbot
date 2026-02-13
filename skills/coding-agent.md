---
name: coding-agent
description: Run coding agents (Codex CLI, Claude Code, Pi) for automated coding tasks, PR reviews, and parallel issue fixing.
platform: cross-platform
---

# Coding Agent

Use bash to launch coding agents for programming tasks. Supports Codex CLI, Claude Code, OpenCode, and Pi.

## When to use

Use this skill when the user asks to write code, fix bugs, review PRs, refactor code, or run an AI coding agent on a project.

## Available Agents

| Agent | Command | Install |
|-------|---------|---------|
| Codex CLI | `codex` | `npm i -g @openai/codex` |
| Claude Code | `claude` | `npm i -g @anthropic-ai/claude-code` |
| Pi | `pi` | `npm i -g @mariozechner/pi-coding-agent` |
| OpenCode | `opencode` | See docs |

## Quick One-Shot Tasks

Codex (needs a git repo):

```bash
SCRATCH=$(mktemp -d) && cd $SCRATCH && git init && codex exec "Your prompt here"
```

In an existing project:

```bash
cd ~/Projects/myproject && codex exec --full-auto "Add error handling to the API calls"
```

Claude Code:

```bash
cd ~/Projects/myproject && claude "Your task description"
```

Pi:

```bash
cd ~/Projects/myproject && pi "Summarize src/"
```

## Background Tasks (long-running)

Start agent in background:

```bash
cd ~/Projects/myproject && codex --yolo "Build a snake game" &
```

## Codex Flags

| Flag | Effect |
|------|--------|
| `exec "prompt"` | One-shot, exits when done |
| `--full-auto` | Sandboxed, auto-approves changes |
| `--yolo` | No sandbox, no approvals (fastest) |

## PR Reviews

Clone to temp folder for safe review:

```bash
REVIEW_DIR=$(mktemp -d)
git clone https://github.com/user/repo.git $REVIEW_DIR
cd $REVIEW_DIR && gh pr checkout 130
codex review --base origin/main
```

## Parallel Issue Fixing

Use git worktrees for parallel fixes:

```bash
git worktree add -b fix/issue-78 /tmp/issue-78 main
git worktree add -b fix/issue-99 /tmp/issue-99 main

cd /tmp/issue-78 && npm install && codex --yolo "Fix issue #78: description"
cd /tmp/issue-99 && npm install && codex --yolo "Fix issue #99: description"
```

Cleanup:

```bash
git worktree remove /tmp/issue-78
git worktree remove /tmp/issue-99
```

## Tips

- Codex requires a git directory; use `mktemp -d && git init` for scratch work.
- Use `--full-auto` for building, vanilla for reviewing.
- Multiple agents can run in parallel.
- Always check results before committing.
- Pi supports `--provider openai --model gpt-4o-mini` for different models.
