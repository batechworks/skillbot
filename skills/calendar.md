---
name: calendar
description: macOS Calendar app via AppleScript and icalBuddy CLI
---

# Calendar

Access macOS Calendar events using AppleScript or `icalBuddy`.

## Using icalBuddy (recommended)

Install:

```bash
brew install ical-buddy
```

Today's events:

```bash
icalBuddy eventsToday
```

This week:

```bash
icalBuddy eventsToday+7
```

Tomorrow:

```bash
icalBuddy eventsFrom:tomorrow to:tomorrow+1
```

Specific date range:

```bash
icalBuddy eventsFrom:"2026-02-14" to:"2026-02-15"
```

List calendars:

```bash
icalBuddy calendars
```

Filter by calendar:

```bash
icalBuddy -ic "Work" eventsToday
```

## Using AppleScript (no install needed)

Today's events:

```bash
osascript -e '
tell application "Calendar"
  set today to current date
  set tomorrow to today + 1 * days
  set output to ""
  repeat with cal in calendars
    repeat with evt in (every event of cal whose start date ≥ today and start date < tomorrow)
      set output to output & (summary of evt) & " at " & (start date of evt) & linefeed
    end repeat
  end repeat
  return output
end tell'
```

Create an event:

```bash
osascript -e '
tell application "Calendar"
  tell calendar "Work"
    make new event with properties {summary:"Team Meeting", start date:date "Friday, February 14, 2026 at 2:00:00 PM", end date:date "Friday, February 14, 2026 at 3:00:00 PM"}
  end tell
end tell'
```

## Tips

- `icalBuddy` is simpler for reading; AppleScript for creating events
- Calendar must have proper access permissions in System Settings > Privacy
- Use `--format` with icalBuddy for custom output
