# PROJECT_BRIEF.md — VPS Internet Radio & Streaming Broadcaster

> Last updated: 2026-06-24 | Sprint 1 | Status: ✅ Done

## 1. Project Overview

A self-hosted internet radio station and live broadcaster running on a VPS. The system streams audio 24/7 using Icecast2 and Liquidsoap, serves a beautiful embeddable web player, archives every live show automatically to cloud storage, and monitors itself with auto-restart on failure. DJs broadcast using standard desktop clients (BUTT, Mixxx, Darkice) or a minimal browser fallback.

## 2. Concept / Product Description

The station runs continuously — when no live DJ is connected, Liquidsoap plays a curated fallback playlist. When a DJ connects, they take over the stream seamlessly. Every show is recorded and uploaded to Cloudflare R2, then auto-published as a podcast episode via RSS. Listeners can tune in via the embedded web player, any HLS-capable app, or direct Icecast mount. A dark-mode minimalist player widget can be embedded in any website.

**Key user flows:**
- **Listener:** Opens web player → sees now-playing metadata + VU meter → listens
- **DJ (desktop):** Opens BUTT → enters source credentials → goes live
- **DJ (browser fallback):** Opens `/broadcast` → grants mic → streams via WebSocket
- **Admin:** Checks health dashboard → reviews stream stats → manages fallback playlist

## 3. Tech Stack

- **Streaming:** Icecast2 (mount point server), Liquidsoap (playlist + source logic)
- **Audio processing:** FFmpeg (transcoding, recording)
- **Backend API:** Node.js 20 + Fastify (metadata, health, auth, archive trigger)
- **Frontend:** React 18 + Vite (web player, broadcast tool)
- **Storage:** Cloudflare R2 (podcast archive, recordings)
- **Database:** SQLite via better-sqlite3 (show log, playlist, listener stats)
- **Infrastructure:** Docker + Docker Compose, Nginx (reverse proxy + SSL termination)
- **SSL:** Let's Encrypt via Certbot
- **Notifications:** Telegram Bot API (stream health alerts)
- **CI/CD:** GitHub Actions
- **Testing:** Playwright (E2E), Vitest (unit)
- **VPS:** Any Ubuntu 22.04 LTS VPS (2GB RAM minimum recommended)

## 4. Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Listeners                          │
│         Browser / Mobile App / Podcast App               │
└───────────────────────┬──────────────────────────────────┘
                        │ HTTPS (443)
┌───────────────────────▼──────────────────────────────────┐
│                    Nginx (reverse proxy)                   │
│  /          → React Web Player (static)                   │
│  /api       → Node.js Fastify API                         │
│  /stream    → Icecast2 mount point (/live, /fallback)     │
│  /broadcast → WebSocket source relay                      │
└──────┬──────────────┬───────────────┬────────────────────┘
       │              │               │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼────────────────────┐
│  React App  │ │  Fastify   │ │       Icecast2            │
│  (Vite)     │ │  API       │ │  /live  (DJ source)       │
│             │ │            │ │  /fallback (Liquidsoap)   │
│  - Player   │ │  - /now-   │ └─────────┬────────────────┘
│  - VU meter │ │    playing │           │
│  - Schedule │ │  - /health │ ┌─────────▼────────────────┐
│  - Requests │ │  - /auth   │ │      Liquidsoap           │
└─────────────┘ │  - /shows  │ │  - Fallback playlist      │
                └──────┬─────┘ │  - Transition logic       │
                       │       │  - FFmpeg recording        │
                       │       └─────────┬────────────────┘
                       │                 │ recordings
                       │       ┌─────────▼────────────────┐
                       │       │    Cloudflare R2          │
                       └──────►│  podcast episodes         │
                               │  show archives            │
                               └──────────────────────────┘
