# VPS Radio 🎙️

> Self-hosted internet radio server and live broadcaster — Icecast2 + Liquidsoap + React player

## Quick Start (Local Dev)

```bash
git clone https://github.com/Gollapaguws/vps-radio
cd vps-radio
cp .env.example .env
# Edit .env — at minimum set the passwords (see table below)

# Seed fallback playlist (need ≥ 3 MP3 files)
cp /path/to/your/music/*.mp3 assets/playlist/

docker compose up -d
```

| Service | URL |
|---------|-----|
| Web Player | http://localhost:3000 |
| API health | http://localhost:4000/health |
| API now-playing | http://localhost:4000/now-playing |
| Icecast Admin | http://localhost:8000/admin *(never expose externally)* |

## Connect a DJ Source

### BUTT (recommended for testing)
1. Download [BUTT](https://danielnoethen.de/butt/)
2. Add server: Host `localhost` · Port `8000` · Mount `/live`
3. Password: value of `ICECAST_SOURCE_PASSWORD` from your `.env`
4. Hit "Play" — you'll take over the stream from the fallback playlist

### Mixxx / Darkice
- Same credentials: host `localhost`, port `8000`, mount `/live`, password from `.env`

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `DOMAIN` | Prod only | Your domain name (e.g. `radio.example.com`) |
| `ICECAST_SOURCE_PASSWORD` | ✅ | Password DJs use to connect |
| `ICECAST_ADMIN_PASSWORD` | ✅ | Icecast admin web UI password |
| `ICECAST_RELAY_PASSWORD` | ✅ | Icecast relay password |
| `ICECAST_ADMIN_USER` | ✅ | Icecast admin username (default `admin`) |
| `STATION_NAME` | ✅ | Station name shown in metadata |
| `STATION_DESCRIPTION` | ✅ | Station description |
| `STATION_GENRE` | ✅ | Genre tag |
| `STATION_URL` | ✅ | Station homepage URL |
| `API_SECRET` | ✅ | Secret key for API signing (any random string) |
| `R2_ACCOUNT_ID` | Sprint 1 | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | Sprint 1 | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Sprint 1 | R2 secret key |
| `R2_BUCKET` | Sprint 1 | R2 bucket name |
| `TELEGRAM_BOT_TOKEN` | Sprint 1 | Telegram bot token for alerts |
| `TELEGRAM_CHAT_ID` | Sprint 1 | Telegram chat ID for alerts |

## Deploy to VPS (Ubuntu 22.04 LTS)

```bash
# On your VPS as root
git clone https://github.com/Gollapaguws/vps-radio /opt/radio
cd /opt/radio
cp .env.example .env
nano .env  # fill in DOMAIN, passwords, etc.

# Add fallback music
mkdir -p assets/playlist
# scp your mp3s here or download from FMA

# Step 1: Install Docker, configure firewall
sudo bash scripts/setup-vps.sh

# Step 2: Get Let's Encrypt SSL cert (DNS must already point to this VPS)
sudo bash scripts/init-ssl.sh

# Step 3: Start production stack
docker compose -f docker-compose.prod.yml up -d

# Verify
curl https://your.domain.com/api/health
curl https://your.domain.com/api/now-playing
```

### Security Notes
- Port 8000 (Icecast) is **never exposed externally** — only Nginx proxies to it
- `setup-vps.sh` adds iptables rules to block port 8000 even from Docker
- All secrets in `.env` only — never commit it
- SSH: use key auth only, disable password auth

## Project Structure

```
.
├── api/                  # Node.js 20 + Fastify API
│   ├── src/
│   │   ├── index.ts      # Server bootstrap
│   │   └── routes/       # health, now-playing, version, shows
│   ├── Dockerfile        # Dev (tsx watch)
│   └── Dockerfile.prod   # Production (compiled)
├── web/                  # React 18 + Vite player
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/Player.tsx
│   │   ├── hooks/useNowPlaying.ts
│   │   └── styles/       # globals.css, player.css
│   ├── Dockerfile        # Dev (Vite HMR)
│   └── Dockerfile.prod   # Production (static build)
├── config/
│   ├── icecast.xml       # Icecast2 config
│   ├── radio.liq         # Liquidsoap script
│   └── nginx.conf        # Nginx reverse proxy
├── scripts/
│   ├── setup-vps.sh      # VPS provisioning
│   └── init-ssl.sh       # Let's Encrypt cert setup
├── assets/playlist/      # Fallback MP3s (gitignored)
├── tests/                # Playwright E2E + Vitest unit
├── docs/                 # Sprint plans, progress, done
├── docker-compose.yml          # Development stack
├── docker-compose.prod.yml     # Production stack
└── .env.example          # Environment variable template
```

## Stack

| Layer | Tech |
|-------|------|
| Stream server | Icecast2 |
| Playlist engine | Liquidsoap 2.3 |
| Backend API | Node.js 20 + Fastify |
| Frontend | React 18 + Vite + TypeScript |
| Proxy + SSL | Nginx + Let's Encrypt (Certbot) |
| Archive | Cloudflare R2 (Sprint 1) |
| Containers | Docker + Docker Compose |

## Sprint Status

See [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) for full team docs and sprint plan.

| Sprint | Status |
|--------|--------|
| 0 — Infrastructure | ✅ Done |
| 1 — Core Radio | ⬜ Planned |
| 2 — Polish & Launch | ⬜ Planned |
| 3 — Dashboard | ⬜ Planned |
