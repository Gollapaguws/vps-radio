#!/usr/bin/env liquidsoap
# radio.liq — VPS Radio Liquidsoap configuration
# Liquidsoap 2.x syntax
# NOTE: This file is processed by envsubst before execution.
# Use ${VAR} for environment variable substitution.

# ─── Settings ────────────────────────────────────────────────────────────────

settings.server.telnet.set(false)

# Log to stdout so Docker captures it
settings.log.stdout.set(true)
settings.log.level.set(3)

# ─── Icecast output credentials (substituted by entrypoint via envsubst) ─────

icecast_host  = "${ICECAST_HOSTNAME}"
icecast_port  = int_of_string("${ICECAST_PORT}")
icecast_pass  = "${ICECAST_SOURCE_PASSWORD}"
station_name  = "${STATION_NAME}"
station_desc  = "${STATION_DESCRIPTION}"
station_url   = "${STATION_URL}"
station_genre = "${STATION_GENRE}"

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
# The /live mount is fed directly by DJs via Icecast.
# Liquidsoap manages /fallback; Icecast fallback-override handles the switch.

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

# crossfade can be fallible briefly during transitions — ensure infallible output
radio = mksafe(radio)

# ─── Fallback recording (continuous, rotates hourly) ─────────────────────────
# Records the fallback stream; files land in /recordings for the API archiver.

ignore(
  output.file(
    %mp3(bitrate=192, stereo=true),
    reopen_on_metadata=fun(_) -> false,
    reopen_delay=3600.0,
    "/recordings/fallback-%Y%m%d-%H%M%S.mp3",
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
