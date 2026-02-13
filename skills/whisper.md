---
name: whisper
description: Local speech-to-text transcription using OpenAI Whisper CLI (no API key needed).
---

# Whisper (Speech-to-Text)

Use `whisper` to transcribe audio files locally. Runs entirely on your machine, no API key required.

## When to use

Use this skill when the user asks to transcribe audio, convert speech to text, generate subtitles, or translate spoken audio to English.

## Setup

Install:

```bash
brew install openai-whisper
```

Or via pip:

```bash
pip install openai-whisper
```

Models download automatically to `~/.cache/whisper` on first use.

## Quick Start

Transcribe to text:

```bash
whisper /path/to/audio.mp3 --model medium --output_format txt --output_dir .
```

Transcribe to SRT subtitles:

```bash
whisper /path/to/audio.mp3 --model medium --output_format srt --output_dir .
```

## Models

| Model | Size | Speed | Accuracy |
|-------|------|-------|----------|
| `tiny` | 39M | Fastest | Lower |
| `base` | 74M | Fast | OK |
| `small` | 244M | Medium | Good |
| `medium` | 769M | Slow | Better |
| `large` | 1550M | Slowest | Best |
| `turbo` | - | Fast | Good (default) |

## Output Formats

| Format | Flag | Description |
|--------|------|-------------|
| Text | `--output_format txt` | Plain text |
| SRT | `--output_format srt` | Subtitle file |
| VTT | `--output_format vtt` | Web subtitle |
| JSON | `--output_format json` | Structured data |
| TSV | `--output_format tsv` | Tab-separated |

## Translation

Translate any language to English:

```bash
whisper /path/to/audio.mp3 --task translate --output_format txt
```

## Specify Language

```bash
whisper /path/to/audio.mp3 --language zh --output_format txt
```

## Supported Audio Formats

mp3, mp4, m4a, wav, flac, ogg, webm, and more (anything ffmpeg supports).

## Tips

- Use smaller models (`tiny`, `base`) for speed; larger models for accuracy.
- Default model is `turbo` (good balance of speed and quality).
- First run downloads the model; subsequent runs are faster.
- For long audio files, use `--model small` to avoid very long processing times.
- Output files are saved with the same name as input but different extension.
