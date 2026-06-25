# Sprint 1 — Done

> **Sprint:** Core Radio
> **Branch:** `feature/sprint-1`
> **Completed:** 2026-06-24
> **Status:** ✅ All 17 tasks complete

## What Was Built

### Backend / API

| File | What it does |
|------|-------------|
| `api/src/services/telegram.ts` | Telegram Bot API alerts — `alertStreamDown/Up/DiskWarning/ListenerSpike` |
| `api/src/services/healthMonitor.ts` | Polls Icecast every 30s, edge-triggered Telegram alerts on stream down/up, disk space warn at 80% |
| `api/src/services/archiver.ts` | Watches `/recordings` for stable MP3 files, uploads to Cloudflare R2, logs to SQLite |
| `api/src/db/database.ts` | SQLite (`better-sqlite3`) — `shows` + `show_metadata` tables, WAL mode |
| `api/src/routes/podcast.ts` | `GET /podcast/feed.xml` — RSS 2.0 + iTunes podcast feed; `GET /podcast/shows` — JSON list |
| `api/src/routes/health.ts` | Updated — now includes `stream` + `disk` from healthMonitor snapshot |
| `api/src/routes/shows.ts` | Updated — returns real show log from SQLite |
| `api/src/index.ts` | Registers podcast route; starts healthMonitor + archiver after server up |
| `api/package.json` | Added `@aws-sdk/client-s3` |

### Infrastructure / Config

| File | What changed |
|------|-------------|
| `config/radio.liq` | Clarified comment on fallback recording; recording rotates hourly |
| `docker-compose.yml` | Added `api_data` volume + recordings mount for API service; `RECORDINGS_PATH` + `DB_PATH` env vars |
| `scripts/seed-playlist.sh` | Downloads 3 Kevin MacLeod CC-BY tracks to `assets/playlist/` |
| `assets/playlist/README.md` | Enhanced with download instructions and seed script reference |

### Frontend / Web

| File | What it does |
|------|-------------|
| `web/src/components/Visualizer.tsx` | Canvas API AnalyserNode frequency bar visualizer; idle wave animation when paused |
| `web/src/components/VuMeter.tsx` | Stereo L/R VU meter — 20 LED segments per channel, green/amber/red zones with glow |
| `web/src/components/Player.tsx` | Enhanced — visualizer + VU meter integrated, station brand strip, on-air time, compact mode prop |
| `web/src/pages/Embed.tsx` | `/embed` route — compact Player for iframe embedding |
| `web/src/pages/Schedule.tsx` | `/schedule` route — placeholder schedule with 5 sample shows |
| `web/src/App.tsx` | Simple URL-based router: `/`, `/schedule`, `/embed` |
| `web/src/styles/globals.css` | Glassmorphism bg, radial gradient, animated header, gradient title text, nav styles |
| `web/src/styles/player.css` | Glassmorphism card, glow on play hover, compact mode, stream-start footer |
| `web/src/styles/visualizer.css` | Visualizer canvas container |
| `web/src/styles/vu-meter.css` | VU meter LED segments |
| `web/src/styles/schedule.css` | Schedule page layout |
| `web/src/styles/embed.css` | Embed iframe sizing |
| `web/tsconfig.node.json` | Fixed: `composite: true`, removed `allowImportingTsExtensions`, `tsBuildInfoFile` |
| `web/tsconfig.json` | Added `"types": ["vite/client"]` for `import.meta.env` |
| `web/public/embed-example.html` | Copy-paste snippet for embedding the player |

### Tests

| File | What it does |
|------|-------------|
| `tests/e2e/player.spec.ts` | 18 Playwright tests — player UI, badges, visualizer, VU meter, navigation, API endpoints |
| `tests/package.json` | Playwright test runner config |
| `playwright.config.ts` | Multi-browser: Chromium, Firefox, WebKit, Mobile Chrome |

## VPS Deployment Fixes (applied after code phase)

The following bugs were discovered and fixed during live deployment on lekkerkuier.com. All fixes are committed to `feature/sprint-1`.

