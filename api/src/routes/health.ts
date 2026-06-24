import type { FastifyInstance } from 'fastify'

export async function healthRoute(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    reply.header('Cache-Control', 'no-cache')
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'vps-radio-api',
      version: '0.1.0',
    }
  })
}
