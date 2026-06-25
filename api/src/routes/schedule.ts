import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/database.js'
import { requireAdmin } from './admin.js'

type ScheduleRow = {
  id: number
  day: string
  time_start: string
  time_end: string
  host: string
  show_name: string
  genre: string | null
  recurring: number
  created_at: number
}

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

export async function scheduleApiRoute(app: FastifyInstance) {
  // GET /schedule — public (dynamic from DB + static fallback)
  app.get('/schedule', async (request, reply) => {
    reply.header('Cache-Control', 'public, max-age=60')
    const db = getDb()
    const rows = db.prepare(`
      SELECT * FROM schedule ORDER BY created_at ASC
    `).all() as ScheduleRow[]

    // Sort by day of week, then by time
    rows.sort((a, b) => {
      const di = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
      if (di !== 0) return di
      return a.time_start.localeCompare(b.time_start)
    })

    // Check if a DJ is live right now
    const liveShow = db.prepare(`SELECT mount FROM live_shows WHERE active = 1 LIMIT 1`).get() as { mount: string } | undefined

    reply.send({ schedule: rows, live: !!liveShow, liveMount: liveShow?.mount ?? null })
  })

  // POST /schedule — admin only
  app.post('/schedule', async (request, reply) => {
    if (!requireAdmin(request, reply)) return

    const { day, time_start, time_end, host, show_name, genre, recurring = 1 } =
      request.body as { day: string; time_start: string; time_end: string; host: string; show_name: string; genre?: string; recurring?: number }

    if (!day || !time_start || !time_end || !host || !show_name) {
      return reply.code(400).send({ error: 'day, time_start, time_end, host, show_name are required' })
    }

    const db = getDb()
    const row = db.prepare(`
      INSERT INTO schedule (day, time_start, time_end, host, show_name, genre, recurring, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(day, time_start, time_end, host.slice(0, 80), show_name.slice(0, 120), genre ?? null, recurring, Date.now())

    reply.code(201).send({ id: row.lastInsertRowid, ok: true })
  })

  // PUT /schedule/:id — admin only
  app.put('/schedule/:id', async (request, reply) => {
    if (!requireAdmin(request, reply)) return

    const { id } = request.params as { id: string }
    const { day, time_start, time_end, host, show_name, genre, recurring } =
      request.body as Partial<{ day: string; time_start: string; time_end: string; host: string; show_name: string; genre: string; recurring: number }>

    const db = getDb()
    const existing = db.prepare(`SELECT * FROM schedule WHERE id = ?`).get(Number(id)) as ScheduleRow | undefined
    if (!existing) return reply.code(404).send({ error: 'Not found' })

    db.prepare(`
      UPDATE schedule SET
        day = ?, time_start = ?, time_end = ?, host = ?,
        show_name = ?, genre = ?, recurring = ?
      WHERE id = ?
    `).run(
      day ?? existing.day,
      time_start ?? existing.time_start,
      time_end ?? existing.time_end,
      (host ?? existing.host).slice(0, 80),
      (show_name ?? existing.show_name).slice(0, 120),
      genre !== undefined ? genre : existing.genre,
      recurring !== undefined ? recurring : existing.recurring,
      Number(id),
    )

    reply.send({ ok: true })
  })

  // DELETE /schedule/:id — admin only
  app.delete('/schedule/:id', async (request, reply) => {
    if (!requireAdmin(request, reply)) return
    const { id } = request.params as { id: string }
    const db = getDb()
    db.prepare(`DELETE FROM schedule WHERE id = ?`).run(Number(id))
    reply.code(204).send()
  })
}
