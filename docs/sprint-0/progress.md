# Sprint 0 — Progress Tracker

> **If context overflows**, start a new chat with:
> "Read PROJECT_BRIEF.md and docs/sprint-0/progress.md. Continue from where it left off. Take your time, do it right."

## Task Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Project scaffold | ✅ Done | Directories: api/, web/, config/, scripts/, assets/playlist/, tests/ |
| 2 | Docker Compose (dev) | ✅ Done | docker-compose.yml — Icecast2, Liquidsoap, Nginx, API, Web |
| 3 | Icecast2 config | ✅ Done | config/icecast.xml — /live + /fallback mounts, CORS, env var substitution |
| 4 | Liquidsoap script | ✅ Done | config/radio.liq — playlist, crossfade, FFmpeg recording, metadata |
| 5 | Nginx config (dev) | ✅ Done | config/nginx.conf — rate limiting, stream proxy, SPA fallback |
| 6 | `.env.example` | ✅ Done | Already existed and complete |
| 7 | VPS setup script | ✅ Done | scripts/setup-vps.sh — Docker, ufw, fail2ban, iptables |
| 8 | SSL init script | ✅ Done | scripts/init-ssl.sh — Certbot, SSL nginx config, renewal cron |
| 9 | `docker-compose.prod.yml` | ✅ Done | Production compose — restart:always, resource limits, no host port 8000 |
| 10 | Node.js API scaffold | 🔨 In Progress | |
| 11 | React app scaffold | 🔨 In Progress | |
| 12 | Basic player CSS | 🔨 In Progress | |
| 13 | `README.md` | ⬜ Not started | |
| 14 | Smoke test | ⬜ Not started | |

## Bugs Found

| # | Description | Severity | Status | Fix |
|---|-------------|----------|--------|-----|
| — | None yet | — | — | — |

## Notes

[Free-form notes about decisions, issues, or context for recovery]

- **Icecast source password:** stored in `.env` as `ICECAST_SOURCE_PASSWORD`
- **Liquidsoap fallback:** reads from `assets/playlist/*.mp3` — add at least 3 MP3s before first run
- **VPS minimum:** Ubuntu 22.04 LTS, 2GB RAM, 20GB disk
- **Domain:** configure your domain DNS A record → VPS IP before running `init-ssl.sh`
- **Phase 1+2 complete:** Config files, Docker stacks, VPS scripts all committed
- **Icecast image:** using `ghcr.io/ushnisha/icecast2:latest` which supports env var substitution in icecast.xml
- **Liquidsoap 2.3.0:** uses new syntax (`settings.*`, `fun(...) ->`, etc.) — confirmed compatible
- **iptables firewall:** setup-vps.sh adds DOCKER-USER chain rules to block port 8000 externally (Docker bypasses ufw for mapped ports)
