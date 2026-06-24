# VPS Radio 🎙️

> Self-hosted internet radio server and live broadcaster — Icecast2 + Liquidsoap + React player

## Quick Start (Local Dev)

```bash
git clone https://github.com/Gollapaguws/vps-radio
cd vps-radio
cp .env.example .env
# Edit .env with your values
docker compose up -d
```

- **Web Player:** http://localhost:3000
- **API:** http://localhost:4000/health
- **Icecast Admin:** http://localhost:8000/admin *(never expose externally)*

## Connect a DJ Source (BUTT)

1. Download [BUTT](https://danielnoethen.de/butt/)
2. Server: `localhost` | Port: `8000` | Mount: `/live`
3. Password: `ICECAST_SOURCE_PASSWORD` from your `.env`

## Deploy to VPS (Ubuntu 22.04)

```bash
git clone https://github.com/Gollapaguws/vps-radio /opt/radio
cd /opt/radio
cp .env.example .env
# Fill in all values including DOMAIN
./scripts/setup-vps.sh
./scripts/init-ssl.sh
docker compose -f docker-compose.prod.yml up -d
```

## Stack

| Layer | Tech |
|-------|------|
| Stream server | Icecast2 |
| Playlist engine | Liquidsoap |
| Backend API | Node.js 20 + Fastify |
| Frontend | React 18 + Vite |
| Proxy + SSL | Nginx + Let's Encrypt |
| Archive | Cloudflare R2 |
| Containers | Docker + Docker Compose |

## Sprint Status

See [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) for full team docs and sprint plan.

| Sprint | Status |
|--------|--------|
| 0 — Infrastructure | 🔨 In Progress |
| 1 — Core Radio | ⬜ Planned |
| 2 — Polish & Launch | ⬜ Planned |
| 3 — Dashboard | ⬜ Planned |
