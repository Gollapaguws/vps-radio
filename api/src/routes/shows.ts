import type { FastifyInstance } from 'fastify'

// Shows route — Sprint 1 will implement full show logging with SQLite.
// For now returns a placeholder that confirms the endpoint exists.
export async function showsRoute(app: FastifyInstance) {
  app.get('/shows', async () => ({
    shows: [],
    message: 'Show history coming in Sprint 1',
    timestamp: new Date().toISOString(),
  }))
}
