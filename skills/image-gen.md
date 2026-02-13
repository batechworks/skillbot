---
name: image-gen
description: Generate images using the OpenAI Images API (DALL-E 3, GPT Image models) via curl or Python.
platform: cross-platform
---

# Image Generation

Generate images using the OpenAI Images API from the command line.

## When to use

Use this skill when the user asks to generate, create, or make an image, illustration, photo, or artwork.

## Requirements

- `OPENAI_API_KEY` environment variable set
- `curl` or `python3` installed

## Quick Generation (curl)

```bash
curl -s https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A serene mountain landscape at sunset with a reflective lake",
    "size": "1792x1024",
    "quality": "hd",
    "n": 1
  }' | python3 -c "
import sys, json
d = json.load(sys.stdin)
url = d['data'][0]['url']
print(url)
" | xargs curl -sLo /tmp/generated.png
echo "Image saved to /tmp/generated.png"
```

## Python Script

```bash
python3 << 'PYEOF'
import openai, os, urllib.request
client = openai.OpenAI()
response = client.images.generate(
    model="dall-e-3",
    prompt="A cute robot reading a book in a cozy library",
    size="1024x1024",
    quality="hd",
    n=1,
)
url = response.data[0].url
path = "/tmp/generated.png"
urllib.request.urlretrieve(url, path)
print(f"Saved to {path}")
PYEOF
```

## Model Options

| Model | Sizes | Quality | Notes |
|-------|-------|---------|-------|
| `dall-e-3` | 1024x1024, 1792x1024, 1024x1792 | standard, hd | n=1 only |
| `dall-e-2` | 256x256, 512x512, 1024x1024 | standard | n=1-10 |
| `gpt-image-1` | 1024x1024, 1536x1024, 1024x1536, auto | auto, high, medium, low | supports transparent bg |

## DALL-E 3 Style

```bash
# Vivid (hyper-real, dramatic)
"style": "vivid"
# Natural (more realistic)
"style": "natural"
```

## Tips

- DALL-E 3 only generates 1 image at a time.
- Use `open /tmp/generated.png` (macOS) to view the result.
- Be specific in prompts for better results.
- Requires `OPENAI_API_KEY` to be set.
