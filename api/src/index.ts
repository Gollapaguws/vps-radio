import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import websocket from '@fastify/websocket'

import { healthRoute } from './routes/health.js'
import { nowPlayingRoute } from './routes/now-playing.js'
import { versionRoute } from './routes/version.js'
import { showsRoute } from './routes/shows.js'
import { podcastRoute } from './routes/podcast.js'
import { statsRoute } from './routes/stats.js'
import { icecastEventsRoute } from './routes/icecast-events.js'
import { broadcastRoute } from './routes/broadcast.js'
import { startHealthMonitor } from './services/healthMonitor.js'
import { startArchiver } from './services/archiver.js'

const PORT = Number(process.env.API_PORT ?? 4000)
const HOST = '0.0.0.0'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

// ── Security headers ────────────────────────────────────────────────────────
await app.register(helmet, { contentSecurityPolicy: false })

// ── CORS — allow the web player origin ────────────────────────────────────
await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
})

// ── WebSocket support ───────────────────────────────────────────────────────
await app.register(websocket)

// ── Routes ─────────────────────────────────────────────────────────────────
await app.register(healthRoute)
await app.register(nowPlayingRoute)
await app.register(versionRoute)
await app.register(showsRoute)
await app.register(podcastRoute)
await app.register(statsRoute)
await app.register(icecastEventsRoute)
await app.register(broadcastRoute)

// ── Root ───────────────────────────────────────────────────────────────────
app.get('/', async () => ({
  service: 'vps-radio-api',
  version: '0.2.0',
  docs: '/health, /now-playing, /version, /shows, /podcast/feed.xml',
}))

// ── Start ──────────────────────────────────────────────────────────────────
try {
  await app.listen({ port: PORT, host: HOST })
  app.log.info(`API listening on ${HOST}:${PORT}`)

  // Start background services after server is up
  startHealthMonitor({
    warn: (msg) => app.log.warn(msg),
    info: (msg) => app.log.info(msg),
  })
  startArchiver()
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

