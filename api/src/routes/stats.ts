import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/database.js'

type Period = '24h' | '7d' | '30d'

export async function statsRoute(app: FastifyInstance) {
  app.get('/stats', async (request, reply) => {
    reply.header('Cache-Control', 'no-cache')

    const { period = '24h' } = request.query as { period?: Period }
    const db = getDb()

    const now = Date.now()
    const periodMs: Record<Period, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d':  7  * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }
    const since = now - (periodMs[period as Period] ?? periodMs['24h'])

    const rows = db.prepare(`
      SELECT ts, count, mount FROM listener_snapshots
      WHERE ts >= ? ORDER BY ts ASC
    `).all(since) as Array<{ ts: number; count: number; mount: string }>

    // Build chart-ready output
    const labels = rows.map(r => new Date(r.ts).toISOString())
    const data   = rows.map(r => r.count)

    // Peak listeners
    const peak = rows.length ? Math.max(...rows.map(r => r.count)) : 0

    return {
      period,
      peak,
      labels,
      datasets: [{ label: 'Listeners', data }],
    }
  })
}
