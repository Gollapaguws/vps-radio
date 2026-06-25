# Fallback Playlist

Place at least 3 MP3 files in this directory before starting the Docker stack.

Liquidsoap will shuffle and play these files when no live DJ is connected.

**Recommended:** 128kbps or 192kbps stereo MP3, tagged with proper ID3 metadata (artist, title).

Files in this directory are `.gitignore`d to keep the repo small.
To seed the playlist, copy your MP3s here:

```bash
cp /path/to/your/music/*.mp3 assets/playlist/
```

## Quick seed with Creative Commons music

Run the helper script to download 3 sample tracks via yt-dlp (requires yt-dlp + ffmpeg):

```bash
./scripts/seed-playlist.sh
```

Or manually download from:
- https://freemusicarchive.org/ (filter: CC BY)
- https://ccmixter.org/ (Community Music)
- https://incompetech.com/ (Kevin MacLeod — CC BY)

## Requirements

- Liquidsoap needs at least **1 MP3** to start without errors
- Files must be **valid MP3** (not renamed from other formats)
- ID3v2 tags (artist, title) will be shown in the web player metadata
- Minimum 128kbps recommended for decent quality streaming
