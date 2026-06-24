# VPS Internet Radio — Brainstorm Summary

> Date: 2026-06-24
> Topic: Full internet radio server and broadcaster on VPS
> Result: **Concept A (Solid Core)** selected with podcast archiver from Sprint 1

## Decision

Build on **Icecast2 + Liquidsoap** (battle-tested, 25-year track record) with a React web player, Node.js API, Docker infrastructure, and Cloudflare R2 for podcast archiving.

## Why Not the Alternatives

| Concept | Rejected Because |
|---------|-----------------|
| HLS/CDN-first | 15-30s latency kills live feel. Add as layer later. |
| Full dashboard from day 1 | 4x scope. Build core first, validate, then dashboard. |
| WebRTC browser DJ | Unreliable audio quality. BUTT/Mixxx are better for real broadcasts. |

## Key Debates & Outcomes

1. **Browser DJ dashboard** — Sage (no) vs Nova (minimal fallback). **Outcome:** BUTT as primary, minimal WebSocket relay in Sprint 2
2. **Retro vs minimal design** — Milo (retro) vs Kira (minimal). **Outcome:** Dark minimal default, VU meter stays

## Team Amendments

- **Kira's amendment (accepted):** Podcast archiver + R2 setup in Sprint 1, not Sprint 3. Trivial to add early, painful to retrofit.
- **Ivy's amendment (accepted):** Stream health monitor + Telegram alerts are Sprint 1, not optional.

## Sprint Roadmap

| Sprint | Focus |
|--------|-------|
| 0 | Infrastructure: Docker, Icecast2, Liquidsoap, Nginx, SSL |
| 1 | Core Radio: streaming, fallback, web player, health monitor, R2 archiver |
| 2 | Polish: embeddable widget, Telegram alerts, QA sign-off, launch |
| 3 | Dashboard: show scheduling, DJ management, listener requests |
