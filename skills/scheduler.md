---
name: scheduler
description: Schedule tasks, reminders, and recurring jobs — via crontab, at, launchd, sleep, or the heartbeat task list
---

# Scheduler

Schedule one-off and recurring tasks on macOS using OS-level tools.

## Quick reminder (one-off, in-process)

For simple delays within the current session:

```bash
(sleep 1800 && osascript -e 'display notification "Break time!" with title "Reminder"') &
```

Using `at` (needs `atrun` enabled):

```bash
echo 'osascript -e "display notification \"Time to stretch!\" with title \"Reminder\""' | at now + 30 minutes
```

## Recurring tasks with crontab

List current cron jobs:

```bash
crontab -l
```

Add a job (e.g., daily at 9am):

```bash
(crontab -l 2>/dev/null; echo "0 9 * * * /usr/bin/osascript -e 'display notification \"Good morning!\" with title \"Bot\"'") | crontab -
```

Remove all cron jobs:

```bash
crontab -r
```

## Heartbeat task list (recurring bot checks)

For tasks the **bot itself** should run periodically, write them to `HEARTBEAT.md`:

```bash
cat > HEARTBEAT.md << 'EOF'
# Recurring Tasks
- Check disk space and alert if below 10%
- Review today's memory log and summarize after 6pm
- Check if scheduled backups succeeded
EOF
```

The bot reads this file every 30 minutes and executes any instructions found. Leave it empty to disable.

## LaunchAgent (persistent macOS scheduler)

Create a launch agent for reliable scheduling that survives reboots:

```bash
cat > ~/Library/LaunchAgents/com.skillbots.reminder.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.skillbots.reminder</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/bin/osascript</string>
    <string>-e</string>
    <string>display notification "Scheduled task" with title "skillBots"</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>9</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
</dict>
</plist>
EOF
launchctl load ~/Library/LaunchAgents/com.skillbots.reminder.plist
```

## Tips

- `at` requires: `sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.atrun.plist`
- Crontab uses server timezone; check with `date`
- Use full paths in cron/launchd (e.g., `/usr/bin/osascript`, `/usr/local/bin/node`)
- List launch agents: `launchctl list | grep skillbots`
- For recurring **bot-level** checks, prefer `HEARTBEAT.md` over crontab