import type { FastifyInstance } from 'fastify'
import { getDb, type Show } from '../db/database.js'

export async function showsRoute(app: FastifyInstance) {
  app.get('/shows', async (request, reply) => {
    reply.header('Cache-Control', 'public, max-age=30')
    let shows: Show[] = []
    try {
      const db = getDb()
      shows = db
        .prepare('SELECT * FROM shows ORDER BY started_at DESC LIMIT 50')
        .all() as Show[]
    } catch (err) {
      app.log.warn({ err }, 'SQLite not available yet')
    }
    return {
      shows,
      count: shows.length,
      timestamp: new Date().toISOString(),
    }
  })
}

