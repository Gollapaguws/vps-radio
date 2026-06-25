// podcast.ts — RSS 2.0 + iTunes podcast feed from SQLite show log
// GET /podcast/feed.xml

import type { FastifyInstance } from 'fastify'
import { getDb, type Show } from '../db/database.js'

const STATION_NAME = process.env.STATION_NAME ?? 'VPS Radio'
const STATION_DESC = process.env.STATION_DESCRIPTION ?? 'Live internet radio shows'
const STATION_URL  = process.env.STATION_URL ?? 'https://radio.yourdomain.com'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ''

function formatRFC822(dateStr: string): string {
  try {
    return new Date(dateStr).toUTCString()
  } catch {
    return new Date().toUTCString()
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

function buildFeed(shows: Show[]): string {
  const feedUrl = `${STATION_URL}/podcast/feed.xml`

  const items = shows
    .filter((s) => s.r2_url && s.published)
    .map((s) => {
      const enclosureUrl = s.r2_url!
      const guid = `${STATION_URL}/shows/${s.id}`
      const pubDate = formatRFC822(s.started_at)
      const duration = formatDuration(s.duration_seconds)
      const title = s.title ?? `Show ${s.id}`
      const desc = s.description ?? `${STATION_NAME} — recorded broadcast`
      const bytes = s.size_bytes ?? 0

      return `    <item>
      <title>${escapeXml(title)}</title>
      <description>${escapeXml(desc)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
      <enclosure url="${enclosureUrl}" length="${bytes}" type="audio/mpeg" />
      <itunes:duration>${duration}</itunes:duration>
      <itunes:author>${escapeXml(STATION_NAME)}</itunes:author>
      <itunes:explicit>false</itunes:explicit>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(STATION_NAME)}</title>
    <link>${STATION_URL}</link>
    <description>${escapeXml(STATION_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(STATION_NAME)}</itunes:author>
    <itunes:summary>${escapeXml(STATION_DESC)}</itunes:summary>
    <itunes:category text="Music" />
    <itunes:explicit>false</itunes:explicit>
${items}
  </channel>
</rss>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function podcastRoute(app: FastifyInstance): Promise<void> {
  // RSS feed
  app.get('/podcast/feed.xml', async (request, reply) => {
    reply.header('Content-Type', 'application/rss+xml; charset=utf-8')
    reply.header('Cache-Control', 'public, max-age=300')

    let shows: Show[] = []
    try {
      const db = getDb()
      shows = db
        .prepare('SELECT * FROM shows WHERE published = 1 ORDER BY started_at DESC LIMIT 100')
        .all() as Show[]
    } catch (err) {
      app.log.warn({ err }, 'Failed to fetch shows for podcast feed')
    }

    return buildFeed(shows)
  })

  // JSON list of all shows (including unpublished, for admin use)
  app.get('/podcast/shows', async (request, reply) => {
    reply.header('Cache-Control', 'public, max-age=30')
    let shows: Show[] = []
    try {
      const db = getDb()
      shows = db
        .prepare('SELECT * FROM shows ORDER BY started_at DESC LIMIT 50')
        .all() as Show[]
    } catch (err) {
      app.log.warn({ err }, 'Failed to fetch shows list')
    }
    return { shows, count: shows.length, timestamp: new Date().toISOString() }
  })
}
