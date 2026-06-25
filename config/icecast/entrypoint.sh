#!/usr/bin/env bash
# config/icecast/entrypoint.sh
# Substitute environment variables into icecast.xml template then exec Icecast
# as non-root user (icecastrun) to satisfy Icecast2's root check.
set -euo pipefail

TEMPLATE="/etc/icecast2/icecast.xml.template"
CONFIG="/etc/icecast2/icecast.xml"

echo "[entrypoint] Substituting env vars into ${CONFIG}..."
envsubst < "${TEMPLATE}" > "${CONFIG}"
chown icecastrun:icecast2grp "${CONFIG}"

echo "[entrypoint] Starting Icecast2 as icecastrun..."
exec gosu icecastrun "$@"
