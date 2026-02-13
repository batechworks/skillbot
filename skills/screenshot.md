---
name: screenshot
description: Capture screenshots and window images on macOS using screencapture
---

# Screenshot

Capture the screen, a window, or a region on macOS.

## Full screen

```bash
screencapture -x /tmp/screenshot.png
```

`-x` disables the camera shutter sound.

## Specific window (interactive pick)

```bash
screencapture -w /tmp/window.png
```

## Timed screenshot (5 second delay)

```bash
screencapture -T 5 /tmp/screenshot.png
```

## Clipboard (no file)

```bash
screencapture -c
```

Then paste wherever needed.

## Screen recording (video)

```bash
screencapture -v /tmp/recording.mov
```

Press Ctrl+C to stop.

## List windows (for automation)

```bash
osascript -e 'tell application "System Events" to get name of every window of every process whose visible is true'
```

## Capture specific app window

```bash
osascript -e 'tell application "System Events" to set frontmost of process "Safari" to true'
sleep 0.5
screencapture -l$(osascript -e 'tell application "System Events" to get id of first window of process "Safari"') /tmp/safari.png
```

## Tips

- Output formats: `.png`, `.jpg`, `.pdf`, `.tiff` (determined by extension)
- Use `-R x,y,w,h` to capture a specific rectangle
- Combine with `sips` for resizing: `sips -Z 800 /tmp/screenshot.png`
