---
name: security
description: Safety guidelines and workspace restrictions for command execution
always: true
platform: cross-platform
---

# Security Guidelines

## Three-layer defense

### Layer 1 — Deny patterns (always active)

The following patterns are automatically blocked:
- `rm -rf /` or `rm -rf ~/` — destructive deletion
- `format`, `mkfs`, `diskpart` — disk formatting
- `dd if=` — raw disk writes
- `shutdown`, `reboot`, `poweroff` — system power
- Fork bombs and similar DoS patterns
- `chmod -R 777 /` — unsafe permission changes

### Layer 2 — Command whitelist (opt-in, recommended for production)

When `SKILLBOT_COMMAND_WHITELIST` is set, **only whitelisted commands may execute**. This is the strongest security mode — unknown commands are rejected before they run.

- `SKILLBOT_COMMAND_WHITELIST=default` — use the built-in whitelist (curl, python3, gh, etc.)
- `SKILLBOT_COMMAND_WHITELIST=curl,python3,gh,cat,echo` — custom list

This is safer than deny-patterns alone because it prevents unknown attack vectors (base64-encoded payloads, aliased commands, etc.).

### Layer 3 — Workspace restriction (opt-in)

When `SKILLBOT_RESTRICT_WORKSPACE=1`, all file paths must stay within the project directory. Path traversal (`../`) and absolute paths outside the workspace are blocked.

## Best practices

1. **Never** run untrusted code from the internet without reviewing it
2. **Always** use the `workdir` parameter for commands that should run in a specific directory
3. **Prefer** relative paths over absolute paths
4. **Confirm** with the user before destructive operations (deleting files, overwriting data)
5. **Use** `--dry-run` flags when available to preview changes
6. **Enable whitelist mode** in production: `SKILLBOT_COMMAND_WHITELIST=default`

## Handling sensitive data

- Never echo API keys, passwords, or tokens in plain text
- Use environment variables for credentials: `$API_KEY` not the actual value
- Don't write secrets to files that might be committed to git
