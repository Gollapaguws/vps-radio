// Schedule.tsx — Show schedule placeholder page
// Static content for now; Sprint 3 will wire up real scheduling.

import '../styles/schedule.css'

interface Show {
  day: string
  time: string
  name: string
  host: string
  genre: string
}

const PLACEHOLDER_SCHEDULE: Show[] = [
  { day: 'Monday',    time: '20:00 UTC', name: 'Monday Drive',        host: 'DJ Phantom',    genre: 'Deep House' },
  { day: 'Wednesday', time: '21:00 UTC', name: 'Midweek Madness',     host: 'Groove Theory', genre: 'Drum & Bass' },
  { day: 'Friday',    time: '22:00 UTC', name: 'Friday Night Live',   host: 'Bass Station',  genre: 'Techno' },
  { day: 'Saturday',  time: '18:00 UTC', name: 'Saturday Sessions',   host: 'TBA',           genre: 'Ambient / Chill' },
  { day: 'Sunday',    time: '16:00 UTC', name: 'Sunday Selectors',    host: 'Various DJs',   genre: 'Vinyl Only' },
]

export default function Schedule() {
  return (
    <div className="schedule-page">
      <header className="schedule-header">
        <h2 className="schedule-title">📅 Show Schedule</h2>
        <p className="schedule-subtitle">All times UTC — tune in live or catch the podcast replay</p>
      </header>

      <div className="schedule-notice">
        <span>🚧</span>
        <p>Scheduling system coming in Sprint 3. Below is a preview of planned programming.</p>
      </div>

      <ul className="schedule-list" aria-label="Upcoming shows">
        {PLACEHOLDER_SCHEDULE.map((show) => (
          <li key={`${show.day}-${show.time}`} className="schedule-item">
            <div className="schedule-item-day">
              <span className="schedule-day">{show.day}</span>
              <span className="schedule-time">{show.time}</span>
            </div>
            <div className="schedule-item-info">
              <span className="schedule-show-name">{show.name}</span>
              <span className="schedule-host">with {show.host}</span>
              <span className="schedule-genre badge badge--auto">{show.genre}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="schedule-footer-note">
        Want to host a show?{' '}
        <a href="mailto:dj@radio.yourdomain.com">Get in touch →</a>
      </p>
    </div>
  )
}
