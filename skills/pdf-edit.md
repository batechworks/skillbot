---
name: pdf-edit
description: Edit PDFs with natural-language instructions using the nano-pdf CLI.
---

# PDF Edit

Use `nano-pdf` to apply edits to specific pages in a PDF using natural-language instructions.

## When to use

Use this skill when the user asks to edit a PDF, change text in a PDF, fix typos, update titles, or modify PDF content.

## Setup

Install via uv (recommended):

```bash
uv tool install nano-pdf
```

Or pip:

```bash
pip install nano-pdf
```

## Quick Start

Edit a specific page with natural language:

```bash
nano-pdf edit document.pdf 1 "Change the title to 'Q3 Results' and fix the typo in the subtitle"
```

## Usage

```bash
nano-pdf edit <pdf-file> <page-number> "<instruction>"
```

Parameters:

- `<pdf-file>` -- path to the PDF
- `<page-number>` -- page to edit (check if 0-based or 1-based)
- `<instruction>` -- natural-language description of the edit

## Examples

Fix a typo:

```bash
nano-pdf edit report.pdf 1 "Fix the spelling of 'recieve' to 'receive'"
```

Update content:

```bash
nano-pdf edit deck.pdf 3 "Change the revenue figure from $1.2M to $1.5M"
```

## Tips

- Page numbering may be 0-based or 1-based depending on version. If the result looks off by one, retry with the other.
- Always check the output PDF before sharing.
- Back up the original PDF before editing.
- Works best with text-based PDFs; scanned image PDFs may not work well.
