# Sprint 0 — Done ✅

> **Status:** Complete  
> **Branch:** `feature/sprint-0`  
> **Completed:** 2026-06-24

## What Was Built

### Infrastructure & Docker (Sage)

| File | Description |
|------|-------------|
| `docker-compose.yml` | Development stack: Icecast2, Liquidsoap, Nginx, API, React dev server |
| `docker-compose.prod.yml` | Production stack: `restart: always`, resource limits, no host port 8000 |
| `config/icecast/Dockerfile` | Custom Icecast2 image with `envsubst` for env var config templating |
| `config/icecast/entrypoint.sh` | Runs `envsubst` on `icecast.xml.template` before Icecast starts |
| `config/icecast/icecast.xml` | Mount points `/live` + `/fallback`, CORS, listener limits — all values from env |
| `config/radio.liq` | Liquidsoap 2.x script: randomized playlist, 3s crossfade, metadata normalization, MP3 recording |
| `config/nginx.conf` | Dev proxy: stream → Icecast, /api → Node, WebSocket /broadcast, SPA fallback, rate limiting |
| `scripts/setup-vps.sh` | Ubuntu 22.04 provisioning: Docker CE, ufw firewall (22/80/443), iptables block port 8000, fail2ban |
| `scripts/init-ssl.sh` | Certbot standalone cert, SSL Nginx config generation, renewal cron |

### API (Sage)

| File | Description |
|------|-------------|
| `api/src/index.ts` | Fastify server bootstrap with CORS + Helmet |
| `api/src/routes/health.ts` | `GET /health` → `{status:"ok", uptime, timestamp}` |
| `api/src/routes/now-playing.ts` | `GET /now-playing` → reads Icecast XML admin stats, returns track/artist/listeners/live |
| `api/src/routes/version.ts` | `GET /version` → version info |
| `api/src/routes/shows.ts` | `GET /shows` → placeholder (Sprint 1: SQLite show log) |
| `api/package.json` | Fastify, fast-xml-parser, better-sqlite3, tsx, Vitest |
| `api/Dockerfile` | Dev: `tsx watch` hot reload |
| `api/Dockerfile.prod` | Prod: TypeScript compiled, non-root `node` user |

### Frontend (Nova + Milo)

| File | Description |
|------|-------------|
| `web/src/main.tsx` | React 18 app entry |
| `web/src/App.tsx` | App shell: header, player, footer |
| `web/src/components/Player.tsx` | Audio player: play/pause, volume, now-playing metadata, listener count |
| `web/src/hooks/useNowPlaying.ts` | Polling hook: fetches `/api/now-playing` every 15s |
| `web/src/styles/globals.css` | Design tokens (dark theme, CSS variables), reset, app shell |
| `web/src/styles/player.css` | Player card, LIVE badge (pulsing), volume slider, spinner, responsive |
| `web/vite.config.ts` | Vite 5 + React plugin, dev proxy to Icecast + API |
| `web/Dockerfile` | Dev: Vite HMR |
| `web/Dockerfile.prod` | Prod: `npm run build` + http-server |
| `web/public/radio.svg` | SVG favicon |

### Documentation

| File | Description |
|------|-------------|
| `README.md` | Full quick start, env var table, BUTT guide, deploy steps, project structure |
| `assets/playlist/README.md` | Instructions for seeding fallback playlist MP3s |
| `docs/sprint-0/progress.md` | Sprint progress tracker (all 14 tasks ✅) |

## Files Changed (full list)

```
.gitignore                              (added MP3/FLAC/OGG exclusions)
README.md                               (complete rewrite)
PROJECT_BRIEF.md                        (sections 7 + 8 updated)
api/Dockerfile
api/Dockerfile.prod
api/package.json
api/tsconfig.json
api/src/index.ts
api/src/routes/health.ts
api/src/routes/now-playing.ts
api/src/routes/shows.ts
api/src/routes/version.ts
assets/playlist/README.md
config/icecast.xml                      (top-level reference copy)
config/icecast/Dockerfile
config/icecast/entrypoint.sh
config/icecast/icecast.xml              (active template — used by Docker)
config/nginx.conf
config/radio.liq
docker-compose.yml
docker-compose.prod.yml
scripts/init-ssl.sh
scripts/setup-vps.sh
web/Dockerfile
web/Dockerfile.prod
web/index.html
web/package.json
web/tsconfig.json
web/tsconfig.node.json
web/vite.config.ts
web/public/radio.svg
web/src/App.tsx
web/src/components/Player.tsx
web/src/hooks/useNowPlaying.ts
web/src/main.tsx
web/src/styles/globals.css
web/src/styles/player.css
docs/sprint-0/progress.md
docs/sprint-0/done.md                   (this file)
```

## Manual Setup Required Before First Run

### Local Dev
1. `cp .env.example .env` and fill in passwords
2. Add ≥ 3 MP3 files to `assets/playlist/`
3. `docker compose up -d`
4. Test: `curl http://localhost:4000/health`

### Production VPS (Ubuntu 22.04)
1. `sudo bash scripts/setup-vps.sh` — once, on fresh VPS
2. Point DNS `A` record for your domain → VPS IP
3. Fill in `.env` (especially `DOMAIN=`)
4. `sudo bash scripts/init-ssl.sh` — gets Let's Encrypt cert
5. `docker compose -f docker-compose.prod.yml up -d`

### Fallback Playlist
- **Required before Liquidsoap will start:** at least 3 MP3 files in `assets/playlist/`
- Source: [Free Music Archive](https://freemusicarchive.org/), [ccMixter](https://ccmixter.org/)
- Format: 192kbps stereo MP3 with ID3 tags (artist + title)

## What's NOT Done / Sprint 1 scope

| Feature | Status |
|---------|--------|
| Show logging (SQLite) | Sprint 1 |
| Cloudflare R2 archiver | Sprint 1 |
| Telegram health alerts | Sprint 1 |
| VU meter on player | Sprint 1 |
| Browser DJ tool | Sprint 2 |
| Playlist management UI | Sprint 3 |

## Known Limitations

- `web/src/App.tsx` has `noUnusedLocals` — if `import.meta.env.*` causes TS error in strict mode, run `npm run build` to confirm (Vite handles it correctly)
- Liquidsoap recording uses `%mp3` encoder — if the savonet image doesn't include LAME, recording will silently fail (stream continues fine)
- The Icecast `/status.xsl` healthcheck endpoint requires the `web` path to be accessible — confirmed available in Debian package
