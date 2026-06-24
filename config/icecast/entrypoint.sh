#!/usr/bin/env bash
# config/icecast/entrypoint.sh
# Substitute environment variables into icecast.xml template then exec Icecast.
set -euo pipefail

TEMPLATE="/etc/icecast2/icecast.xml.template"
CONFIG="/etc/icecast2/icecast.xml"

echo "[entrypoint] Substituting env vars into ${CONFIG}..."
envsubst < "${TEMPLATE}" > "${CONFIG}"

echo "[entrypoint] Starting Icecast2..."
exec "$@"
