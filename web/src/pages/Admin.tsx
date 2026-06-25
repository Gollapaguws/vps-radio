import { useState, useEffect, useCallback } from 'react'
import '../styles/admin.css'

const API = (import.meta.env.VITE_API_URL ?? '/api')

// ── Types ───────────────────────────────────────────────────────────────────
interface HealthData {
  status: string
  stream: { status: string; listeners: number; live: boolean }
  disk: { usedPct: string; freeGb: number }
}
interface RequestRow {
  id: number; requester: string; song: string; status: string; created_at: number
}
interface ScheduleRow {
  id: number; day: string; time_start: string; time_end: string
  host: string; show_name: string; genre: string | null; recurring: number
}

// ── Login screen ────────────────────────────────────────────────────────────
function Login({ onToken }: { onToken: (t: string) => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      if (!res.ok) throw new Error('Invalid password')
      const { token } = await res.json() as { token: string }
      localStorage.setItem('admin_token', token)
      onToken(token)
    } catch (e) {
      setErr(String(e).replace('Error: ', ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h1 className="admin-login-title">🔐 Admin</h1>
        <p className="admin-login-sub">Lekkerkuier Radio</p>
        <form onSubmit={e => void submit(e)}>
          <input
            type="password"
            className="admin-input"
            placeholder="Admin password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            disabled={busy}
            autoFocus
          />
          {err && <p className="admin-error">{err}</p>}
          <button type="submit" className="admin-btn-primary" disabled={busy || !pw}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Stats summary ────────────────────────────────────────────────────────────
function StatsSummary(_: { token: string }) {
  const [health, setHealth] = useState<HealthData | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/health`)
        setHealth(await res.json() as HealthData)
      } catch { /* ignore */ }
    }
    void load()
    const t = setInterval(() => void load(), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!health) return <div className="admin-loading">Loading stats…</div>

  return (
    <div className="admin-stat-grid">
      <div className={`admin-stat ${health.status === 'ok' ? 'ok' : 'warn'}`}>
        <div className="admin-stat-label">System</div>
        <div className="admin-stat-value">{health.status.toUpperCase()}</div>
      </div>
      <div className={`admin-stat ${health.stream.status === 'up' ? 'ok' : 'warn'}`}>
        <div className="admin-stat-label">Stream</div>
        <div className="admin-stat-value">{health.stream.status.toUpperCase()}</div>
      </div>
      <div className="admin-stat">
        <div className="admin-stat-label">Listeners</div>
        <div className="admin-stat-value">{health.stream.listeners}</div>
      </div>
      <div className={`admin-stat ${parseInt(health.disk.usedPct) > 90 ? 'warn' : 'ok'}`}>
        <div className="admin-stat-label">Disk</div>
        <div className="admin-stat-value">{health.disk.usedPct} used</div>
      </div>
    </div>
  )
}

// ── Song Requests panel ─────────────────────────────────────────────────────
function RequestsPanel({ token }: { token: string }) {
  const [rows, setRows] = useState<RequestRow[]>([])
  const headers = { Authorization: `Bearer ${token}` }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/requests?status=pending`, { headers })
      const data = await res.json() as { requests: RequestRow[] }
      setRows(data.requests)
    } catch { /* ignore */ }
  }, [token])

  useEffect(() => { void load() }, [load])

  const fulfill = async (id: number) => {
    await fetch(`${API}/requests/${id}`, { method: 'DELETE', headers })
    void load()
  }

  return (
    <div className="admin-panel">
      <h3 className="admin-panel-title">🎵 Song Requests ({rows.length})</h3>
      {rows.length === 0 && <p className="admin-empty">No pending requests</p>}
      <ul className="admin-list">
        {rows.map(r => (
          <li key={r.id} className="admin-list-item">
            <div className="admin-list-main">
              <strong>{r.song}</strong>
              <span className="admin-list-sub">from {r.requester}</span>
            </div>
            <button className="admin-btn-sm" onClick={() => void fulfill(r.id)}>✓ Done</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Live Shows log ──────────────────────────────────────────────────────────
function ShowsPanel() {
  useEffect(() => {
    // DJ sessions are logged when DJs connect — link out to API
  }, [])

  return (
    <div className="admin-panel">
      <h3 className="admin-panel-title">📡 Recent Shows</h3>
      <p className="admin-empty">
        Live DJ sessions are logged when DJs connect to the stream.{' '}
        <a href={`${API}/shows`} target="_blank" rel="noreferrer" style={{ color: '#7dd3fc' }}>
          View show archive →
        </a>
      </p>
    </div>
  )
}

// ── Schedule manager ────────────────────────────────────────────────────────
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function SchedulePanel({ token }: { token: string }) {
  const [rows, setRows] = useState<ScheduleRow[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ day: 'Monday', time_start: '20:00', time_end: '22:00', host: '', show_name: '', genre: '', recurring: true })
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/schedule`)
      const data = await res.json() as { schedule: ScheduleRow[] }
      setRows(data.schedule)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { void load() }, [load])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`${API}/schedule`, {
      method: 'POST', headers,
      body: JSON.stringify({ ...form, recurring: form.recurring ? 1 : 0 }),
    })
    setAdding(false)
    setForm({ day: 'Monday', time_start: '20:00', time_end: '22:00', host: '', show_name: '', genre: '', recurring: true })
    void load()
  }

  const del = async (id: number) => {
    await fetch(`${API}/schedule/${id}`, { method: 'DELETE', headers })
    void load()
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3 className="admin-panel-title">📅 Schedule ({rows.length} shows)</h3>
        <button className="admin-btn-primary" onClick={() => setAdding(a => !a)}>
          {adding ? '✕ Cancel' : '+ Add Show'}
        </button>
      </div>

      {adding && (
        <form className="admin-form" onSubmit={e => void add(e)}>
          <div className="admin-form-row">
            <select className="admin-input" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
            <input className="admin-input" type="time" value={form.time_start} onChange={e => setForm(f => ({ ...f, time_start: e.target.value }))} />
            <input className="admin-input" type="time" value={form.time_end}   onChange={e => setForm(f => ({ ...f, time_end: e.target.value }))} />
          </div>
          <div className="admin-form-row">
            <input className="admin-input" placeholder="Show name *" value={form.show_name} onChange={e => setForm(f => ({ ...f, show_name: e.target.value }))} required />
            <input className="admin-input" placeholder="Host *" value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))} required />
            <input className="admin-input" placeholder="Genre" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} />
          </div>
          <div className="admin-form-row">
            <label className="admin-checkbox">
              <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} />
              Recurring weekly
            </label>
            <button type="submit" className="admin-btn-primary">Save</button>
          </div>
        </form>
      )}

      {rows.length === 0 && !adding && <p className="admin-empty">No shows scheduled</p>}
      <ul className="admin-list">
        {rows.map(r => (
          <li key={r.id} className="admin-list-item">
            <div className="admin-list-main">
              <strong>{r.show_name}</strong>
              <span className="admin-list-sub">{r.day} {r.time_start}–{r.time_end} · {r.host}{r.genre ? ` · ${r.genre}` : ''}</span>
            </div>
            <button className="admin-btn-sm admin-btn-danger" onClick={() => void del(r.id)}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  return (
    <div className="admin-dashboard">
      <div className="admin-topbar">
        <h1 className="admin-topbar-title">📻 Admin Dashboard</h1>
        <button className="admin-btn-sm" onClick={onLogout}>Sign out</button>
      </div>

      <StatsSummary token={token} />
      <RequestsPanel token={token} />
      <SchedulePanel token={token} />
      <ShowsPanel />
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('admin_token')
    return t
  })

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setToken(null)
  }

  if (!token) return <Login onToken={setToken} />
  return <Dashboard token={token} onLogout={handleLogout} />
}