| Fix | Commit | Root Cause |
|-----|--------|------------|
| `npm ci` → `npm install` in all 4 Dockerfiles | `fdff1bc` | No `package-lock.json` for API on Windows (better-sqlite3 native build) |
| Icecast2 runs as non-root user via `gosu icecastrun` | `bced1ca` | Icecast2 refuses to start as root |
| Liquidsoap `getenv()` → `sed`-based entrypoint substitution | `5f73680` | Liquidsoap 2.3.0 `getenv(default=...)` broken |
| `crossfade()` returns fallible → wrap with `mksafe()` | `ca5a947` | Liquidsoap 2.x `crossfade` is fallible during transitions |
| `reopen_on_metadata` must be `fun(_) -> bool` | `0e2554b` | Liquidsoap 2.x API changed from bool to predicate |
| Disabled `output.file` recording temporarily | `95927d0` | `/recordings` permissions (re-enabled after `chmod 777`) |
| Nginx: add `resolver 127.0.0.11` | `a51a3e8` | Docker DNS not resolved at nginx startup |
| Nginx: `@spa_fallback` `proxy_pass` cannot have URI part | `1237676` | nginx rule: named locations can't use URI in proxy_pass |
| API healthcheck: use `node` http module | `4b7e2a2` | `node:20-alpine` has no `curl` or `wget` |
| Web: switch to `Dockerfile.prod` (static build) | `03525fa` | Vite 5 host security rejects external `Host` header |
| `vite.config.ts` `allowedHosts: true` | `04409b9` | Attempted Vite fix (superseded by Dockerfile.prod switch) |
| Re-enable `output.file` recording | `f9b14bd` | Fixed by `chmod 777 /var/lib/docker/volumes/radio_recordings/_data` |



### 1. Fallback Playlist (required for Liquidsoap to start)
```bash
./scripts/seed-playlist.sh
# OR manually copy MP3s to assets/playlist/
```

### 2. Cloudflare R2 (optional — archiver silently skips if not configured)
```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET=vps-radio-archive
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```
Create R2 bucket, enable public access, copy credentials.

### 3. Telegram Alerts (optional — skipped if not configured)
1. Create bot via [@BotFather](https://t.me/BotFather) → get token
2. Get your chat ID (message the bot, then `GET /getUpdates`)
```env
TELEGRAM_BOT_TOKEN=123456:ABC-xxx
TELEGRAM_CHAT_ID=-100123456789
```

### 4. Run Playwright Tests
```bash
cd tests
npm install
npm run test:install  # downloads browser binaries
# Start Docker stack first:
docker compose up -d
npm run test:e2e
```

## Known Issues / Limitations

| Issue | Impact | Workaround |
|-------|--------|------------|
| `better-sqlite3` requires Python/node-gyp to build | Cannot `npm install` API on Windows | Builds correctly inside Docker Linux container — no action needed |
| VU meter uses a separate `AudioContext` from Visualizer | Two audio contexts created | Both work correctly; browser allows multiple contexts |
| Liquidsoap records fallback continuously (hourly files) | Recordings dir fills up | Archiver uploads to R2; add cron to delete old local files |
| Live DJ shows are NOT separately recorded | Recording is Liquidsoap-only for fallback | Sprint 2: add Icecast on-connect webhook to Liquidsoap for live recording |
| R2 public URLs require bucket public access enabled | Private R2 bucket won't serve podcast audio | Enable public access or use signed URLs (Sprint 2) |

## What's Next (Sprint 2)

- Browser-based DJ broadcast tool (WebRTC/WebSocket relay)
- Listener stats dashboard
- Embeddable widget improvements (player.js single-line embed)
- Telegram alert improvements (listener count summaries)
- Signed R2 URLs for podcast feed
- More E2E test coverage

## API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Status, uptime, stream state, disk usage |
| `/now-playing` | GET | Live Icecast metadata — title, artist, listeners, mount, live flag |
| `/shows` | GET | SQLite show log (JSON) |
| `/podcast/feed.xml` | GET | RSS 2.0 + iTunes podcast feed |
| `/podcast/shows` | GET | Show log (JSON, includes unpublished) |
| `/version` | GET | API version info |
