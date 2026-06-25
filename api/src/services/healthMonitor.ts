// healthMonitor.ts — polls Icecast every 30s, detects stream outages,
// monitors disk space, stores listener snapshots, fires Telegram alerts.

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import {
  alertStreamDown,
  alertStreamUp,
  alertDiskWarning,
  sendTelegram,
  isTelegramConfigured,
} from './telegram.js'
import { getDb } from '../db/database.js'

const execAsync = promisify(exec)

const ICECAST_HOST = process.env.ICECAST_HOSTNAME ?? 'localhost'
const ICECAST_PORT = process.env.ICECAST_PORT ?? '8000'
const ICECAST_ADMIN_USER = process.env.ICECAST_ADMIN_USER ?? 'admin'
const ICECAST_ADMIN_PASS = process.env.ICECAST_ADMIN_PASSWORD ?? ''

const POLL_INTERVAL_MS   = 30_000
const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const DISK_WARN_PCT      = 80
const RECORDINGS_PATH    = process.env.RECORDINGS_PATH ?? '/recordings'

export interface StreamStatus {
  up: boolean
  mount: string
  listeners: number
  live: boolean
}

export interface DiskStatus {
  path: string
  usedPct: number
  freeGb: number
  totalGb: number
}

export interface HealthSnapshot {
  stream: StreamStatus
  disk: DiskStatus
  checkedAt: string
}

let latestSnapshot: HealthSnapshot | null = null
let monitorInterval: NodeJS.Timeout | null = null
let snapshotInterval: NodeJS.Timeout | null = null
let dailySummaryInterval: NodeJS.Timeout | null = null

let wasStreamUp = true
let lastDiskWarnAt = 0
let trackCount = 0  // incremented externally or estimated

// ── Icecast polling ─────────────────────────────────────────────────────────

async function fetchIcecastStatus(): Promise<StreamStatus> {
  const url = `http://${ICECAST_HOST}:${ICECAST_PORT}/admin/stats`
  const creds = Buffer.from(`${ICECAST_ADMIN_USER}:${ICECAST_ADMIN_PASS}`).toString('base64')

  const res = await fetch(url, {
    headers: { Authorization: `Basic ${creds}` },
    signal: AbortSignal.timeout(5_000),
  })

  if (!res.ok) throw new Error(`Icecast stats HTTP ${res.status}`)

  const xml = await res.text()

  const listenersMatch = xml.match(/<listeners>(\d+)<\/listeners>/)
  const liveMount = xml.includes('mount="/live"')
  const totalListeners = listenersMatch ? parseInt(listenersMatch[1], 10) : 0

  return {
    up: true,
    mount: liveMount ? '/live' : '/fallback',
    listeners: totalListeners,
    live: liveMount,
  }
}

// ── Disk space check ────────────────────────────────────────────────────────

async function fetchDiskStatus(path: string): Promise<DiskStatus> {
  try {
    const { stdout } = await execAsync(`df -BG "${path}"`)
    const lines = stdout.trim().split('\n')
    if (lines.length < 2) throw new Error('Unexpected df output')
    const parts = lines[1].split(/\s+/)
    return {
      path,
      usedPct:  parseInt(parts[4], 10),
      freeGb:   parseInt(parts[3], 10),
      totalGb:  parseInt(parts[1], 10),
    }
  } catch {
    try {
      const { stdout } = await execAsync(`df -k "${path}"`)
      const lines = stdout.trim().split('\n')
      const parts = lines[1].split(/\s+/)
      const total = parseInt(parts[1], 10)
      const used  = parseInt(parts[2], 10)
      const free  = parseInt(parts[3], 10)
      return {
        path,
        usedPct:  Math.round((used / total) * 100),
        freeGb:   Math.round(free  / 1024 / 1024 * 10) / 10,
        totalGb:  Math.round(total / 1024 / 1024 * 10) / 10,
      }
    } catch {
      return { path, usedPct: 0, freeGb: 0, totalGb: 0 }
    }
  }
}

// ── Store listener snapshot ─────────────────────────────────────────────────

