---
name: apple-notes
description: Manage Apple Notes via the memo CLI on macOS (create, view, search, edit, delete, export notes).
platform: macos
---

# Apple Notes

Use `memo` to manage Apple Notes from the terminal. macOS only.

## When to use

Use this skill when the user asks to create, view, search, edit, delete, or export Apple Notes, or when they mention "notes" on macOS.

## Setup

Install via Homebrew:

```bash
brew tap antoniorodr/memo && brew install antoniorodr/memo/memo
```

Grant Automation access: System Settings > Privacy & Security > Automation > Terminal > Notes.app.

Verify installation:

```bash
memo --version
```

## View Notes

List all notes:

```bash
memo notes
```

Filter by folder:

```bash
memo notes -f "Folder Name"
```

Search notes (fuzzy match):

```bash
memo notes -s "search query"
```

## Create Notes

Add a new note with a title:

```bash
memo notes -a "My New Note Title"
```

Add a note to a specific folder:

```bash
memo notes -a "Note Title" -f "Work"
```

## Edit Notes

Edit an existing note (interactive picker):

```bash
memo notes -e
```

## Delete Notes

Delete a note (interactive picker):

```bash
memo notes -d
```

## Export Notes

Export notes to HTML/Markdown:

```bash
memo notes -ex
```

## Limitations

- Cannot edit notes containing images or attachments.
- macOS only. Requires Apple Notes.app.
- If access is denied, re-enable Automation in System Settings.
- Interactive commands (`-e`, `-d`) require terminal input.

## Tips

- For quick note capture, use: `memo notes -a "Quick thought about..."`
- Combine with other skills: pipe command output into a note.
- Notes sync via iCloud automatically.
