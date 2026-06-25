import { useEffect, useState } from 'react'
import Player from './components/Player'
import Schedule from './pages/Schedule'
import Embed from './pages/Embed'
import Stats from './pages/Stats'
import Broadcast from './pages/Broadcast'
import Admin from './pages/Admin'
import './styles/globals.css'

type Page = 'home' | 'schedule' | 'embed' | 'stats' | 'broadcast' | 'admin'

function getPage(): Page {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path === '/schedule')  return 'schedule'
  if (path === '/embed')     return 'embed'
  if (path === '/stats')     return 'stats'
  if (path === '/broadcast') return 'broadcast'
  if (path === '/admin')     return 'admin'
  return 'home'
}

export default function App() {
  const [page, setPage] = useState<Page>(getPage)
  const stationName = import.meta.env.VITE_STATION_NAME ?? 'VPS Radio'

  useEffect(() => {
    const onPop = () => setPage(getPage())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = (to: Page) => {
    const path = to === 'home' ? '/' : `/${to}`
    window.history.pushState({}, '', path)
    setPage(to)
  }

  // Embed page: no shell chrome
  if (page === 'embed') {
    return <Embed />
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo" aria-hidden="true">📻</span>
        <h1 className="app-title">{stationName}</h1>
      </header>

      <nav className="app-nav" aria-label="Main navigation">
        <a
          href="/"
          className={page === 'home' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); navigate('home') }}
        >
          Player
        </a>
        <a
          href="/schedule"
          className={page === 'schedule' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); navigate('schedule') }}
        >
          Schedule
        </a>
        <a
          href="/stats"
          className={page === 'stats' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); navigate('stats') }}
        >
          Stats
        </a>
        <a
          href="/broadcast"
          className={page === 'broadcast' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); navigate('broadcast') }}
        >
          🎙️ Go Live
        </a>
        <a href="/embed" target="_blank" rel="noreferrer">
          Embed ↗
        </a>
        <a
          href="/admin"
          className={page === 'admin' ? 'active' : ''}
          onClick={(e) => { e.preventDefault(); navigate('admin') }}
          style={{ opacity: 0.5 }}
          title="Admin dashboard"
        >
          ⚙
        </a>
      </nav>

      <main className="app-main">
        {page === 'home' && (
          <Player
            streamUrl={import.meta.env.VITE_STREAM_URL ?? '/stream/live'}
            apiUrl={import.meta.env.VITE_API_URL ?? '/api'}
          />
        )}
        {page === 'schedule' && <Schedule />}
        {page === 'stats' && <Stats />}
        {page === 'broadcast' && <Broadcast />}
        {page === 'admin' && <Admin />}
      </main>

      <footer className="app-footer">
        <p>Powered by Icecast2 + Liquidsoap</p>
      </footer>
    </div>
  )
}

