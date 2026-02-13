---
name: tmux
description: Manage tmux sessions for running interactive CLIs, parallel tasks, and persistent terminal sessions.
platform: cross-platform
---

# tmux

Use tmux for interactive terminal sessions, parallel task execution, and persistent processes.

## When to use

Use this skill when the user needs to run interactive CLIs, keep processes alive in background, run parallel tasks, or manage multiple terminal sessions.

## Quick Start

Create a new session:

```bash
tmux new-session -d -s mysession
```

Send a command to the session:

```bash
tmux send-keys -t mysession "echo hello" Enter
```

Capture output:

```bash
tmux capture-pane -p -t mysession -S -200
```

## Session Management

List sessions:

```bash
tmux list-sessions
```

Attach to a session:

```bash
tmux attach -t mysession
```

Kill a session:

```bash
tmux kill-session -t mysession
```

Kill all sessions:

```bash
tmux kill-server
```

## Sending Input

Send literal text:

```bash
tmux send-keys -t mysession -l "your command here"
```

Then press Enter:

```bash
tmux send-keys -t mysession Enter
```

For interactive TUI apps, split text and Enter with a delay:

```bash
tmux send-keys -t mysession -l "your input" && sleep 0.1 && tmux send-keys -t mysession Enter
```

Send control keys:

```bash
tmux send-keys -t mysession C-c
```

## Watching Output

Capture recent output:

```bash
tmux capture-pane -p -J -t mysession -S -200
```

Check if command finished (look for shell prompt):

```bash
tmux capture-pane -p -t mysession -S -3 | grep -q "\\$" && echo "DONE" || echo "Running..."
```

## Parallel Task Execution

```bash
for i in 1 2 3; do
  tmux new-session -d -s "task-$i"
  tmux send-keys -t "task-$i" "cd /tmp/project$i && make build" Enter
done

# Monitor all
tmux list-sessions
for i in 1 2 3; do
  echo "=== task-$i ==="
  tmux capture-pane -p -t "task-$i" -S -5
done
```

## Windows and Panes

Split a window:

```bash
tmux split-window -h -t mysession
tmux split-window -v -t mysession
```

Target format: `session:window.pane` (e.g., `mysession:0.1`)

## Cleanup

```bash
tmux kill-session -t mysession
```

## Tips

- Use descriptive session names for easy management.
- `tmux capture-pane -p` prints pane content to stdout.
- For Python REPLs, set `PYTHON_BASIC_REPL=1` to avoid curses issues.
- Detach with `Ctrl+b d` when attached.
- Install: `brew install tmux` (macOS) · `sudo apt install tmux` (Linux).
