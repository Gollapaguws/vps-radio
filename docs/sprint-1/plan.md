# Sprint 1 — Core Radio

> **Sprint Goal:** Full working internet radio — live streaming, 24/7 fallback, web player with metadata, stream health monitor with Telegram alerts, and Cloudflare R2 podcast archiver.
> **Branch:** `feature/sprint-1`
> **Estimated effort:** 6–8 hours
> **Agents:** Sage (backend/infra lead), Nova (frontend), Milo (CSS/polish)

## Prioritized Task List

| # | Task | Owner | Est | Description |
|---|------|-------|-----|-------------|
| 1 | Fallback playlist content | Sage | 20m | Add 3+ royalty-free MP3s to `assets/playlist/` so Liquidsoap has something to play on startup |
| 2 | End-to-end stream smoke test | Sage | 30m | `docker compose up`, connect BUTT, confirm `/live` streams, confirm `/fallback` plays when no source |
| 3 | Now-playing API (real data) | Sage | 45m | Fix `/api/now-playing` to parse Icecast XML stats correctly — return `{title, artist, listeners, mount, live}` |
| 4 | Stream health monitor service | Sage | 60m | `api/src/services/healthMonitor.ts` — polls Icecast every 30s, detects stream down, attempts Docker restart, sends Telegram alert |
| 5 | Telegram alert integration | Sage | 30m | `api/src/services/telegram.ts` — alerts on stream down/up, high listener count, disk space warning |
| 6 | Disk space monitor | Sage | 20m | Part of health monitor — warn at 80% disk usage (recordings fill up fast) |
| 7 | Cloudflare R2 archiver service | Sage | 60m | `api/src/services/archiver.ts` — watches `recordings/` dir, uploads completed shows to R2, generates RSS podcast feed entry |
| 8 | RSS podcast feed endpoint | Sage | 30m | `GET /api/podcast/feed.xml` — valid RSS 2.0 + iTunes podcast feed from SQLite show log |
| 9 | Recording trigger via Liquidsoap | Sage | 30m | Update `config/radio.liq` — record to `recordings/YYYY-MM-DD_HH-MM.mp3` on source connect, stop on disconnect |
| 10 | Web player — now-playing display | Nova | 45m | Poll `/api/now-playing` every 15s, show track title/artist, listener count, LIVE/FALLBACK badge |
| 11 | Web player — waveform visualizer | Nova | 45m | Canvas API visualizer using Web Audio API AnalyserNode — animated bars synced to audio |
| 12 | Web player — VU meter | Milo | 30m | Animated VU meter (CSS + JS) — left/right channel levels, classic dark green/amber/red zones |
| 13 | Embeddable player widget | Nova | 30m | `<script>` embed snippet — `<iframe src="/embed">` 80px sticky bar, auto-play off, respects user gesture |
| 14 | Station branding + dark theme | Milo | 30m | Logo placeholder, station name from env, glassmorphism card for player, smooth transitions |
| 15 | Show schedule placeholder page | Nova | 20m | `/schedule` route — shows upcoming shows (static for now) |
| 16 | E2E tests (Playwright) | Sage | 45m | `tests/e2e/player.spec.ts` — player loads, stream plays, now-playing updates, health endpoint ok |
| 17 | Update progress.md + done.md | All | 20m | Final handoff docs |

## Work Schedule

### Phase 1: Streaming Core (tasks 1–3)
- Confirm end-to-end stream works with real audio
- Now-playing API returns real Icecast data
- **Checkpoint commit:** `sprint-1: streaming core working`

### Phase 2: Health & Monitoring (tasks 4–6)
- Health monitor polls Icecast, detects outages
- Telegram alerts fire on stream down/up
- Disk space warning at 80%
- **Checkpoint commit:** `sprint-1: health monitor + telegram alerts`

### Phase 3: R2 Archiver + Podcast Feed (tasks 7–9)
- Liquidsoap records each live show to file
- Archiver uploads to R2 automatically
- RSS feed endpoint live
- **Checkpoint commit:** `sprint-1: r2 archiver + podcast feed`

### Phase 4: Web Player Polish (tasks 10–14)
- Now-playing metadata live in player
- Canvas visualizer + VU meter
- Embeddable widget + station branding
- **Checkpoint commit:** `sprint-1: web player complete`

### Phase 5: Tests + Handoff (tasks 15–17)
- Playwright E2E tests
- Schedule placeholder page
- done.md + PROJECT_BRIEF update
- **Final commit:** `sprint-1: complete — core radio live`

## Success Criteria

- [ ] `docker compose up` → fallback playlist plays immediately (no silence)
- [ ] BUTT connects → stream switches to live source seamlessly
- [ ] BUTT disconnects → stream falls back to playlist (no dead air)
- [ ] `GET /api/now-playing` returns `{title, artist, listeners, live: true/false}`
- [ ] `GET /api/health` returns `{status: 'ok', stream: 'up', listeners: N, disk: '45%'}`
- [ ] Telegram alert fires within 60s of stream going down
- [ ] Telegram alert fires when stream comes back up
- [ ] Every BUTT session creates a recording in `recordings/`
- [ ] Recording uploads to R2 within 5 minutes of show ending
- [ ] `GET /api/podcast/feed.xml` returns valid RSS 2.0 with iTunes tags
- [ ] Web player shows live title/artist, updates every 15s
- [ ] Canvas visualizer animates while audio plays
- [ ] VU meter responds to audio level
- [ ] Embed snippet works in an external HTML file
- [ ] All Playwright tests pass
- [ ] `docs/sprint-1/done.md` written and committed
- [ ] `PROJECT_BRIEF.md` sections 7+8 updated

## What's NOT in This Sprint

| Feature | Reason |
|---------|--------|
| Browser-based DJ tool | Sprint 2 |
| Listener request system | Sprint 3 |
| Show scheduling / DJ management | Sprint 3 |
| Multi-bitrate streams | Future |
| Listener stats dashboard | Sprint 2 |

## Agent Prompt (copy this to start Sprint 1)

```
Read PROJECT_BRIEF.md, then read docs/sprint-1/plan.md. Execute Sprint 1.

You are the dev team: Sage (backend/infra lead), Nova (frontend), Milo (CSS/visual).
Take your time, do it right.

First:
  git pull origin main
  git checkout -b feature/sprint-1

Work through each task in order. After each phase, make a checkpoint commit.
Update docs/sprint-1/progress.md after each phase.

Commit format: sprint-1: <description>

When all tasks are done:
1. Write docs/sprint-1/done.md
2. Update PROJECT_BRIEF.md sections 7 and 8
3. git push origin feature/sprint-1
4. gh pr create --title "Sprint 1: Core Radio" --body "See docs/sprint-1/done.md for handoff notes."

Follow Sections 12-14 of PROJECT_BRIEF.md throughout.
```
