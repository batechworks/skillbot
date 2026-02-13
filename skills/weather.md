---
name: weather
description: Get current weather, forecasts, and moon phase (no API key required).
platform: cross-platform
---

# Weather

Two free services, no API keys needed.

## When to use

Use this skill when the user asks about weather, temperature, forecast, humidity, wind, rain, snow, UV index, sunrise/sunset, or moon phase for any location.

## wttr.in (primary)

Quick one-liner:

```bash
curl -s "wttr.in/London?format=3"
# Output: London: ⛅️ +8°C
```

Compact format (temp + humidity + wind):

```bash
curl -s "wttr.in/London?format=%l:+%c+%t+%h+%w"
# Output: London: ⛅️ +8°C 71% ↙5km/h
```

Full 3-day forecast:

```bash
curl -s "wttr.in/London?T"
```

Today only:

```bash
curl -s "wttr.in/London?1T"
```

Current conditions only:

```bash
curl -s "wttr.in/London?0T"
```

Moon phase:

```bash
curl -s "wttr.in/Moon"
```

Format codes: `%c` condition, `%t` temp, `%h` humidity, `%w` wind, `%l` location, `%m` moon, `%S` sunrise, `%s` sunset, `%p` precipitation

Tips:

- URL-encode spaces: `wttr.in/New+York` or `wttr.in/San+Francisco`
- Airport codes work: `wttr.in/JFK`
- Units: `?m` metric, `?u` USCS (Fahrenheit)
- JSON output: `curl -s "wttr.in/London?format=j1"` for structured data
- Specific date forecast: `wttr.in/London?2` (day after tomorrow)

## Open-Meteo (fallback, JSON API)

Free, no key, good for programmatic use:

```bash
curl -s "https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current_weather=true"
```

With hourly data:

```bash
curl -s "https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current_weather=true&hourly=temperature_2m,precipitation_probability"
```

Returns JSON with temp, windspeed, weathercode. Use when you need structured data for further processing.

## Troubleshooting

- If wttr.in is slow, use Open-Meteo as fallback.
- For Chinese city names, use pinyin: `wttr.in/Beijing`
- If output is garbled, add `?T` to disable terminal color codes.
