# Sprint 2 — Polish & Launch

> **Branch:** `feature/sprint-2`
> **Status:** ⬜ Planned
> **Goal:** Make the station fully production-grade — HTTPS, live DJ recording, listener stats, browser broadcast tool, QA sign-off.

## Prerequisites

- Sprint 1 merged to `main` ✅
- VPS running at http://lekkerkuier.com ✅
- Domain lekkerkuier.com resolving to 72.62.211.31 ✅

## Tasks

### Phase 1: SSL / HTTPS (Blocker — must do first)

| # | Task | Owner | Issue |
|---|------|-------|-------|
| 1 | Install Certbot + Let's Encrypt cert for lekkerkuier.com | Sage/Dash | — |
| 2 | Update nginx.conf for HTTPS — port 443 + HTTP→HTTPS redirect | Sage | — |
| 3 | Add cert volume + renewal cron to docker-compose | Sage | — |
| 4 | Test: `https://lekkerkuier.com` loads player | Ivy | — |

### Phase 2: Live DJ Recording

| # | Task | Owner | Issue |
|---|------|-------|-------|
| 5 | Add Icecast `on-connect` / `on-disconnect` webhook endpoint to API | Sage | — |
| 6 | Trigger Liquidsoap live recording when DJ connects to `/live` mount | Sage | — |
| 7 | Store live show metadata in SQLite on connect/disconnect | Sage | — |
| 8 | Wire live recordings into archiver → R2 upload | Sage | — |

### Phase 3: Browser DJ Tool

| # | Task | Owner | Issue |
|---|------|-------|-------|
| 9 | Build `/broadcast` page — mic input → WebSocket → Icecast relay | Nova | — |
| 10 | WebSocket relay endpoint in API (`/broadcast` WS) | Sage | — |
| 11 | Auth gate: require `API_SECRET` header before allowing broadcast | Sage | — |

### Phase 4: Listener Stats Dashboard

| # | Task | Owner | Issue |
|---|------|-------|-------|
| 12 | API: store listener count snapshots in SQLite every 5min | Sage | — |
| 13 | API: `GET /stats` — hourly/daily listener chart data | Sage | — |
| 14 | Frontend: `/stats` page — line chart (Chart.js or Recharts) | Nova | — |

### Phase 5: Telegram Summaries + Alert Improvements

| # | Task | Owner | Issue |
|---|------|-------|-------|
| 15 | Daily summary: cron job → Telegram message with listener peak + track count | Sage | — |
| 16 | DJ on-air alert: Telegram message when live DJ connects/disconnects | Sage | — |

### Phase 6: QA Sign-off

| # | Task | Owner | Issue |
|---|------|-------|-------|
| 17 | Full playthrough on live VPS — player, stream, API, schedule, embed | Ivy | — |
| 18 | File bugs as GitHub Issues with `bug` + severity labels | Ivy | — |
| 19 | Write `docs/qa/sprint-2-signoff.md` | Ivy | — |
| 20 | Fix all `blocker` + `major` issues before merge | Dev team | — |

## Success Criteria

- [ ] `https://lekkerkuier.com` loads with valid TLS cert (no browser warnings)
- [ ] HTTP redirects to HTTPS
- [ ] Live DJ recording: connecting BUTT → `/live` triggers recording, disconnecting stops + archives
- [ ] `/broadcast` page: browser mic → stream live to Icecast
- [ ] `/stats` page: listener chart visible
- [ ] Telegram: stream-down alert fires within 60s, daily summary at midnight
- [ ] QA sign-off document written, all blockers resolved
- [ ] PR merged to `main`

## Technical Notes

### SSL Setup
```bash
# On VPS
docker run --rm -v /opt/radio/certs:/etc/letsencrypt certbot/certbot certonly \
  --standalone --email admin@lekkerkuier.com -d lekkerkuier.com --agree-tos
```
Then mount `/opt/radio/certs` into nginx container.

### Nginx HTTPS config additions
```nginx
server {
    listen 80;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/lekkerkuier.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lekkerkuier.com/privkey.pem;
    # ... rest of config
}
```

### Browser DJ Tool (task 9–11)
- Use `getUserMedia` → MediaRecorder → WebSocket chunks → API relay → Icecast source
- Auth: `?token=<API_SECRET>` query param on WebSocket URL
- UI: big red `GO LIVE` button, mic level indicator, listener count

### Listener Stats (task 12–14)
- `better-sqlite3` table: `listener_snapshots(ts INTEGER, count INTEGER, mount TEXT)`
- API endpoint: `GET /stats?period=24h|7d|30d` returns `{labels: [], data: []}`
- Chart: Recharts `<LineChart>` — already in React app, add as dep

## Definition of Done

Sprint 2 is done when:
1. All 20 tasks ✅ Done in `progress.md`
2. `docs/qa/sprint-2-signoff.md` written by Ivy
3. All blocker/major GitHub Issues closed
4. `sprint-2: complete — polish & launch` commit on `feature/sprint-2`
5. PR merged to `main`