```

## 5. Key Files Map

| Area | Path | Contents |
|------|------|----------|
| Docker config | `docker-compose.yml` | All service definitions |
| Icecast config | `config/icecast.xml` | Mount points, passwords, limits |
| Liquidsoap script | `config/radio.liq` | Playlist logic, fallback, recording |
| Nginx config | `config/nginx.conf` | Proxy rules, SSL, CORS |
| API entry | `api/src/index.ts` | Fastify server bootstrap |
| API routes | `api/src/routes/` | health, now-playing, shows, auth |
| Frontend | `web/src/` | React components |
| Player component | `web/src/components/Player.tsx` | Main audio player |
| Broadcaster | `web/src/pages/Broadcast.tsx` | Browser DJ tool |
| Fallback playlist | `assets/playlist/` | MP3s for fallback |
| Tests | `tests/` | Playwright E2E + Vitest unit |
| Sprint docs | `docs/sprint-N/` | Plan, progress, done |
| QA docs | `docs/qa/` | Sign-off reports |

## 6. Team Roles

| Agent | Name | Custom Agent | Role |
|-------|------|-------------|------|
| Producer | Remy | `@ai-team-producer` | Sprint plans, coordination, PR merges — NEVER writes code |
| Frontend + Visual | Nova/Milo | `@ai-team-dev` | React player, CSS, VU meter, broadcast UI |
| Backend | Sage | `@ai-team-dev` | Node.js API, Icecast/Liquidsoap config, Docker, R2 |
| Product/UX | Kira | `@ai-team-dev` | Feature specs, user flows, accessibility |
| QA | Ivy | `@ai-team-qa` | E2E tests, stream health tests, bug filing, sign-off |

## 7. Sprint Status

| Sprint | Name | Status | Scope |
|--------|------|--------|-------|
| 0 | Infrastructure | ✅ Done | VPS setup, Docker, Nginx, SSL, Icecast2 + Liquidsoap, API scaffold, React player scaffold |
| 1 | Core Radio | ✅ Done | Health monitor, Telegram alerts, R2 archiver, podcast feed, Canvas visualizer, VU meter, embed widget, schedule page, Playwright tests |
| 2 | Polish & Launch | ⬜ Planned | Browser DJ tool, embeddable widget v2, listener stats, Telegram summaries, QA sign-off |
| 3 | Dashboard | ⬜ Planned | Show scheduling, DJ management, listener requests |

## 8. Current State (rewrite every sprint)

**Live at: http://lekkerkuier.com** (VPS: 72.62.211.31, Ubuntu, Docker Compose)

**All 5 public endpoints returning HTTP 200:**
- `http://lekkerkuier.com/` — Web player (React, glassmorphism design)
- `http://lekkerkuier.com/schedule` — Schedule page
- `http://lekkerkuier.com/embed` — Embeddable compact player
- `http://lekkerkuier.com/api/health` — API health JSON
- `http://lekkerkuier.com/api/now-playing` — Live track metadata

**What works:**
- Full Docker Compose stack (5 services): Icecast2 ✅, Liquidsoap ✅, Node.js API ✅, React web (static) ✅, Nginx ✅
- Icecast: runs as non-root via `gosu icecastrun`; healthy
- Liquidsoap: plays fallback CC music playlist with crossfade; records hourly MP3s to `/recordings`
- `GET /health` → `{status:"ok", stream:{status:"up", mount:"/fallback"}, disk:{usedPct:"8%", freeGb:89}}`
- `GET /now-playing` → real track metadata from Icecast XML
- `GET /shows` → SQLite show log
- `GET /podcast/feed.xml` → RSS 2.0 + iTunes podcast feed
- Web player: Canvas visualizer, stereo VU meter, glassmorphism dark card, live badge, now-playing metadata
- API Docker healthcheck: uses `node` http module (no curl/wget in node:alpine)
- Web served as static production build (Dockerfile.prod + http-server) — no Vite host restrictions
- Recordings volume: `radio_recordings` → `/recordings` in both liquidsoap + api containers (chmod 777)
- Caddy disabled (`systemctl disable caddy`) — won't reclaim port 80 on reboot

