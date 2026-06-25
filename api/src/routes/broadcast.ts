import type { FastifyInstance } from 'fastify'
import { request as httpRequest } from 'http'

const ICECAST_HOST = process.env.ICECAST_HOSTNAME ?? 'icecast'
const ICECAST_PORT = Number(process.env.ICECAST_PORT ?? 8000)
const ICECAST_PASS = process.env.ICECAST_SOURCE_PASSWORD ?? ''
const API_SECRET   = process.env.API_SECRET ?? ''

export async function broadcastRoute(app: FastifyInstance) {
  app.get('/broadcast', { websocket: true }, (connection, request) => {
    const ws    = connection.socket
    const token = (request.query as Record<string, string>).token ?? ''

    if (!API_SECRET || token !== API_SECRET) {
      app.log.warn('Broadcast rejected: invalid token')
      ws.close(4401, 'Unauthorized')
      return
    }

    app.log.info('Browser DJ connected to broadcast relay')

    // Open an HTTP connection to Icecast as a source client
    const iceReq = httpRequest({
      hostname: ICECAST_HOST,
      port:     ICECAST_PORT,
      path:     '/live',
      method:   'SOURCE',
      headers:  {
        'Authorization':  'Basic ' + Buffer.from(`source:${ICECAST_PASS}`).toString('base64'),
        'Content-Type':   'audio/webm',
        'ice-name':       'Browser DJ',
        'ice-genre':      'Live',
        'ice-public':     '1',
        'Expect':         '',
      },
    })

    iceReq.on('error', (err) => {
      app.log.error('Icecast source error: ' + err.message)
      ws.close(1011, 'Icecast connection failed')
    })

    iceReq.on('response', (res) => {
      if (res.statusCode !== 200) {
        app.log.error(`Icecast rejected source: ${res.statusCode}`)
        ws.close(1011, `Icecast rejected: ${res.statusCode}`)
      }
    })

    // Pipe WebSocket audio chunks → Icecast
    ws.on('message', (chunk: Buffer) => {
      iceReq.write(chunk)
    })

    ws.on('close', () => {
      app.log.info('Browser DJ disconnected')
      iceReq.end()
    })

    ws.on('error', (err: Error) => {
      app.log.error('WS error: ' + err.message)
      iceReq.end()
    })
  })
}
