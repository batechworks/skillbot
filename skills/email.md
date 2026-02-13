---
name: email
description: Manage emails via IMAP/SMTP using the himalaya CLI. List, read, write, reply, forward, search, and organize emails from the terminal.
platform: cross-platform
---

# Email (Himalaya)

Use `himalaya` to manage emails from the terminal. Supports IMAP, SMTP, and multiple accounts.

## When to use

Use this skill when the user asks to read, send, reply, forward, search, or organize emails, or manage email folders/accounts.

## Setup

Install:

```bash
# macOS
brew install himalaya
# Linux (Cargo)
# cargo install himalaya
# Linux (Nix)
# nix-env -i himalaya
```

Run interactive setup:

```bash
himalaya account configure
```

Or create config manually at `~/.config/himalaya/config.toml`:

```toml
[accounts.personal]
email = "you@example.com"
display-name = "Your Name"
default = true

backend.type = "imap"
backend.host = "imap.example.com"
backend.port = 993
backend.encryption.type = "tls"
backend.login = "you@example.com"
backend.auth.type = "password"
backend.auth.cmd = "pass show email/imap"

message.send.backend.type = "smtp"
message.send.backend.host = "smtp.example.com"
message.send.backend.port = 587
message.send.backend.encryption.type = "start-tls"
message.send.backend.login = "you@example.com"
message.send.backend.auth.type = "password"
message.send.backend.auth.cmd = "pass show email/smtp"
```

## List Folders

```bash
himalaya folder list
```

## List Emails

Inbox (default):

```bash
himalaya envelope list
```

Specific folder:

```bash
himalaya envelope list --folder "Sent"
```

With pagination:

```bash
himalaya envelope list --page 1 --page-size 20
```

## Search Emails

```bash
himalaya envelope list from john@example.com subject meeting
```

## Read an Email

By message ID:

```bash
himalaya message read 42
```

## Reply

Reply to a message:

```bash
himalaya message reply 42
```

Reply-all:

```bash
himalaya message reply 42 --all
```

## Forward

```bash
himalaya message forward 42
```

## Send a New Email

Interactive compose:

```bash
himalaya message write
```

Send directly via template:

```bash
cat << 'EOF' | himalaya template send
From: you@example.com
To: recipient@example.com
Subject: Test Message

Hello from the terminal!
EOF
```

## Move / Copy / Delete

```bash
himalaya message move 42 "Archive"
himalaya message copy 42 "Important"
himalaya message delete 42
```

## Manage Flags

```bash
himalaya flag add 42 --flag seen
himalaya flag remove 42 --flag seen
```

## Multiple Accounts

List accounts:

```bash
himalaya account list
```

Use a specific account:

```bash
himalaya --account work envelope list
```

## Attachments

Save attachments:

```bash
himalaya attachment download 42
himalaya attachment download 42 --dir ~/Downloads
```

## Output Formats

```bash
himalaya envelope list --output json
himalaya envelope list --output plain
```

## Tips

- Verify setup: `himalaya --version`
- Store passwords securely using `pass`, system keyring, or a command.
- Message IDs are relative to the current folder.
- Debug: `RUST_LOG=debug himalaya envelope list`
