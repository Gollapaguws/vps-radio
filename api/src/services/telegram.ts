// telegram.ts — send alerts via Telegram Bot API
// Env vars required: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? ''
const TELEGRAM_API = 'https://api.telegram.org'

export type AlertType = 'stream_down' | 'stream_up' | 'disk_warning' | 'disk_critical' | 'listener_spike' | 'info'

interface SendOptions {
  type?: AlertType
  silent?: boolean
}

const ICONS: Record<AlertType, string> = {
  stream_down:    '🔴',
  stream_up:      '🟢',
  disk_warning:   '🟡',
  disk_critical:  '🔴',
  listener_spike: '📈',
  info:           'ℹ️',
}

export function isTelegramConfigured(): boolean {
  return BOT_TOKEN.length > 0 && CHAT_ID.length > 0
}

export async function sendAlert(message: string, opts: SendOptions = {}): Promise<void> {
  if (!isTelegramConfigured()) return

  const type = opts.type ?? 'info'
  const icon = ICONS[type]
  const text = `${icon} *VPS Radio*\n\n${message}`

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'Markdown',
        disable_notification: opts.silent ?? false,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const body = await res.text()
      console.warn(`[telegram] HTTP ${res.status}: ${body}`)
    }
  } catch (err) {
    console.warn('[telegram] Failed to send alert:', err)
  }
}

export async function alertStreamDown(mount: string): Promise<void> {
  await sendAlert(
    `Stream *down* on \`${mount}\`\n_Attempting auto-restart…_`,
    { type: 'stream_down' },
  )
}

export async function alertStreamUp(mount: string): Promise<void> {
  await sendAlert(
    `Stream *restored* on \`${mount}\` ✓`,
    { type: 'stream_up' },
  )
}

export async function alertDiskWarning(usedPct: number, path: string): Promise<void> {
  const type = usedPct >= 95 ? 'disk_critical' : 'disk_warning'
  await sendAlert(
    `Disk usage at *${usedPct}%* on \`${path}\`\n_Clear old recordings to free space._`,
    { type },
  )
}

export async function alertListenerSpike(count: number, mount: string): Promise<void> {
  await sendAlert(
    `Listener spike: *${count} listeners* on \`${mount}\``,
    { type: 'listener_spike', silent: true },
  )
}
