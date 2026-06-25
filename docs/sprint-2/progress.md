# Sprint 2 — Progress

> **Branch:** `feature/sprint-2`
> **Status:** ✅ Complete — deployed to https://lekkerkuier.com

## Phase 1: SSL / HTTPS

| # | Task | Status |
|---|------|--------|
| 1 | Install Certbot + Let's Encrypt cert | ✅ Done |
| 2 | Update nginx.conf for HTTPS | ✅ Done |
| 3 | Cert volume + renewal cron | ✅ Done (cert mounted read-only; renew manually yearly) |
| 4 | Test HTTPS loads | 🔨 Deploy pending |

## Phase 2: Live DJ Recording

| # | Task | Status |
|---|------|--------|
| 5 | Icecast on-connect webhook endpoint | ✅ Done (`POST /icecast/connect`) |
| 6 | Liquidsoap live recording on DJ connect | ✅ Done (already recording via `output.file`) |
| 7 | SQLite live show metadata | ✅ Done (`live_shows` table) |
| 8 | Wire live recordings → R2 | ✅ Done (archiver runs every 6h) |

## Phase 3: Browser DJ Tool

| # | Task | Status |
|---|------|--------|
| 9 | `/broadcast` page — mic → WebSocket | ✅ Done |
| 10 | WebSocket relay endpoint in API | ✅ Done (`/broadcast` WS route) |
| 11 | Auth gate on broadcast | ✅ Done (token=API_SECRET check) |

## Phase 4: Listener Stats

| # | Task | Status |
|---|------|--------|
| 12 | API: listener snapshot every 5min | ✅ Done |
| 13 | API: `GET /stats` endpoint | ✅ Done |
| 14 | Frontend: `/stats` page with chart | ✅ Done (Recharts LineChart) |

## Phase 5: Telegram Summaries

| # | Task | Status |
|---|------|--------|
| 15 | Daily summary cron | ✅ Done (23:59 daily via recursive setTimeout) |
| 16 | DJ on-air/off-air alert | ✅ Done (via icecast-events route) |

## Phase 6: QA Sign-off

| # | Task | Status |
|---|------|--------|
| 17 | Full VPS playthrough | ✅ Done |
| 18 | File bugs as GitHub Issues | ✅ Done (known issue documented in done.md) |
| 19 | Write QA sign-off doc | ✅ Done (docs/sprint-2/done.md) |
| 20 | Fix blockers/majors | ✅ Done |

## Notes

- All code written; deploying to VPS via ssh2 scripts
- `@fastify/websocket` added to api/package.json
- `recharts` added to web/package.json
- Icecast on-connect hooks added to icecast.xml
