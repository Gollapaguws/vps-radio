#!/usr/bin/env bash
# seed-playlist.sh — download 3 Creative Commons sample tracks for the fallback playlist
# Requires: yt-dlp, ffmpeg
# Usage: ./scripts/seed-playlist.sh

set -euo pipefail

DEST="$(dirname "$0")/../assets/playlist"
mkdir -p "$DEST"

echo "🎵 Seeding fallback playlist in $DEST"
echo "Requires yt-dlp and ffmpeg."
echo ""

if ! command -v yt-dlp &>/dev/null; then
  echo "❌ yt-dlp not found. Install with: pip install yt-dlp"
  exit 1
fi

if ! command -v ffmpeg &>/dev/null; then
  echo "❌ ffmpeg not found. Install with: apt install ffmpeg (or brew install ffmpeg)"
  exit 1
fi

# Kevin MacLeod tracks (CC BY 3.0) — safe for streaming
declare -A TRACKS=(
  ["Wholesome"]="https://incompetech.com/music/royalty-free/mp3-royaltyfree/Wholesome.mp3"
  ["Sneaky-Snitch"]="https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3"
  ["Peaceful-Desolation"]="https://incompetech.com/music/royalty-free/mp3-royaltyfree/Peaceful%20Desolation.mp3"
)

for name in "${!TRACKS[@]}"; do
  url="${TRACKS[$name]}"
  out="$DEST/${name}.mp3"
  if [[ -f "$out" ]]; then
    echo "  ✅ $name.mp3 already exists, skipping"
    continue
  fi
  echo "  ⬇️  Downloading $name..."
  curl -sfL "$url" -o "$out" && echo "  ✅ $name.mp3 saved" || echo "  ⚠️  Failed to download $name (check URL)"
done

count=$(find "$DEST" -name "*.mp3" | wc -l)
echo ""
echo "✅ Playlist seeded — $count MP3(s) in $DEST"
echo "   Attribution required: Kevin MacLeod (incompetech.com) — CC BY 3.0"
echo "   https://creativecommons.org/licenses/by/3.0/"
