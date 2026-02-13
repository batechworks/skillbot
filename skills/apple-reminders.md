---
name: apple-reminders
description: Manage Apple Reminders via the remindctl CLI on macOS (list, add, edit, complete, delete). Supports lists, date filters, and JSON output.
platform: macos
---

# Apple Reminders

Use `remindctl` to manage Apple Reminders from the terminal. macOS only.

## When to use

Use this skill when the user asks about reminders, to-do items, tasks due today/tomorrow, overdue items, or wants to create/complete/delete reminders on macOS.

## Setup

Install via Homebrew:

```bash
brew install steipete/tap/remindctl
```

Grant Reminders access when prompted, or manually: System Settings > Privacy & Security > Reminders.

Check permissions:

```bash
remindctl status
```

Request access:

```bash
remindctl authorize
```

## View Reminders

Default (today):

```bash
remindctl
```

By time range:

```bash
remindctl today
remindctl tomorrow
remindctl week
remindctl overdue
remindctl upcoming
remindctl completed
remindctl all
```

Specific date:

```bash
remindctl 2026-02-15
```

## Manage Lists

List all reminder lists:

```bash
remindctl list
```

Show a specific list:

```bash
remindctl list Work
```

Create a new list:

```bash
remindctl list Projects --create
```

Rename a list:

```bash
remindctl list Work --rename Office
```

Delete a list:

```bash
remindctl list Work --delete
```

## Create Reminders

Quick add:

```bash
remindctl add "Buy milk"
```

With list and due date:

```bash
remindctl add --title "Call mom" --list Personal --due tomorrow
```

With specific datetime:

```bash
remindctl add --title "Meeting prep" --list Work --due "2026-02-15 09:00"
```

## Edit Reminders

Edit title and due date by ID:

```bash
remindctl edit 1 --title "New title" --due 2026-02-15
```

## Complete Reminders

Complete by ID:

```bash
remindctl complete 1 2 3
```

## Delete Reminders

Delete by ID (with force):

```bash
remindctl delete 4A83 --force
```

## Output Formats

JSON (for scripting):

```bash
remindctl today --json
```

Plain TSV:

```bash
remindctl today --plain
```

Count only:

```bash
remindctl today --quiet
```

## Date Formats

Accepted by `--due` and date filters:

- `today`, `tomorrow`, `yesterday`
- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm`
- ISO 8601 (`2026-02-15T12:00:00Z`)

## Tips

- macOS only; requires Reminders permission.
- Reminder IDs are shown in the output; use them for edit/complete/delete.
- If access is denied, re-enable in System Settings > Privacy & Security > Reminders.
