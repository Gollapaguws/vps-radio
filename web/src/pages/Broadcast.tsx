import { useRef, useState, useEffect, useCallback } from 'react'
import '../styles/broadcast.css'

type BroadcastState = 'idle' | 'connecting' | 'live' | 'error'

export default function Broadcast() {
  const apiUrl = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/api$/, '')
  const wsUrl  = apiUrl.replace(/^http/, 'ws') + '/broadcast'

  const [state, setState]    = useState<BroadcastState>('idle')
  const [token, setToken]    = useState('')
  const [error, setError]    = useState<string | null>(null)
  const [level, setLevel]    = useState(0)    // mic level 0-100
  const [listeners, setListeners] = useState(0)

  const wsRef        = useRef<WebSocket | null>(null)
  const recRef       = useRef<MediaRecorder | null>(null)
  const animRef      = useRef<number>(0)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const audioCtxRef  = useRef<AudioContext | null>(null)

  // Poll listener count
  useEffect(() => {
    const poll = async () => {
      try {
        const vUrl = import.meta.env.VITE_API_URL ?? '/api'
        const res = await fetch(`${vUrl}/now-playing`)
        const data = await res.json() as { listeners: number }
        setListeners(data.listeners)
      } catch { /* ignore */ }
    }
    const t = setInterval(() => void poll(), 15_000)
    void poll()
    return () => clearInterval(t)
  }, [])

  // Mic level animation
  const animateMic = useCallback(() => {
    if (!analyserRef.current) return
    const buf = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(buf)
    const avg = buf.reduce((s, v) => s + v, 0) / buf.length
    setLevel(Math.min(100, (avg / 128) * 100))
    animRef.current = requestAnimationFrame(animateMic)
  }, [])

  const goLive = useCallback(async () => {
    if (!token) { setError('Enter your broadcast token first'); return }
    setState('connecting')
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })

      // Mic level meter
      audioCtxRef.current = new AudioContext()
      const src = audioCtxRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      src.connect(analyserRef.current)
      animateMic()

      // WebSocket
      const ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onopen = () => {
        setState('live')
        // MediaRecorder: timeslice 250ms chunks
        const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
        recRef.current = rec
        rec.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data)
          }
        }
        rec.start(250)
      }

      ws.onerror = () => {
        setState('error')
        setError('WebSocket error — check your token')
      }

      ws.onclose = (e) => {
        if (e.code === 4401) setError('Invalid token')
        setState(s => s === 'live' ? 'idle' : s)
        recRef.current?.stop()
        cancelAnimationFrame(animRef.current)
        setLevel(0)
        stream.getTracks().forEach(t => t.stop())
      }
    } catch (e) {
      setState('error')
      setError(`Mic error: ${String(e)}`)
    }
  }, [token, wsUrl, animateMic])

  const goOffAir = useCallback(() => {
    recRef.current?.stop()
    wsRef.current?.close()
    cancelAnimationFrame(animRef.current)
    audioCtxRef.current?.close()
    setLevel(0)
    setState('idle')
  }, [])

  const isLive = state === 'live'

  return (
    <div className="broadcast-page">
      <div className="broadcast-card">
        <h2 className="broadcast-title">🎙️ Go Live</h2>
        <p className="broadcast-sub">Stream your mic directly to Icecast</p>

        {state !== 'live' && (
          <div className="broadcast-token">
            <label htmlFor="bc-token">Broadcast Token</label>
            <input
              id="bc-token"
              type="password"
              placeholder="Enter your API_SECRET"
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && void goLive()}
              disabled={state === 'connecting'}
            />
          </div>
        )}

        {error && <div className="broadcast-error">{error}</div>}

        <div className={`broadcast-btn-wrap ${isLive ? 'live' : ''}`}>
          {!isLive ? (
            <button
              className="broadcast-btn go-live"
              onClick={() => void goLive()}
              disabled={state === 'connecting'}
            >
              {state === 'connecting' ? 'Connecting…' : '🔴 GO LIVE'}
            </button>
          ) : (
            <button className="broadcast-btn off-air" onClick={goOffAir}>
              ⏹ END BROADCAST
            </button>
          )}
        </div>

        {isLive && (
          <div className="broadcast-stats">
            <div className="broadcast-live-badge">ON AIR</div>
            <div className="broadcast-listeners">{listeners} listening</div>
          </div>
        )}

        {isLive && (
          <div className="broadcast-meter">
            <div className="broadcast-meter-label">MIC</div>
            <div className="broadcast-meter-bar">
              <div
                className="broadcast-meter-fill"
                style={{ width: `${level}%`, background: level > 80 ? '#ef4444' : level > 50 ? '#f59e0b' : '#22c55e' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
