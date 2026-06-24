#!/usr/bin/env liquidsoap
# radio.liq — VPS Radio Liquidsoap configuration
# Liquidsoap 2.x syntax

# ─── Settings ────────────────────────────────────────────────────────────────

settings.server.telnet.set(false)

# Log to stdout so Docker captures it
settings.log.stdout.set(true)
settings.log.level.set(3)

# ─── Icecast output credentials (from environment) ───────────────────────────

icecast_host  = getenv("ICECAST_HOSTNAME")
icecast_port  = int_of_string(getenv("ICECAST_PORT"))
icecast_pass  = getenv("ICECAST_SOURCE_PASSWORD")
station_name  = getenv("STATION_NAME")
station_desc  = getenv("STATION_DESCRIPTION")
station_url   = getenv("STATION_URL")
station_genre = getenv("STATION_GENRE")

# ─── Fallback playlist ───────────────────────────────────────────────────────
# Reads all MP3s from /music (mapped from assets/playlist in compose)

fallback_playlist = playlist(
  mode="randomize",
  reload=3600,
  "/music"
)

# Ensure the fallback source is always available (loop if playlist is short)
fallback = mksafe(fallback_playlist)

# ─── Live source (desktop DJs: BUTT, Mixxx, Darkice) ────────────────────────
# Icecast handles the /live mount; Liquidsoap pushes /fallback.
# When a DJ connects to /live directly, Icecast's fallback-override takes them
# live automatically — Liquidsoap only manages /fallback.

# ─── Smooth crossfade between tracks ─────────────────────────────────────────

radio = crossfade(duration=3.0, fade_in=1.5, fade_out=1.5, fallback)

# ─── Metadata normalisation ──────────────────────────────────────────────────

radio = map_metadata(
  update=true,
  fun(m) ->
    begin
      let title  = m["title"]
      let artist = m["artist"]
      let track  =
        if title != "" and artist != "" then
          "#{artist} \xe2\x80\x94 #{title}"
        elsif title != "" then
          title
        else
          "VPS Radio \xe2\x80\x94 Automated"
        end
      [("title", track), ("artist", artist)]
    end,
  radio
)

# ─── FFmpeg recording (writes to /recordings, cleaned up by cron) ────────────
# Uses mp3 encoder; requires liquidsoap-ffmpeg or built-in mp3 support

ignore(
  output.file(
    %mp3(bitrate=192, stereo=true),
    fallible=true,
    reopen_on_metadata=false,
    reopen_delay=3600.0,
    "/recordings/%Y-%m-%dT%H-%M-%S-fallback.mp3",
    radio
  )
)

# ─── Output: push fallback stream to Icecast /fallback mount ─────────────────

output.icecast(
  %mp3(bitrate=192, stereo=true, id3v2=true),
  host        = icecast_host,
  port        = icecast_port,
  password    = icecast_pass,
  mount       = "/fallback",
  name        = station_name,
  description = station_desc,
  url         = station_url,
  genre       = station_genre,
  public      = true,
  radio
)
