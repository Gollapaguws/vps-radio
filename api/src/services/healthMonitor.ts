// healthMonitor.ts — polls Icecast every 30s, detects stream outages,
// monitors disk space, fires Telegram alerts on state changes.

import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import {
  alertStreamDown,
  alertStreamUp,
  alertDiskWarning,
  isTelegramConfigured,
} from './telegram.js'

const execAsync = promisify(exec)

const ICECAST_HOST = process.env.ICECAST_HOSTNAME ?? 'localhost'
const ICECAST_PORT = process.env.ICECAST_PORT ?? '8000'
const ICECAST_ADMIN_USER = process.env.ICECAST_ADMIN_USER ?? 'admin'
const ICECAST_ADMIN_PASS = process.env.ICECAST_ADMIN_PASSWORD ?? ''

const POLL_INTERVAL_MS = 30_000
const DISK_WARN_PCT = 80
const DISK_CRITICAL_PCT = 95
const RECORDINGS_PATH = process.env.RECORDINGS_PATH ?? '/recordings'

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

// Track previous state for edge-triggered alerts
let wasStreamUp = true
let lastDiskWarnAt = 0

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

  // Light-weight XML extraction — avoid importing XMLParser just for two fields
  const listenersMatch = xml.match(/<listeners>(\d+)<\/listeners>/)
  const mountMatch = xml.match(/mount="([^"]+)"/)
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
    // df -BG <path> gives sizes in GiB
    const { stdout } = await execAsync(`df -BG "${path}"`)
    const lines = stdout.trim().split('\n')
    if (lines.length < 2) throw new Error('Unexpected df output')

    const parts = lines[1].split(/\s+/)
    // Columns: Filesystem  1G-blocks  Used  Available  Use%  Mounted
    const total  = parseInt(parts[1], 10)
    const used   = parseInt(parts[2], 10)
    const free   = parseInt(parts[3], 10)
    const usedPct = parseInt(parts[4], 10)

    return { path, usedPct, freeGb: free, totalGb: total }
  } catch {
    // Fallback: try without -BG (macOS / BSD)
    try {
      const { stdout } = await execAsync(`df -k "${path}"`)
      const lines = stdout.trim().split('\n')
      const parts = lines[1].split(/\s+/)
      const total  = parseInt(parts[1], 10)
      const used   = parseInt(parts[2], 10)
      const free   = parseInt(parts[3], 10)
      const usedPct = Math.round((used / total) * 100)
      return {
        path,
        usedPct,
        freeGb:  Math.round(free  / 1024 / 1024 * 10) / 10,
        totalGb: Math.round(total / 1024 / 1024 * 10) / 10,
      }
    } catch {
      return { path, usedPct: 0, freeGb: 0, totalGb: 0 }
    }
  }
}

// ── Core check ──────────────────────────────────────────────────────────────

async function runCheck(logger?: { warn: (msg: string) => void }): Promise<void> {
  // Stream check
  let stream: StreamStatus
  try {
    stream = await fetchIcecastStatus()
  } catch {
    stream = { up: false, mount: '', listeners: 0, live: false }
  }

  // Alert on transition: up → down
  if (!stream.up && wasStreamUp) {
    logger?.warn('[healthMonitor] Stream down — sending Telegram alert')
    await alertStreamDown(stream.mount || '/fallback')
  }
  // Alert on transition: down → up
  if (stream.up && !wasStreamUp) {
    logger?.warn('[healthMonitor] Stream restored — sending Telegram alert')
    await alertStreamUp(stream.mount)
  }
  wasStreamUp = stream.up

  // Disk check
  const disk = await fetchDiskStatus(RECORDINGS_PATH)
  const now = Date.now()

  if (disk.usedPct >= DISK_WARN_PCT && now - lastDiskWarnAt > 60 * 60 * 1000) {
    logger?.warn(`[healthMonitor] Disk at ${disk.usedPct}% — sending Telegram alert`)
    await alertDiskWarning(disk.usedPct, disk.path)
    lastDiskWarnAt = now
  }

  latestSnapshot = {
    stream,
    disk,
    checkedAt: new Date().toISOString(),
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export function getLatestSnapshot(): HealthSnapshot | null {
  return latestSnapshot
}

export function startHealthMonitor(logger?: { warn: (msg: string) => void; info: (msg: string) => void }): void {
  if (monitorInterval) return

  const configured = isTelegramConfigured()
  logger?.info(`[healthMonitor] Starting — poll interval ${POLL_INTERVAL_MS / 1000}s, Telegram ${configured ? 'enabled' : 'disabled'}`)

  // Run immediately, then on interval
  void runCheck(logger)
  monitorInterval = setInterval(() => void runCheck(logger), POLL_INTERVAL_MS)
}

export function stopHealthMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
  }
}
