---
name: obsidian
description: Work with Obsidian vaults (plain Markdown notes) and automate via obsidian-cli or direct file editing.
platform: cross-platform
---

# Obsidian

Manage Obsidian vaults from the terminal. An Obsidian vault is just a normal folder with `.md` files.

## When to use

Use this skill when the user asks about Obsidian notes, vault search, creating/editing/moving notes, or managing their knowledge base.

## Setup

Install obsidian-cli:

```bash
brew install yakitrak/yakitrak/obsidian-cli
```

## Find Vault Location

Obsidian tracks vaults in:

```bash
cat ~/Library/Application\ Support/obsidian/obsidian.json
```

Set a default vault:

```bash
obsidian-cli set-default "vault-folder-name"
```

Check current default:

```bash
obsidian-cli print-default --path-only
```

## Search Notes

By note name:

```bash
obsidian-cli search "query"
```

Inside note content (with snippets):

```bash
obsidian-cli search-content "query"
```

Or use standard CLI tools on the vault folder:

```bash
rg "search term" ~/path/to/vault/
```

## Create Notes

```bash
obsidian-cli create "Folder/New note" --content "Note content here" --open
```

Or just create a file directly:

```bash
cat > ~/vault/path/note.md << 'EOF'
# Note Title

Content goes here.
EOF
```

## Edit Notes

Obsidian picks up file changes automatically, so you can edit `.md` files directly:

```bash
cat >> ~/vault/path/note.md << 'EOF'

## New Section

Added content.
EOF
```

## Move / Rename (with link updates)

Use obsidian-cli to update `[[wikilinks]]` across the vault:

```bash
obsidian-cli move "old/path/note" "new/path/note"
```

## Delete

```bash
obsidian-cli delete "path/note"
```

## Vault Structure

- Notes: `*.md` (plain Markdown)
- Config: `.obsidian/` (plugins, settings)
- Canvases: `*.canvas` (JSON)
- Attachments: configured folder for images/PDFs

## Tips

- Multiple vaults are common (work/personal, iCloud vs local). Don't guess; check the config.
- Prefer `obsidian-cli move` over `mv` to update wikilinks.
- Direct file edits are fine; Obsidian auto-syncs.
- Avoid creating notes in `.obsidian/` or hidden folders.
