---
name: notifications
description: Send macOS desktop notifications via osascript
---

# Notifications

Send native macOS notifications using AppleScript.

## Basic notification

```bash
osascript -e 'display notification "Task completed!" with title "skillBots"'
```

## With subtitle

```bash
osascript -e 'display notification "All tests passed" with title "Build" subtitle "Project X"'
```

## With sound

```bash
osascript -e 'display notification "Timer done!" with title "Timer" sound name "Ping"'
```

Available sounds: `Basso`, `Blow`, `Bottle`, `Frog`, `Funk`, `Glass`, `Hero`, `Morse`, `Ping`, `Pop`, `Purr`, `Sosumi`, `Submarine`, `Tink`

## Alert dialog (requires interaction)

```bash
osascript -e 'display alert "Confirmation" message "Deploy to production?" buttons {"Cancel", "Deploy"} default button "Cancel"'
```

## Say (text to speech)

```bash
say "Build complete, all tests passed"
```

With specific voice:

```bash
say -v Samantha "Hello there"
```

## Tips

- Notifications require "Allow Notifications" in System Settings for Terminal
- Use `say` for urgent audio alerts
- Combine with scheduler skill for timed notifications
- Available voices: `say -v ?`
