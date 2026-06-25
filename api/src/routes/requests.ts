import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/database.js'
import { requireAdmin } from './admin.js'

type RequestRow = {
  id: number
  requester: string
  song: string
  status: string
  created_at: number
}

export async function requestsRoute(app: FastifyInstance) {
  // POST /requests — any listener can submit (rate-limited: 5/min per IP)
  app.post('/requests', {
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  }, async (request, reply) => {
    const { requester = 'Anonymous', song } = request.body as { requester?: string; song?: string }
    if (!song?.trim()) return reply.code(400).send({ error: 'song is required' })

    const db = getDb()
    const row = db.prepare(`
      INSERT INTO song_requests (requester, song, status, created_at)
      VALUES (?, ?, 'pending', ?)
    `).run(requester.trim().slice(0, 80), song.trim().slice(0, 200), Date.now())

    reply.code(201).send({ id: row.lastInsertRowid, ok: true })
  })

  // GET /requests — admin only
  app.get('/requests', async (request, reply) => {
    if (!requireAdmin(request, reply)) return

    const { status = 'pending' } = request.query as { status?: string }
    const db = getDb()
    const rows = db.prepare(`
      SELECT * FROM song_requests WHERE status = ? ORDER BY created_at DESC LIMIT 100
    `).all(status) as RequestRow[]

    reply.send({ requests: rows })
  })

  // DELETE /requests/:id — mark fulfilled (admin only)
  app.delete('/requests/:id', async (request, reply) => {
    if (!requireAdmin(request, reply)) return

    const { id } = request.params as { id: string }
    const db = getDb()
    db.prepare(`UPDATE song_requests SET status = 'fulfilled' WHERE id = ?`).run(Number(id))
    reply.code(204).send()
  })
}