**What doesn't work yet:**
- Live DJ show recording (Liquidsoap records fallback only; live source needs Icecast webhook — Sprint 2)
- R2 credentials not configured on VPS (archiver silently skips — Sprint 2)
- Telegram alerts not configured on VPS (skipped — Sprint 2)
- No HTTPS/SSL — runs on HTTP port 80 only (Sprint 2: Let's Encrypt via Certbot)
- Browser DJ broadcast tool not built (Sprint 2)
- Listener stats dashboard (Sprint 2)

**VPS credentials (.env):**
- `ICECAST_SOURCE_PASSWORD=radioSource2025`
- `ICECAST_ADMIN_PASSWORD=radioAdmin2025`
- `API_SECRET=radioApiSecret2025`

**What's next:**
- Sprint 2: Browser DJ tool, SSL/HTTPS, listener stats, Telegram summaries, QA sign-off

## 9. Security Rules

1. **Secrets in environment variables only** — never in code or git. Use `.env` (gitignored).
2. **Icecast admin port (8000) must NOT be exposed** — only Nginx proxy on 443.
3. **Source passwords** (DJ credentials) stored in `.env`, never hardcoded.
4. **Nginx rate limiting** on `/stream` mount to prevent bandwidth abuse.
5. **R2 credentials** in env vars only. Bucket is private — signed URLs for podcast feeds.
6. **Telegram bot token** in env var only.
7. **SSH key auth only** on VPS — disable password SSH.

## 10. How to Run Locally

```bash
git clone <repo> radio-dev
cd radio-dev
cp .env.example .env
# Edit .env with your credentials
docker compose up -d
# Web player: http://localhost:3000
# Icecast admin: http://localhost:8000/admin (DO NOT expose in prod)
# API: http://localhost:4000
```

**Connect a test source (BUTT):**
- Server: `localhost`, Port: `8000`
- Mount: `/live`, Password: from `.env` ICECAST_SOURCE_PASSWORD

## 11. How to Deploy

```bash
# On VPS (Ubuntu 22.04)
git clone <repo> /opt/radio
cd /opt/radio
cp .env.example .env
# Fill in all .env values
./scripts/setup-vps.sh          # installs Docker, Certbot, configures firewall
./scripts/init-ssl.sh           # gets Let's Encrypt cert
docker compose -f docker-compose.prod.yml up -d
```

**Env vars required for production:**
- `DOMAIN` — your domain name
- `ICECAST_SOURCE_PASSWORD` — DJ source password
- `ICECAST_ADMIN_PASSWORD` — admin password (internal only)
- `ICECAST_RELAY_PASSWORD` — relay password
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- `API_SECRET` — internal API signing key

## 12. Cross-Chat Handoff Protocol

Every sprint chat MUST do these before finishing:

1. Write `docs/sprint-N/done.md` — what was built, what's not done, files changed, manual setup required
2. Update `PROJECT_BRIEF.md` Section 7 (mark sprint done) + Section 8 (rewrite current state)
3. Commit with: `sprint-N: <summary>`

**This is how context survives across chats. The repo is the shared memory.**

**Cold-start prompt for any agent:**
```
Read PROJECT_BRIEF.md and docs/sprint-N/progress.md.
Continue from where it left off. Take your time, do it right.
```

## 13. Bug & Fix Tracking

Bugs tracked as **GitHub Issues** — single source of truth for all teams.

- **QA (Ivy):** File bugs with labels `bug` + `severity:blocker/major/minor`. Include: component, steps to reproduce, expected vs actual.
- **Dev team:** Check issues before starting. Close with: `fix: description (Fixes #NN)`
- **DevOps:** Infrastructure issues get label `infra`
- **Feature ideas:** Add to `docs/ideas-backlog.md`

**Severity definitions:**
- `blocker` — stream is down or unusable
- `major` — feature broken but workaround exists
- `minor` — cosmetic or non-critical

## 14. Multi-Repo Setup

Each team works in their **own separate clone**:

```bash
git clone <repo> radio-dev       # Dev team (Nova, Sage, Milo, Kira)
git clone <repo> radio-qa        # QA (Ivy)
git clone <repo> radio-producer  # Producer Remy (stays on main)
```

**Branch strategy:**
- `main` — stable, always deployable
- `feature/sprint-N` — dev team sprint branch
- `feature/qa-N` — QA branch
- Regular merge only — **never rebase, never squash, never force push**
- **Never push directly to main** — always PR → review → merge
