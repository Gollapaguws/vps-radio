// database.ts — SQLite setup via better-sqlite3
// Creates tables on first run; safe to call multiple times (idempotent).

import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const DB_PATH = process.env.DB_PATH ?? '/data/radio.db'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  // Ensure parent directory exists
  try {
    mkdirSync(dirname(DB_PATH), { recursive: true })
  } catch { /* ignore */ }

  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  migrate(_db)
  return _db
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shows (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at       TEXT NOT NULL,
      ended_at         TEXT,
      filename         TEXT,
      r2_key           TEXT,
      r2_url           TEXT,
      title            TEXT,
      description      TEXT,
      duration_seconds INTEGER,
      size_bytes       INTEGER,
      published        INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS show_metadata (
      show_id  INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
      key      TEXT NOT NULL,
      value    TEXT,
      PRIMARY KEY (show_id, key)
    );
  `)
}

export type Show = {
  id: number
  started_at: string
  ended_at: string | null
  filename: string | null
  r2_key: string | null
  r2_url: string | null
  title: string | null
  description: string | null
  duration_seconds: number | null
  size_bytes: number | null
  published: number
  created_at: string
}
