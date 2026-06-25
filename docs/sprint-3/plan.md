# Sprint 3 — Dashboard & Management

> **Branch:** `feature/sprint-3`
> **Goal:** Admin dashboard, song requests, schedule CRUD, production API build, CI/CD.

## Prerequisites

- Sprint 2 merged to `main` ✅
- VPS running at https://lekkerkuier.com ✅

## Tasks

### Phase 1: Production API Build

| # | Task | Owner |
|---|------|-------|
| 1 | Switch API Dockerfile to tsc build (fixes WebSocket volume issue) | Sage |
| 2 | Remove `./api:/app` bind-mount in docker-compose (bake code in image) | Sage |

### Phase 2: Admin Auth

| # | Task | Owner |
|---|------|-------|
| 3 | `POST /admin/login` — check ADMIN_PASSWORD, return JWT | Sage |
| 4 | Admin JWT middleware for protected routes | Sage |

### Phase 3: Song Requests

| # | Task | Owner |
|---|------|-------|
| 5 | Add `song_requests` table to SQLite | Sage |
| 6 | `POST /requests` (public), `GET /requests` + `DELETE /requests/:id` (admin) | Sage |
| 7 | Song request widget on player page | Nova/Milo |

### Phase 4: Schedule CRUD

| # | Task | Owner |
|---|------|-------|
| 8 | `POST/PUT/DELETE /schedule` with admin JWT auth | Sage |
| 9 | Enhance `/schedule` page to pull from API + show live badge | Nova |
| 10 | Schedule admin UI in `/admin` dashboard | Nova/Milo |

### Phase 5: Admin Dashboard

| # | Task | Owner |
|---|------|-------|
| 11 | `/admin` login page + protected dashboard | Nova/Milo |
| 12 | Stats summary + show log panel | Nova |
| 13 | Pending song requests panel | Nova |

### Phase 6: Infra Polish

| # | Task | Owner |
|---|------|-------|
| 14 | Enhance now-playing: include live show context when DJ is on air | Sage |
| 15 | Nginx WebSocket proxy headers for `/broadcast` | Sage |
| 16 | Rate-limit `/requests` (5/min/IP) | Sage |
| 17 | GitHub Actions CI workflow | Sage/Dash |
| 18 | Cert auto-renewal cron on VPS | Dash |

## Success Criteria

- [ ] API runs as compiled `node dist/index.js` — no more tsx hot-reload in prod
- [ ] `/admin` login works with ADMIN_PASSWORD env var
- [ ] Song request form on player page → stored in SQLite → visible in admin
- [ ] Schedule CRUD works end-to-end from admin UI
- [ ] `/schedule` page shows dynamic data + live badge
- [ ] CI pipeline runs on every PR
- [ ] Cert renewal cron installed on VPS
- [ ] PR merged to `main`
