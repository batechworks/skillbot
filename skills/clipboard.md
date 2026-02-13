---
name: clipboard
description: Read and write the macOS clipboard using pbcopy/pbpaste
platform: macos
---

# Clipboard

Interact with the macOS system clipboard.

## Read clipboard

```bash
pbpaste
```

## Write to clipboard

```bash
echo "Hello, world!" | pbcopy
```

## Copy file contents to clipboard

```bash
cat README.md | pbcopy
```

## Copy command output to clipboard

```bash
date | pbcopy
pwd | pbcopy
git log --oneline -5 | pbcopy
```

## Pipeline: transform and copy

```bash
pbpaste | tr '[:lower:]' '[:upper:]' | pbcopy
```

## Copy a file path

```bash
echo "$(pwd)/file.txt" | pbcopy
```

## Tips

- `pbpaste` returns the most recently copied text
- Works with pipes for any command chain
- Use `pbpaste | wc -l` to count lines in clipboard
- Rich content (images, HTML) from GUI apps won't show in `pbpaste` (text-only)
