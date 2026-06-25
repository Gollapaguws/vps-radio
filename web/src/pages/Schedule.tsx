// Schedule.tsx — Dynamic show schedule from /api/schedule
import { useEffect, useState } from 'react'
import '../styles/schedule.css'

interface ScheduleRow {
  id: number
  day: string
  time_start: string
  time_end: string
  host: string
  show_name: string
  genre: string | null
  recurring: number
}

interface ScheduleResponse {
  schedule: ScheduleRow[]
  live: boolean
  liveMount: string | null
}

export default function Schedule() {
  const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
  const [data, setData] = useState<ScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/schedule`)
        const json = await res.json() as ScheduleResponse
        if (!cancelled) { setData(json); setLoading(false) }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [apiUrl])

  const shows = data?.schedule ?? []

  return (
    <div className="schedule-page">
      <header className="schedule-header">
        <h2 className="schedule-title">📅 Show Schedule</h2>
        <p className="schedule-subtitle">All times UTC — tune in live or catch the podcast replay</p>
      </header>

      {data?.live && (
        <div className="schedule-live-banner">
          🔴 <strong>We're LIVE right now!</strong>
          <a href="/" style={{ marginLeft: '0.75rem', color: '#7dd3fc', textDecoration: 'underline' }}>
            Tune in →
          </a>
        </div>
      )}

      {loading && <p className="schedule-loading">Loading schedule…</p>}

      {!loading && shows.length === 0 && (
        <div className="schedule-notice">
          <span>📻</span>
          <p>No shows scheduled yet. Check back soon — or go live yourself at <a href="/broadcast">/broadcast</a>.</p>
        </div>
      )}

      {shows.length > 0 && (
        <ul className="schedule-list" aria-label="Upcoming shows">
          {shows.map((show) => (
            <li key={show.id} className="schedule-item">
              <div className="schedule-item-day">
                <span className="schedule-day">{show.day}</span>
                <span className="schedule-time">{show.time_start} – {show.time_end} UTC</span>
              </div>
              <div className="schedule-item-info">
                <span className="schedule-show-name">{show.show_name}</span>
                <span className="schedule-host">with {show.host}</span>
                {show.genre && <span className="schedule-genre badge badge--auto">{show.genre}</span>}
                {!show.recurring && <span className="badge" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>One-off</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="schedule-footer-note">
        Want to host a show?{' '}
        <a href="/broadcast">Go live now →</a>
      </p>
    </div>
  )
}
