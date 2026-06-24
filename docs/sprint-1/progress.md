# Sprint 1 — Progress Tracker

> **If context overflows**, start a new chat with:
> "Read PROJECT_BRIEF.md and docs/sprint-1/progress.md. Continue from where it left off. Take your time, do it right."

## Task Status

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Fallback playlist content | ⬜ Not started | |
| 2 | End-to-end stream smoke test | ⬜ Not started | |
| 3 | Now-playing API (real data) | ⬜ Not started | |
| 4 | Stream health monitor service | ⬜ Not started | |
| 5 | Telegram alert integration | ⬜ Not started | |
| 6 | Disk space monitor | ⬜ Not started | |
| 7 | Cloudflare R2 archiver service | ⬜ Not started | |
| 8 | RSS podcast feed endpoint | ⬜ Not started | |
| 9 | Recording trigger via Liquidsoap | ⬜ Not started | |
| 10 | Web player — now-playing display | ⬜ Not started | |
| 11 | Web player — waveform visualizer | ⬜ Not started | |
| 12 | Web player — VU meter | ⬜ Not started | |
| 13 | Embeddable player widget | ⬜ Not started | |
| 14 | Station branding + dark theme | ⬜ Not started | |
| 15 | Show schedule placeholder page | ⬜ Not started | |
| 16 | E2E tests (Playwright) | ⬜ Not started | |
| 17 | Update progress.md + done.md | ⬜ Not started | |

## Bugs Found

| # | Description | Severity | Status | Fix |
|---|-------------|----------|--------|-----|
| — | None yet | — | — | — |

## Notes

- **R2 setup:** ensure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` are set in `.env`
- **Telegram setup:** create bot via @BotFather, get `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`
- **Royalty-free music:** use [Free Music Archive](https://freemusicarchive.org) or [ccMixter](http://ccmixter.org) for fallback playlist MP3s
- **Liquidsoap recording:** files land in `recordings/` volume — ensure Docker volume is mounted
