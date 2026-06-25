import type { FastifyInstance } from 'fastify'
import { getLatestSnapshot } from '../services/healthMonitor.js'

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    reply.header('Cache-Control', 'no-cache')

    const snapshot = getLatestSnapshot()

    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'vps-radio-api',
      version: '0.1.0',
      stream: snapshot
        ? {
            status: snapshot.stream.up ? 'up' : 'down',
            mount: snapshot.stream.mount,
            listeners: snapshot.stream.listeners,
            live: snapshot.stream.live,
          }
        : { status: 'unknown' },
      disk: snapshot
        ? {
            path: snapshot.disk.path,
            usedPct: `${snapshot.disk.usedPct}%`,
            freeGb: snapshot.disk.freeGb,
            totalGb: snapshot.disk.totalGb,
          }
        : { status: 'unknown' },
      checkedAt: snapshot?.checkedAt ?? null,
    }
  })
}

