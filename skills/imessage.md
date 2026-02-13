---
name: imessage
description: Read and send iMessage/SMS on macOS using the imsg CLI (list chats, history, watch, send).
platform: macos
---

# iMessage

Use `imsg` to read and send Messages.app iMessage/SMS on macOS.

## When to use

Use this skill when the user asks to read messages, send a text, check iMessage history, list recent conversations, or monitor a chat on macOS.

## Setup

Install:

```bash
brew install steipete/tap/imsg
```

Requirements:

- Messages.app signed in on macOS
- Full Disk Access for your terminal app (System Settings > Privacy & Security > Full Disk Access)
- Automation permission to control Messages.app (for sending)

## List Recent Chats

```bash
imsg chats --limit 10 --json
```

## Read Chat History

By chat ID (get IDs from `imsg chats`):

```bash
imsg history --chat-id 1 --limit 20 --json
```

With attachments info:

```bash
imsg history --chat-id 1 --limit 20 --attachments --json
```

## Watch a Chat (live)

Stream incoming messages:

```bash
imsg watch --chat-id 1 --attachments
```

## Send a Message

Text only:

```bash
imsg send --to "+14155551212" --text "Hello!"
```

With image attachment:

```bash
imsg send --to "+14155551212" --text "Check this out" --file /path/to/pic.jpg
```

## Service Selection

Control delivery method:

```bash
imsg send --to "+14155551212" --text "Hi" --service imessage
imsg send --to "+14155551212" --text "Hi" --service sms
imsg send --to "+14155551212" --text "Hi" --service auto
```

## Tips

- Always confirm recipient and message content before sending.
- Use `imsg chats --limit 10 --json` to discover chat IDs first.
- macOS only; requires Messages.app and proper permissions.
- If sending fails, check Automation permissions in System Settings.
