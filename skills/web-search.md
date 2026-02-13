---
name: web-search
description: Search the web, fetch page content, and look up information using curl and CLI tools.
platform: cross-platform
---

# Web Search

Use curl-based approaches to search and fetch web content. No API keys needed.

## When to use

Use this skill when the user asks to search the web, look up information, fetch a URL, get a Wikipedia summary, or extract content from a web page.

## DuckDuckGo Instant Answers

Quick factual queries (JSON API, no key needed):

```bash
curl -s "https://api.duckduckgo.com/?q=query+here&format=json&no_html=1" | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('AbstractText'): print(d['AbstractText'])
elif d.get('Answer'): print(d['Answer'])
elif d.get('RelatedTopics'):
    for t in d['RelatedTopics'][:5]:
        if isinstance(t, dict) and t.get('Text'): print('-', t['Text'])
else: print('No instant answer. Try a more specific query.')
"
```

## Fetch Web Pages

Get readable text from a URL (strip HTML tags):

```bash
curl -sL "https://example.com" | sed 's/<[^>]*>//g' | sed '/^$/d' | head -100
```

Better readability with `lynx` (if installed):

```bash
lynx -dump -nolist "https://example.com" | head -100
```

Download a file:

```bash
curl -sLO "https://example.com/file.pdf"
```

Just get HTTP headers:

```bash
curl -sI "https://example.com"
```

## Wikipedia

Quick summary lookup:

```bash
curl -s "https://en.wikipedia.org/api/rest_v1/page/summary/Topic_Name" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('title', ''))
print(d.get('extract', 'Not found'))
"
```

## JSON APIs

Pretty-print JSON response:

```bash
curl -s "https://api.example.com/data" | python3 -m json.tool
```

Extract specific fields with jq (if installed):

```bash
curl -s "https://api.example.com/data" | jq '.results[].name'
```

## Tips

- URL-encode query parameters (spaces to `+` or `%20`).
- Use `| head -N` to limit large outputs.
- Add `-L` to curl to follow redirects.
- Use `curl -s` (silent) to suppress progress bars.
- For JavaScript-heavy pages, curl won't execute JS. Mention this limitation to the user.
- Pipe JSON to `python3 -m json.tool` for pretty printing when `jq` is not available.
