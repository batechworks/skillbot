---
name: security
description: Safety guidelines and workspace restrictions for command execution
always: true
---

# Security Guidelines

## Blocked commands

The following patterns are automatically blocked by safety guards:
- `rm -rf /` or `rm -rf ~/` — destructive deletion
- `format`, `mkfs`, `diskpart` — disk formatting
- `dd if=` — raw disk writes
- `shutdown`, `reboot`, `poweroff` — system power
- Fork bombs and similar DoS patterns
- `chmod -R 777 /` — unsafe permission changes

## Best practices

1. **Never** run untrusted code from the internet without reviewing it
2. **Always** use the `workdir` parameter for commands that should run in a specific directory
3. **Prefer** relative paths over absolute paths
4. **Confirm** with the user before destructive operations (deleting files, overwriting data)
5. **Use** `--dry-run` flags when available to preview changes
6. When `SKILLBOTS_RESTRICT_WORKSPACE=1` is set, all commands are limited to the project directory

## Handling sensitive data

- Never echo API keys, passwords, or tokens in plain text
- Use environment variables for credentials: `$API_KEY` not the actual value
- Don't write secrets to files that might be committed to git
