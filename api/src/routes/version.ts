import type { FastifyInstance } from 'fastify'

const VERSION = '0.1.0'

export async function versionRoute(app: FastifyInstance) {
  app.get('/version', async () => ({
    version: VERSION,
    node: process.version,
    env: process.env.NODE_ENV ?? 'development',
    built: new Date().toISOString(),
  }))
}
