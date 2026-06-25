// Embed.tsx — minimal embeddable player for iframe use
// Loads at /embed — 80px compact sticky bar, auto-play off, respects user gesture.

import Player from '../components/Player'
import '../styles/embed.css'

export default function Embed() {
  const streamUrl = import.meta.env.VITE_STREAM_URL ?? '/stream/live'
  const apiUrl    = import.meta.env.VITE_API_URL    ?? '/api'

  return (
    <div className="embed-root">
      <Player
        streamUrl={streamUrl}
        apiUrl={apiUrl}
        compact
      />
    </div>
  )
}
