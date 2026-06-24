import { useRef, useState, useCallback } from 'react'
import { useNowPlaying } from '../hooks/useNowPlaying'
import '../styles/player.css'

interface PlayerProps {
  streamUrl: string
  apiUrl: string
}

export default function Player({ streamUrl, apiUrl }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [loading, setLoading] = useState(false)
  const { nowPlaying, error: npError } = useNowPlaying(apiUrl)

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      // Flush buffer to prevent stale audio on resume
      audio.src = ''
      setPlaying(false)
    } else {
      setLoading(true)
      // Append cache-bust timestamp to force fresh connection
      audio.src = `${streamUrl}?t=${Date.now()}`
      audio.volume = volume
      audio.play()
        .then(() => {
          setPlaying(true)
          setLoading(false)
        })
        .catch((err: unknown) => {
          console.error('Playback failed:', err)
          setLoading(false)
        })
    }
  }, [playing, streamUrl, volume])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const handleError = useCallback(() => {
    setPlaying(false)
    setLoading(false)
  }, [])

  const trackTitle = nowPlaying?.title ?? 'Loading...'
  const trackArtist = nowPlaying?.artist ?? ''
  const listenerCount = nowPlaying?.listeners ?? 0
  const isLive = nowPlaying?.live ?? false

  return (
    <section className="player" aria-label="Radio player">
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        onError={handleError}
        onEnded={handleError}
        aria-label="Radio stream audio"
      />

      {/* Now playing metadata */}
      <div className="player-meta">
        <div className="player-status">
          {isLive && <span className="badge badge--live" aria-label="Live broadcast">LIVE</span>}
          {!isLive && nowPlaying && <span className="badge badge--auto">AUTO</span>}
        </div>
        <p className="player-track" title={trackTitle}>{trackTitle}</p>
        {trackArtist && <p className="player-artist">{trackArtist}</p>}
        {npError && <p className="player-error" role="alert">⚠ Could not reach stream server</p>}
      </div>

      {/* Controls */}
      <div className="player-controls">
        <button
          className={`play-btn ${playing ? 'play-btn--playing' : ''} ${loading ? 'play-btn--loading' : ''}`}
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          aria-pressed={playing}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner" aria-hidden="true" />
          ) : playing ? (
            <span aria-hidden="true">⏸</span>
          ) : (
            <span aria-hidden="true">▶</span>
          )}
        </button>

        <div className="volume-wrap">
          <span className="volume-icon" aria-hidden="true">🔊</span>
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Listener count */}
      {nowPlaying && (
        <div className="player-footer">
          <span className="listener-count">
            👥 {listenerCount} listener{listenerCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </section>
  )
}
