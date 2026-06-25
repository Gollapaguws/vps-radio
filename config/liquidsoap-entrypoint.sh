#!/bin/sh
# Liquidsoap entrypoint: substitute env vars into radio.liq then run liquidsoap
set -e
cp /etc/liquidsoap/radio.liq /tmp/radio.liq
sed -i \
  -e "s|\${ICECAST_HOSTNAME}|${ICECAST_HOSTNAME:-icecast}|g" \
  -e "s|\${ICECAST_PORT}|${ICECAST_PORT:-8000}|g" \
  -e "s|\${ICECAST_SOURCE_PASSWORD}|${ICECAST_SOURCE_PASSWORD:-}|g" \
  -e "s|\${STATION_NAME}|${STATION_NAME:-VPS Radio}|g" \
  -e "s|\${STATION_DESCRIPTION}|${STATION_DESCRIPTION:-Live internet radio}|g" \
  -e "s|\${STATION_URL}|${STATION_URL:-http://localhost}|g" \
  -e "s|\${STATION_GENRE}|${STATION_GENRE:-Various}|g" \
  /tmp/radio.liq
exec liquidsoap /tmp/radio.liq
