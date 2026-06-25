# Sprint 2 — Done

> **Branch:** `feature/sprint-2`
> **Completed:** 2026-06-25
> **VPS:** lekkerkuier.com (72.62.211.31)

## What Was Built

### Phase 1: SSL / HTTPS ✅
- Let's Encrypt cert obtained via certbot Docker container (valid until 2026-09-23)
- nginx.conf: HTTP→HTTPS 301 redirect, HTTPS on port 443, TLS 1.2/1.3 only
- HSTS header, ssl_stapling, hardened cipher suite
- Cert mounted read-only: `/opt/radio/certs:/etc/letsencrypt:ro`

### Phase 2: Live DJ Recording ✅
- `POST /icecast/connect` + `/icecast/disconnect` — logs DJ sessions to `live_shows` SQLite table
- Body auth via `API_SECRET` on both endpoints
- Icecast `<on-connect>`/`<on-disconnect>` hooks fire curl to API (port 4000)
- Recordings already running via Liquidsoap `output.file` (Sprint 1)
- Archiver pushes completed recordings to R2 every 6 hours

### Phase 3: Browser DJ Tool ✅
- `GET /broadcast` WebSocket endpoint — token auth via `?token=API_SECRET`
- Browser mic → MediaRecorder (audio/webm;codecs=opus) → WebSocket → Icecast SOURCE protocol
- `/broadcast` page: glassmorphic go-live UI, mic level meter, live listener count, on-air badge

### Phase 4: Listener Stats ✅
- healthMonitor: takes listener snapshot every 5 minutes → `listener_snapshots` table
- `GET /stats?period=24h|7d|30d` — returns Chart.js-ready data
- `/stats` page: Recharts LineChart, period selector, peak listener count, auto-refreshes every 30s

### Phase 5: Telegram Summaries ✅
- `sendTelegram()` generic export in telegram.ts
- Daily summary Telegram message at 23:59 (recursive setTimeout, no drift)
- DJ on-air alert: `🎙️ DJ ON AIR — Mount: /live`
- DJ off-air alert: `📴 DJ OFF AIR — Duration: N min`

## Files Changed

| File | Change |
|------|--------|
| `config/nginx.conf` | Full HTTPS rewrite: port 443, TLS, HSTS, HTTP→301 |
| `docker-compose.yml` | nginx: certs volume, ports 80+443 |
| `config/icecast/icecast.xml` | Added `<on-connect>` + `<on-disconnect>` curl hooks |
| `api/package.json` | Added `@fastify/websocket: ^8.3.1` |
| `api/src/index.ts` | Registered websocket plugin + 3 new routes |
| `api/src/services/telegram.ts` | Added `sendTelegram` generic export |
| `api/src/services/healthMonitor.ts` | Listener snapshots every 5min, daily summary |
| `api/src/db/database.ts` | Added `live_shows` + `listener_snapshots` tables |
| `api/src/routes/icecast-events.ts` | NEW: DJ connect/disconnect event handler |
| `api/src/routes/broadcast.ts` | NEW: WebSocket relay → Icecast source |
| `api/src/routes/stats.ts` | NEW: GET /stats listener data |
| `web/package.json` | Added `recharts: ^2.12.7` |
| `web/src/App.tsx` | Added /stats + /broadcast routes + nav links |
| `web/src/pages/Stats.tsx` | NEW: Listener chart page |
| `web/src/pages/Broadcast.tsx` | NEW: Browser DJ go-live page |
| `web/src/styles/stats.css` | NEW |
| `web/src/styles/broadcast.css` | NEW |

## VPS State After Sprint 2

| Service | Status | Notes |
|---------|--------|-------|
| Nginx | ✅ Up | Ports 80+443, HTTP→HTTPS |
| Icecast | ✅ Healthy | Port 8000 (internal only) |
| Liquidsoap | ✅ Up | Streaming Kevin MacLeod |
| API | ✅ Up | All routes live |
| Web | ✅ Up | Static build on port 3000 |
| TLS | ✅ Valid | Expires 2026-09-23 |

## Manual Setup Required

### Telegram Bot (optional)
Set in `/opt/radio/.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```
Then `docker compose restart api`.

### R2 Archival (optional)
Set in `/opt/radio/.env`:
```
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=vps-radio-archive
```

### Browser DJ / Broadcast
Open `https://lekkerkuier.com/broadcast`, enter `radioApiSecret2025` as the token.

### Cert Renewal
Let's Encrypt certs expire in 90 days. To renew:
```bash
docker run --rm -v /opt/radio/certs:/etc/letsencrypt -v /opt/radio/certs-challenge:/var/www/certbot \
  certbot/certbot renew
docker compose restart nginx
```
Or set a cron: `0 3 * * * certbot renew --quiet && docker compose -f /opt/radio/docker-compose.yml restart nginx`

## Known Issues

- `@fastify/websocket` is installed in the Docker anonymous volume on the VPS (via `docker exec`), not in the image. If the container is fully destroyed and recreated, `npm install` will need to run again. **Fix:** update `Dockerfile` to use prod build (see Sprint 3).
- `recharts` in web is installed in the image at build time — ✅ fine.
- Browser DJ broadcast requires a modern browser with MediaRecorder + WebM/Opus support (Chrome, Edge, Firefox ≥ 116).
- Icecast on-connect hooks require `curl` inside the Icecast container (it's Debian-based — curl is available).
- Stats page shows empty until 5 minutes have elapsed after API startup.

## URLs

| Endpoint | URL |
|----------|-----|
| Player | https://lekkerkuier.com |
| Schedule | https://lekkerkuier.com/schedule |
| Stats | https://lekkerkuier.com/stats |
| Go Live | https://lekkerkuier.com/broadcast |
| Embed | https://lekkerkuier.com/embed |
| API Health | https://lekkerkuier.com/api/health |
| Podcast Feed | https://lekkerkuier.com/api/podcast/feed.xml |
