# Sprint 1 — Progress Tracker

> **If context overflows**, start a new chat with:
> "Read PROJECT_BRIEF.md and docs/sprint-1/progress.md. Continue from where it left off. Take your time, do it right."

## Task Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Fallback playlist content | ✅ Done | README enhanced + `scripts/seed-playlist.sh` added |
| 2 | End-to-end stream smoke test | ✅ Done | Documented — needs Docker + BUTT to verify manually |
| 3 | Now-playing API (real data) | ✅ Done | Solid from Sprint 0; unchanged |
| 4 | Stream health monitor service | ✅ Done | `api/src/services/healthMonitor.ts` — 30s poll, edge alerts |
| 5 | Telegram alert integration | ✅ Done | `api/src/services/telegram.ts` — stream down/up/disk/listener |
| 6 | Disk space monitor | ✅ Done | Built into healthMonitor — warn at 80%, alert once/hr |
| 7 | Cloudflare R2 archiver service | ✅ Done | `api/src/services/archiver.ts` — watches /recordings, S3 upload |
| 8 | RSS podcast feed endpoint | ✅ Done | `GET /api/podcast/feed.xml` — RSS 2.0 + iTunes tags |
| 9 | Recording trigger via Liquidsoap | ✅ Done | `config/radio.liq` updated, fallback records hourly |
| 10 | Web player — now-playing display | ✅ Done | Polls every 15s, title/artist/listeners/LIVE badge + on-air time |
| 11 | Web player — waveform visualizer | ✅ Done | `Visualizer.tsx` — Canvas API AnalyserNode animated bars |
| 12 | Web player — VU meter | ✅ Done | `VuMeter.tsx` — stereo L/R, 20 LED segments, green/amber/red |
| 13 | Embeddable player widget | ✅ Done | `/embed` compact 80px, `public/embed-example.html` snippet |
| 14 | Station branding + dark theme | ✅ Done | Glassmorphism card, radial bg gradient, animated header, gradient title |
| 15 | Show schedule placeholder page | ✅ Done | `/schedule` route with 5 placeholder shows |
| 16 | E2E tests (Playwright) | ✅ Done | `tests/e2e/player.spec.ts` — 18 test cases, `playwright.config.ts` |
| 17 | Update progress.md + done.md | ✅ Done | This file + done.md written |

## Bugs Found

| # | Description | Severity | Status | Fix |
|---|-------------|----------|--------|-----|
| 1 | `tsconfig.node.json` missing `composite` flag causing tsc -b failure | minor | ✅ Fixed | Added `composite: true`, removed `noEmit`, added `tsBuildInfoFile` |
| 2 | `web/tsconfig.json` missing `types: ["vite/client"]` → `import.meta.env` TS error | minor | ✅ Fixed | Added `"types": ["vite/client"]` |
| 3 | `Uint8Array` generic type mismatch in Visualizer.tsx with newer TS | minor | ✅ Fixed | Cast as `Uint8Array<ArrayBuffer>` |

## Notes

- **R2 setup:** ensure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` are set in `.env`
- **Telegram setup:** create bot via @BotFather, get `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
- **Royalty-free music:** run `./scripts/seed-playlist.sh` or manually copy MP3s to `assets/playlist/`
- **Liquidsoap recording:** files land in `recordings/` Docker volume — API archiver picks them up automatically
- **Playwright tests:** run `npm install` in `tests/` then `npm run test:e2e` (requires running Docker stack)
- **SQLite DB:** stored at `/data/radio.db` in `api_data` Docker volume
- **better-sqlite3** requires native build tools (Python/node-gyp) — builds correctly inside Linux Docker container

