---
name: summarize
description: Summarize or extract text from URLs, YouTube videos, PDFs, and local files using the summarize CLI.
---

# Summarize

Use `summarize` for fast summarization of URLs, local files, and YouTube links.

## When to use

Use this skill when the user asks to summarize a URL, article, YouTube video, PDF, or any content. Also use when they ask "what's this link about?" or "transcribe this video."

## Setup

Install:

```bash
brew install steipete/tap/summarize
```

Set an API key for your preferred provider:

- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Google: `GEMINI_API_KEY`
- xAI: `XAI_API_KEY`

## Quick Start

Summarize a URL:

```bash
summarize "https://example.com/article"
```

Summarize a local file:

```bash
summarize "/path/to/document.pdf"
```

Summarize a YouTube video:

```bash
summarize "https://youtu.be/dQw4w9WgXcQ" --youtube auto
```

## YouTube: Summary vs Transcript

Get a transcript only (no summarization):

```bash
summarize "https://youtu.be/VIDEO_ID" --youtube auto --extract-only
```

## Model Selection

```bash
summarize "https://example.com" --model google/gemini-3-flash-preview
summarize "https://example.com" --model openai/gpt-5.2
```

Default model: `google/gemini-3-flash-preview` (if none set).

## Output Length

```bash
summarize "https://example.com" --length short
summarize "https://example.com" --length medium
summarize "https://example.com" --length long
summarize "https://example.com" --length xl
```

Or specify character count:

```bash
summarize "https://example.com" --length 500
```

## Useful Flags

| Flag | Description |
|------|-------------|
| `--length short\|medium\|long\|xl` | Summary length |
| `--max-output-tokens <N>` | Token limit |
| `--extract-only` | Extract text only, no summary |
| `--json` | Machine-readable output |
| `--firecrawl auto\|off\|always` | Fallback extraction |
| `--youtube auto` | YouTube transcript extraction |

## Config

Optional config file at `~/.summarize/config.json`:

```json
{ "model": "openai/gpt-5.2" }
```

## Tips

- If content is huge, use `--length short` first, then expand.
- For blocked sites, set `FIRECRAWL_API_KEY` for fallback extraction.
- For YouTube, set `APIFY_API_TOKEN` for Apify fallback.
- Verify: `summarize --version`
