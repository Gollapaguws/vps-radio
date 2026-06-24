import type { FastifyInstance } from 'fastify'
import { XMLParser } from 'fast-xml-parser'

const ICECAST_HOST = process.env.ICECAST_HOSTNAME ?? 'localhost'
const ICECAST_PORT = process.env.ICECAST_PORT ?? '8000'
const ICECAST_ADMIN_USER = process.env.ICECAST_ADMIN_USER ?? 'admin'
const ICECAST_ADMIN_PASS = process.env.ICECAST_ADMIN_PASSWORD ?? ''

const xmlParser = new XMLParser({ ignoreAttributes: false })

interface IcecastSource {
  '@_mount'?: string
  title?: string
  artist?: string
  bitrate?: number
  format?: string
  listeners?: number
  stream_start?: string
  server_name?: string
  server_description?: string
}

interface NowPlayingResponse {
  live: boolean
  mount: string
  title: string
  artist: string
  listeners: number
  bitrate: number
  format: string
  stream_start: string | null
  fallback: boolean
  timestamp: string
}

async function fetchIcecastStats(): Promise<IcecastSource[]> {
  const url = `http://${ICECAST_HOST}:${ICECAST_PORT}/admin/stats`
  const credentials = Buffer.from(`${ICECAST_ADMIN_USER}:${ICECAST_ADMIN_PASS}`).toString('base64')

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${credentials}` },
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) {
    throw new Error(`Icecast stats HTTP ${res.status}`)
  }

  const xml = await res.text()
  const parsed = xmlParser.parse(xml)
  const sources = parsed?.icestats?.source

  if (!sources) return []
  return Array.isArray(sources) ? sources : [sources]
}

function buildResponse(sources: IcecastSource[]): NowPlayingResponse {
  // Prefer /live mount, fall back to /fallback
  const live = sources.find((s) => s['@_mount'] === '/live')
  const fallback = sources.find((s) => s['@_mount'] === '/fallback')
  const active = live ?? fallback

  if (!active) {
    return {
      live: false,
      mount: '',
      title: 'No stream active',
      artist: '',
      listeners: 0,
      bitrate: 0,
      format: '',
      stream_start: null,
      fallback: false,
      timestamp: new Date().toISOString(),
    }
  }

  return {
    live: !!live,
    mount: active['@_mount'] ?? '',
    title: active.title ?? active.server_name ?? 'VPS Radio',
    artist: active.artist ?? '',
    listeners: Number(active.listeners ?? 0),
    bitrate: Number(active.bitrate ?? 0),
    format: active.format ?? '',
    stream_start: active.stream_start ?? null,
    fallback: !live && !!fallback,
    timestamp: new Date().toISOString(),
  }
}

export async function nowPlayingRoute(app: FastifyInstance) {
  app.get('/now-playing', async (request, reply) => {
    reply.header('Cache-Control', 'public, max-age=10')

    try {
      const sources = await fetchIcecastStats()
      return buildResponse(sources)
    } catch (err) {
      app.log.warn({ err }, 'Failed to fetch Icecast stats')
      return reply.code(503).send({
        live: false,
        error: 'Stream server unreachable',
        timestamp: new Date().toISOString(),
      })
    }
  })
}
