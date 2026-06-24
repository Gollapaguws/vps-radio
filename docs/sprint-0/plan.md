# Sprint 0 — Infrastructure

> **Sprint Goal:** Get the full infrastructure stack running on the VPS — Docker, Icecast2, Liquidsoap, Nginx, SSL, and a working test stream end-to-end.
> **Branch:** `feature/sprint-0`
> **Estimated effort:** 4–6 hours
> **Agents:** Sage (lead), Nova (player scaffold), Milo (basic CSS scaffold)

## Prioritized Task List

| # | Task | Owner | Est | Description |
|---|------|-------|-----|-------------|
| 1 | Project scaffold | Sage | 30m | Create repo structure: `/api`, `/web`, `/config`, `/scripts`, `/assets/playlist`, `/docs`, `/tests` |
| 2 | Docker Compose (dev) | Sage | 45m | `docker-compose.yml` with Icecast2, Liquidsoap, Nginx, Node.js API, React dev server |
| 3 | Icecast2 config | Sage | 30m | `config/icecast.xml` — mount points `/live` + `/fallback`, listener limits, admin, CORS |
| 4 | Liquidsoap script | Sage | 45m | `config/radio.liq` — fallback playlist from `assets/playlist/`, source input override, smooth transitions, FFmpeg recording to `/recordings` |
| 5 | Nginx config (dev) | Sage | 30m | `config/nginx.conf` — proxy `/stream` → Icecast, `/api` → Node, `/` → React |
| 6 | `.env.example` | Sage | 15m | All required env vars documented with safe defaults |
| 7 | VPS setup script | Sage | 30m | `scripts/setup-vps.sh` — installs Docker CE, ufw firewall rules (22, 80, 443 only), fail2ban |
| 8 | SSL init script | Sage | 20m | `scripts/init-ssl.sh` — Certbot standalone cert, Nginx SSL config, auto-renewal cron |
| 9 | `docker-compose.prod.yml` | Sage | 30m | Production compose with restart policies, volume mounts, resource limits |
| 10 | Node.js API scaffold | Sage | 30m | Fastify app with `/health`, `/now-playing` (reads Icecast XML stats), `/version` |
| 11 | React app scaffold | Nova | 30m | Vite + React + TypeScript scaffold, basic `<Player>` component, connects to stream URL |
| 12 | Basic player CSS | Milo | 30m | Dark mode base, CSS variables for theming, player shell styled |
| 13 | `README.md` | Sage | 20m | Quick start, env var reference, how to connect BUTT |
| 14 | Smoke test | Ivy | 20m | Manual: start Docker stack → connect BUTT → confirm stream plays → confirm health endpoint → confirm fallback playlist |

## Work Schedule

### Phase 1: Core Stack (tasks 1–6)
- Scaffold the repo and all config files
- Docker Compose with all services wired together
- Icecast + Liquidsoap talking to each other
- **Checkpoint commit:** `sprint-0: core docker stack`

### Phase 2: VPS Deployment (tasks 7–9)
- Setup and SSL scripts
- Production compose file
- **Checkpoint commit:** `sprint-0: vps deployment scripts`

### Phase 3: API + Frontend Scaffold (tasks 10–12)
- Working `/health` and `/now-playing` endpoints
- React player connects to stream and plays audio
- **Checkpoint commit:** `sprint-0: api and player scaffold`

### Phase 4: Docs + Smoke Test (tasks 13–14)
- README complete
- Manual smoke test passes
- **Final commit:** `sprint-0: complete — infrastructure ready`

## Success Criteria

- [ ] `docker compose up` starts all services with no errors
- [ ] BUTT can connect to `localhost:8000/live` and stream audio
- [ ] Fallback playlist plays when no source is connected
- [ ] `http://localhost:3000` shows web player and audio plays
- [ ] `http://localhost:4000/health` returns `{"status":"ok"}`
- [ ] `http://localhost:4000/now-playing` returns current track metadata
- [ ] `scripts/setup-vps.sh` runs without errors on fresh Ubuntu 22.04
- [ ] SSL cert obtained and Nginx serves HTTPS on production domain
- [ ] Icecast admin port (8000) is NOT accessible externally (firewall check)
- [ ] `docs/sprint-0/done.md` written and committed
- [ ] `PROJECT_BRIEF.md` sections 7+8 updated

## What's NOT in This Sprint

| Feature | Reason |
|---------|--------|
| Web dashboard | Sprint 3 — core must work first |
| Podcast archiver (R2) | Sprint 1 |
| Telegram alerts | Sprint 1 |
| Browser-based DJ tool | Sprint 2 |
| Listener stats | Sprint 2 |
| Show scheduling | Sprint 3 |

## Agent Prompt (copy this to start Sprint 0)

```
Read PROJECT_BRIEF.md, then read docs/sprint-0/plan.md. Execute Sprint 0.

You are the dev team: Sage (backend/infra lead), Nova (frontend scaffold), Milo (CSS scaffold).
Take your time, do it right.

First:
  git pull origin main
  git checkout -b feature/sprint-0

Work through each task in order. After each phase, make a checkpoint commit.
Update docs/sprint-0/progress.md after each phase.

Close tasks with: git commit -m "sprint-0: <description>"

When done:
  Write docs/sprint-0/done.md
  Update PROJECT_BRIEF.md sections 7 and 8
  git push origin feature/sprint-0
  gh pr create --title "Sprint 0: Infrastructure" --body "Closes sprint 0. See docs/sprint-0/done.md"
  Follow Sections 12-14 of PROJECT_BRIEF.md.
```
