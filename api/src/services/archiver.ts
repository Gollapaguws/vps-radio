// archiver.ts — watches /recordings for completed MP3 files,
// uploads to Cloudflare R2, logs to SQLite, triggers RSS update.

import { watch, statSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { createReadStream, readFileSync } from 'node:fs'
import { getDb } from '../db/database.js'

const RECORDINGS_DIR = process.env.RECORDINGS_PATH ?? '/recordings'
const R2_ACCOUNT_ID  = process.env.R2_ACCOUNT_ID  ?? ''
const R2_ACCESS_KEY  = process.env.R2_ACCESS_KEY_ID ?? ''
const R2_SECRET_KEY  = process.env.R2_SECRET_ACCESS_KEY ?? ''
const R2_BUCKET      = process.env.R2_BUCKET ?? 'vps-radio-archive'
const R2_PUBLIC_URL  = process.env.R2_PUBLIC_URL ?? ''

// A file is considered "complete" if it hasn't grown for this many ms
const STABILITY_MS = 60_000

function isR2Configured(): boolean {
  return R2_ACCOUNT_ID.length > 0 && R2_ACCESS_KEY.length > 0 && R2_SECRET_KEY.length > 0
}

function createS3Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  })
}

// ── Size-stability tracker ─────────────────────────────────────────────────

const pendingFiles = new Map<string, { size: number; stableAt: number }>()

function trackFile(filePath: string): void {
  try {
    const size = statSync(filePath).size
    const existing = pendingFiles.get(filePath)

    if (!existing || existing.size !== size) {
      // File grew — reset stability timer
      pendingFiles.set(filePath, { size, stableAt: Date.now() + STABILITY_MS })
    }
  } catch { /* file deleted or inaccessible */ }
}

// ── R2 upload ──────────────────────────────────────────────────────────────

async function uploadToR2(filePath: string): Promise<string | null> {
  if (!isR2Configured()) {
    console.warn('[archiver] R2 not configured — skipping upload')
    return null
  }

  const key = `shows/${basename(filePath)}`
  const client = createS3Client()

  try {
    // Check if already uploaded
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    console.log(`[archiver] ${key} already in R2`)
    return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null
  } catch { /* not found — upload it */ }

  const body = readFileSync(filePath)
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: 'audio/mpeg',
  }))

  console.log(`[archiver] Uploaded ${key} to R2`)
  return R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : null
}

// ── SQLite logging ─────────────────────────────────────────────────────────

function logShowToDb(filePath: string, r2Key: string | null, r2Url: string | null): void {
  const db = getDb()
  const filename = basename(filePath)
  const existing = db.prepare('SELECT id FROM shows WHERE filename = ?').get(filename)
  if (existing) return

  let startedAt: string
  let sizeBytes: number

  try {
    const stat = statSync(filePath)
    sizeBytes = stat.size
    // Parse timestamp from filename: YYYY-MM-DDTHH-MM-SS-live.mp3
    const match = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/)
    startedAt = match ? match[1].replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3') + 'Z' : new Date().toISOString()
  } catch {
    sizeBytes = 0
    startedAt = new Date().toISOString()
  }

  const isLive = filename.includes('-live')
  const title = isLive ? 'Live Show' : 'Automated Broadcast'

  db.prepare(`
    INSERT INTO shows (started_at, filename, r2_key, r2_url, title, size_bytes, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(startedAt, filename, r2Key, r2Url, title, sizeBytes, r2Url ? 1 : 0)

  console.log(`[archiver] Logged show: ${filename}`)
}

// ── Process completed files ────────────────────────────────────────────────

async function processFile(filePath: string): Promise<void> {
  if (!filePath.endsWith('.mp3')) return

  try {
    const r2Url = await uploadToR2(filePath)
    const key = R2_PUBLIC_URL && r2Url ? `shows/${basename(filePath)}` : null
    logShowToDb(filePath, key, r2Url)
    pendingFiles.delete(filePath)
  } catch (err) {
    console.error(`[archiver] Failed to process ${filePath}:`, err)
  }
}

// ── File stability poll ────────────────────────────────────────────────────

async function checkStableFiles(): Promise<void> {
  const now = Date.now()
  for (const [filePath, meta] of pendingFiles) {
    if (now >= meta.stableAt) {
      console.log(`[archiver] File stable, processing: ${filePath}`)
      await processFile(filePath)
    } else {
      trackFile(filePath) // re-check size
    }
  }
}

// ── Directory scanner (picks up files that existed before start) ───────────

async function scanExisting(): Promise<void> {
  try {
    const files = await readdir(RECORDINGS_DIR)
    for (const f of files) {
      if (f.endsWith('.mp3')) {
        const fullPath = join(RECORDINGS_DIR, f)
        const db = getDb()
        const logged = db.prepare('SELECT id FROM shows WHERE filename = ?').get(f)
        if (!logged) {
          pendingFiles.set(fullPath, { size: 0, stableAt: 0 }) // process immediately
        }
      }
    }
  } catch { /* directory not yet mounted */ }
}

// ── Watcher ────────────────────────────────────────────────────────────────

let watcherStarted = false
let pollInterval: NodeJS.Timeout | null = null

export function startArchiver(): void {
  if (watcherStarted) return
  watcherStarted = true

  console.log(`[archiver] Watching ${RECORDINGS_DIR} for completed recordings`)

  // Scan files that already exist
  void scanExisting()

  // Watch for new/changed files
  try {
    watch(RECORDINGS_DIR, { persistent: false }, (event, filename) => {
      if (!filename?.endsWith('.mp3')) return
      trackFile(join(RECORDINGS_DIR, filename))
    })
  } catch {
    console.warn('[archiver] Could not watch recordings dir — will rely on periodic scan')
  }

  // Periodic: check for stable files + re-scan
  pollInterval = setInterval(async () => {
    await checkStableFiles()
    await scanExisting()
  }, 30_000)
}

export function stopArchiver(): void {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}
