---
name: voice
description: Voice transcription and text-to-speech. Transcribe audio files using Whisper, or speak text aloud using macOS say command.
platform: cross-platform
---

# Voice

## Transcribe audio (Whisper)

Using local Whisper CLI:

```bash
whisper audio.mp3 --model base --output_format txt
```

Using Groq Whisper API (fast, requires GROQ_API_KEY):

```bash
curl -s https://api.groq.com/openai/v1/audio/transcriptions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -F file=@audio.mp3 \
  -F model=whisper-large-v3-turbo | python3 -c "import sys,json; print(json.load(sys.stdin)['text'])"
```

Using OpenAI Whisper API:

```bash
curl -s https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file=@audio.mp3 \
  -F model=whisper-1 | python3 -c "import sys,json; print(json.load(sys.stdin)['text'])"
```

## Text-to-speech (macOS)

```bash
say "Hello, this is your assistant speaking"
say -v Samantha "Using a specific voice"
say -v "?" # List available voices
say -o output.aiff "Save to file"
```

## Tips

- Supported audio formats: mp3, mp4, m4a, wav, webm
- For long files, split first: `ffmpeg -i long.mp3 -f segment -segment_time 300 chunk_%03d.mp3`
- Groq Whisper is fastest (near real-time), OpenAI is most accurate
