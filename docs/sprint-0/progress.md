# Sprint 0 — Progress Tracker

> **If context overflows**, start a new chat with:
> "Read PROJECT_BRIEF.md and docs/sprint-0/progress.md. Continue from where it left off. Take your time, do it right."

## Task Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Project scaffold | ⬜ Not started | |
| 2 | Docker Compose (dev) | ⬜ Not started | |
| 3 | Icecast2 config | ⬜ Not started | |
| 4 | Liquidsoap script | ⬜ Not started | |
| 5 | Nginx config (dev) | ⬜ Not started | |
| 6 | `.env.example` | ⬜ Not started | |
| 7 | VPS setup script | ⬜ Not started | |
| 8 | SSL init script | ⬜ Not started | |
| 9 | `docker-compose.prod.yml` | ⬜ Not started | |
| 10 | Node.js API scaffold | ⬜ Not started | |
| 11 | React app scaffold | ⬜ Not started | |
| 12 | Basic player CSS | ⬜ Not started | |
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
