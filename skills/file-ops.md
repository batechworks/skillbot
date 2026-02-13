---
name: file-ops
description: Read, write, search, and manage files and directories using standard CLI tools.
---

# File Operations

Use standard CLI tools for file management. Available on all platforms.

## When to use

Use this skill for any file or directory task: reading files, writing content, searching text, finding files, checking disk usage, comparing files, or managing permissions.

## Reading Files

View entire file:

```bash
cat path/to/file
```

With line numbers:

```bash
cat -n path/to/file
```

First/last N lines:

```bash
head -n 20 path/to/file
tail -n 20 path/to/file
```

Follow a log file in real time:

```bash
tail -f path/to/logfile
```

View a specific line range (lines 10-20):

```bash
sed -n '10,20p' path/to/file
```

## Writing Files

Write to a file (overwrite):

```bash
cat > path/to/file << 'EOF'
content goes here
multiple lines supported
EOF
```

Append to a file:

```bash
cat >> path/to/file << 'EOF'
appended content
EOF
```

Write a single line:

```bash
echo "single line content" > path/to/file
```

## Searching

Search file contents with ripgrep (preferred, fast):

```bash
rg "pattern" path/to/dir
```

With context lines:

```bash
rg -C 3 "pattern" path/to/dir
```

Case-insensitive:

```bash
rg -i "pattern" path/to/dir
```

Fallback to grep:

```bash
grep -rn "pattern" path/to/dir
```

Find files by name:

```bash
find path/to/dir -name "*.ts" -type f
```

Find files modified in last 24h:

```bash
find path/to/dir -mtime -1 -type f
```

## Directory Operations

List directory (detailed):

```bash
ls -la path/to/dir
```

Tree view (if `tree` installed):

```bash
tree -L 2 path/to/dir
```

Create directory (with parents):

```bash
mkdir -p path/to/nested/dir
```

Copy/move/delete:

```bash
cp -r source/ dest/
mv source dest
rm -rf path/to/dir
```

## File Info

File type and size:

```bash
file path/to/file
wc -l path/to/file
du -sh path/to/file
```

Directory disk usage:

```bash
du -sh path/to/dir/*
```

Compare two files:

```bash
diff path/to/file1 path/to/file2
```

## Permissions

```bash
chmod 755 path/to/file
chown user:group path/to/file
```

## Tips

- Use `rg` (ripgrep) over `grep` when available -- much faster.
- Use heredoc `<< 'EOF'` for multi-line writes to avoid escaping issues.
- Pipe output through `| head -50` to limit large outputs.
- Use `wc -l` to count lines before displaying large files.
