---
name: google-workspace
description: Gmail, Google Calendar, and Google Drive via the gog CLI tool
platform: cross-platform
---

# Google Workspace

Interact with Gmail, Google Calendar, and Google Drive using the `gog` CLI.

## Setup

```bash
brew install drakerossman/tap/gog
gog auth login
```

## Gmail

List recent emails:

```bash
gog gmail list --max 10
```

Read an email:

```bash
gog gmail read <message-id>
```

Send an email:

```bash
gog gmail send --to "alice@example.com" --subject "Hello" --body "Hi Alice!"
```

Search emails:

```bash
gog gmail search "from:boss@company.com is:unread"
```

## Google Calendar

Today's events:

```bash
gog calendar list --from today --to tomorrow
```

This week's events:

```bash
gog calendar list --from today --to "+7d"
```

Create an event:

```bash
gog calendar create --title "Team standup" --start "2026-02-14T10:00:00" --duration 30m
```

## Google Drive

List files:

```bash
gog drive list --max 20
```

Search files:

```bash
gog drive search "quarterly report"
```

Download a file:

```bash
gog drive download <file-id> --output ./downloads/
```

Upload a file:

```bash
gog drive upload ./report.pdf --folder "Work Reports"
```

## Tips

- First run: `gog auth login` opens browser for OAuth
- Use `gog --help` for full command reference
- Gmail search uses the same syntax as Gmail web search
- Calendar times are in local timezone by default
