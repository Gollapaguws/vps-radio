# Fallback Playlist

Place at least 3 MP3 files in this directory before starting the Docker stack.

Liquidsoap will shuffle and play these files when no live DJ is connected.

**Recommended:** 128kbps or 192kbps stereo MP3, tagged with proper ID3 metadata (artist, title).

Files in this directory are `.gitignore`d to keep the repo small.
To seed the playlist, copy your MP3s here:

```bash
cp /path/to/your/music/*.mp3 assets/playlist/
```

Or download a few Creative Commons tracks from:
- https://freemusicarchive.org/
- https://ccmixter.org/
