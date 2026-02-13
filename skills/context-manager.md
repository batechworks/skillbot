---
name: context-manager
description: Manages conversation context window with auto-compaction, manual /compact, and memory persistence
always: true
platform: cross-platform
---

# Context Manager

Your conversation history is automatically managed to prevent context overflow.

## How it works

- **Auto-compaction**: When the conversation gets long (~80% of context window), the system automatically:
  1. Asks you to save important context to daily memory (`memory/YYYY-MM-DD.md`)
  2. Summarizes the conversation
  3. Replaces old history with the summary + last 6 messages

- **Manual compaction**: The user can type `/compact` to trigger compaction immediately.

## Your responsibilities

- **Write important things to disk** proactively. Don't rely solely on conversation history.
- When you learn something significant, save it immediately to `MEMORY.md` (permanent) or `memory/YYYY-MM-DD.md` (daily log).
- When asked to flush before compaction, save: pending tasks, user preferences, conversation context, and anything needed to continue after the summary.
- After compaction, you'll see a `[Compacted conversation summary]` at the top. Use it as context.

## Searching past context

If you need context from before compaction:

```bash
grep -ri "keyword" MEMORY.md memory/
```

Or read a specific day's log:

```bash
cat memory/2026-02-13.md
```
