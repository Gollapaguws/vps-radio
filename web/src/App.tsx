import Player from './components/Player'
import './styles/globals.css'

export default function App() {
  const stationName = import.meta.env.VITE_STATION_NAME ?? 'VPS Radio'

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo" aria-hidden="true">📻</span>
        <h1 className="app-title">{stationName}</h1>
      </header>

      <main className="app-main">
        <Player
          streamUrl={import.meta.env.VITE_STREAM_URL ?? '/stream/live'}
          apiUrl={import.meta.env.VITE_API_URL ?? '/api'}
        />
      </main>

      <footer className="app-footer">
        <p>Powered by Icecast2 + Liquidsoap</p>
      </footer>
    </div>
  )
}
