---
name: smart-home
description: Control Philips Hue lights and scenes via the OpenHue CLI.
---

# Smart Home (Philips Hue)

Use `openhue` to control Philips Hue lights, rooms, and scenes via a Hue Bridge.

## When to use

Use this skill when the user asks to control lights, change brightness, set colors, activate scenes, or manage Hue smart home devices.

## Setup

Install:

```bash
brew install openhue/cli/openhue-cli
```

Discover bridges on your network:

```bash
openhue discover
```

Run guided setup (press Hue Bridge button when prompted):

```bash
openhue setup
```

## Read State

List all lights:

```bash
openhue get light --json
```

List rooms:

```bash
openhue get room --json
```

List scenes:

```bash
openhue get scene --json
```

## Control Lights

Turn on/off:

```bash
openhue set light <id-or-name> --on
openhue set light <id-or-name> --off
```

Set brightness (0-100):

```bash
openhue set light <id> --on --brightness 50
```

Set color (RGB hex):

```bash
openhue set light <id> --on --rgb #3399FF
```

## Scenes

Activate a scene:

```bash
openhue set scene <scene-id>
```

## Room Control

Target lights in a specific room:

```bash
openhue set light <id> --room "Living Room" --on --brightness 75
```

## Tips

- Run `openhue setup` first; you may need to press the Hue Bridge button.
- Use `--json` for structured output when querying state.
- Use `--room "Room Name"` when light names are ambiguous.
- Light IDs can be found via `openhue get light --json`.