function storeSnapshot(): void {
  if (!latestSnapshot) return
  try {
    const db = getDb()
    db.prepare(`INSERT INTO listener_snapshots (ts, count, mount) VALUES (?, ?, ?)`).run(
      Date.now(),
      latestSnapshot.stream.listeners,
      latestSnapshot.stream.mount,
    )
  } catch { /* db may not be ready yet */ }
}

// ── Daily summary ───────────────────────────────────────────────────────────

async function sendDailySummary(): Promise<void> {
  try {
    const db = getDb()
    const since = Date.now() - 24 * 60 * 60 * 1000
    const rows = db.prepare(
      `SELECT count FROM listener_snapshots WHERE ts >= ? ORDER BY ts ASC`
    ).all(since) as Array<{ count: number }>

    const peak  = rows.length ? Math.max(...rows.map(r => r.count)) : 0
    const avg   = rows.length ? Math.round(rows.reduce((s, r) => s + r.count, 0) / rows.length) : 0
    const shows = db.prepare(
      `SELECT COUNT(*) as n FROM live_shows WHERE started_at >= ? AND active = 0`
    ).get(since) as { n: number }

    await sendTelegram(
      `📊 *Daily Summary — ${new Date().toLocaleDateString('en-ZA')}*\n` +
      `🎧 Peak listeners: ${peak}\n` +
      `📈 Avg listeners: ${avg}\n` +
      `🎙️ Live shows today: ${shows.n}`
    )
  } catch { /* silently skip */ }
}

// ── Core health check ───────────────────────────────────────────────────────

async function runCheck(logger?: { warn: (msg: string) => void }): Promise<void> {
  let stream: StreamStatus
  try {
    stream = await fetchIcecastStatus()
  } catch {
    stream = { up: false, mount: '', listeners: 0, live: false }
  }

  if (!stream.up && wasStreamUp) {
    logger?.warn('[healthMonitor] Stream down')
    await alertStreamDown(stream.mount || '/fallback')
  }
  if (stream.up && !wasStreamUp) {
    logger?.warn('[healthMonitor] Stream restored')
    await alertStreamUp(stream.mount)
  }
  wasStreamUp = stream.up

  const disk = await fetchDiskStatus(RECORDINGS_PATH)
  const now = Date.now()

  if (disk.usedPct >= DISK_WARN_PCT && now - lastDiskWarnAt > 60 * 60 * 1000) {
    logger?.warn(`[healthMonitor] Disk at ${disk.usedPct}%`)
    await alertDiskWarning(disk.usedPct, disk.path)
    lastDiskWarnAt = now
  }

  latestSnapshot = { stream, disk, checkedAt: new Date().toISOString() }
}

// ── Schedule daily summary at midnight ──────────────────────────────────────

function scheduleDailySummary(): NodeJS.Timeout {
  const msUntilMidnight = (): number => {
    const now = new Date()
    const midnight = new Date(now)
    midnight.setHours(23, 59, 0, 0)
    if (midnight <= now) midnight.setDate(midnight.getDate() + 1)
    return midnight.getTime() - now.getTime()
  }

  const schedule = () => {
    dailySummaryInterval = setTimeout(async () => {
      await sendDailySummary()
      schedule() // reschedule for next day
    }, msUntilMidnight())
  }
  schedule()
  return dailySummaryInterval!
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getLatestSnapshot(): HealthSnapshot | null {
  return latestSnapshot
}

export function startHealthMonitor(logger?: { warn: (msg: string) => void; info: (msg: string) => void }): void {
  if (monitorInterval) return

  const configured = isTelegramConfigured()
  logger?.info(`[healthMonitor] Starting — Telegram ${configured ? 'enabled' : 'disabled'}`)

  void runCheck(logger)
  monitorInterval = setInterval(() => void runCheck(logger), POLL_INTERVAL_MS)

  // Listener snapshots every 5min
  snapshotInterval = setInterval(storeSnapshot, SNAPSHOT_INTERVAL_MS)

  // Daily summary at midnight
  scheduleDailySummary()
}

export function stopHealthMonitor(): void {
  if (monitorInterval) { clearInterval(monitorInterval); monitorInterval = null }
  if (snapshotInterval) { clearInterval(snapshotInterval); snapshotInterval = null }
  if (dailySummaryInterval) { clearTimeout(dailySummaryInterval); dailySummaryInterval = null }
}

