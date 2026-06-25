import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/database.js'
import { sendTelegram } from '../services/telegram.js'

const API_SECRET = process.env.API_SECRET ?? ''

export async function icecastEventsRoute(app: FastifyInstance) {
  // Icecast sends these via <on-connect> / <on-disconnect> in icecast.xml
  // POST body: { mount: string, secret: string }

  app.post('/icecast/connect', async (request, reply) => {
    const { mount, ip, secret } = request.body as { mount?: string; ip?: string; secret?: string }
    if (API_SECRET && secret !== API_SECRET) return reply.code(401).send({ error: 'unauthorized' })
    if (!mount) return reply.code(400).send({ error: 'mount required' })

    const db = getDb()
    const now = Date.now()
    db.prepare(`
      INSERT INTO live_shows (mount, client_ip, started_at, active)
      VALUES (?, ?, ?, 1)
    `).run(mount, ip ?? 'icecast', now)

    app.log.info(`DJ connected: mount=${mount}`)
    await sendTelegram(`🎙️ DJ ON AIR\nMount: \`${mount}\``)

    reply.code(204).send()
  })

  app.post('/icecast/disconnect', async (request, reply) => {
    const { mount, secret } = request.body as { mount?: string; secret?: string }
    if (API_SECRET && secret !== API_SECRET) return reply.code(401).send({ error: 'unauthorized' })
    if (!mount) return reply.code(400).send({ error: 'mount required' })

    const db = getDb()
    const now = Date.now()
    const show = db.prepare(`
      SELECT * FROM live_shows WHERE mount = ? AND active = 1 ORDER BY started_at DESC LIMIT 1
    `).get(mount) as { id: number; started_at: number } | undefined

    if (show) {
      const duration = Math.floor((now - show.started_at) / 1000)
      db.prepare(`
        UPDATE live_shows SET ended_at = ?, duration_s = ?, active = 0 WHERE id = ?
      `).run(now, duration, show.id)

      const mins = Math.floor(duration / 60)
      app.log.info(`DJ disconnected: mount=${mount} duration=${mins}min`)
      await sendTelegram(`📴 DJ OFF AIR\nMount: \`${mount}\`\nDuration: ${mins} min`)
    }

    reply.code(204).send()
  })
}
