---
name: spotify
description: Control Spotify playback and search using spogo (preferred) or spotify_player CLI.
---

# Spotify

Use `spogo` (preferred) or `spotify_player` for Spotify playback and search from the terminal.

## When to use

Use this skill when the user asks to play music, search for songs/artists/albums, control playback (pause, skip, volume), or check what's playing on Spotify.

## Setup

Install spogo (preferred):

```bash
brew install steipete/tap/spogo
```

Import cookies for auth:

```bash
spogo auth import --browser chrome
```

Or install spotify_player (fallback):

```bash
brew install spotify_player
```

Requirements: Spotify Premium account.

## spogo Commands

Search for tracks:

```bash
spogo search track "bohemian rhapsody"
```

Search artists/albums:

```bash
spogo search artist "radiohead"
spogo search album "ok computer"
```

Playback control:

```bash
spogo play
spogo pause
spogo next
spogo prev
```

Current status:

```bash
spogo status
```

Volume:

```bash
spogo volume 50
spogo volume up
spogo volume down
```

Devices:

```bash
spogo device list
spogo device set "Living Room Speaker"
```

## spotify_player Commands (fallback)

Search:

```bash
spotify_player search "query"
```

Playback:

```bash
spotify_player playback play
spotify_player playback pause
spotify_player playback next
spotify_player playback previous
```

Connect device:

```bash
spotify_player connect
```

Like current track:

```bash
spotify_player like
```

## Tips

- Spotify Premium is required for playback control.
- Use `spogo status` to check what's currently playing before making changes.
- Config folder for spotify_player: `~/.config/spotify-player/app.toml`
- Use `spogo device list` to see available playback devices.
