import { useState } from 'react'
import '../styles/song-request.css'

interface SongRequestProps {
  apiUrl: string
}

export default function SongRequest({ apiUrl }: SongRequestProps) {
  const [open, setOpen]         = useState(false)
  const [requester, setRequester] = useState('')
  const [song, setSong]         = useState('')
  const [state, setState]       = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError]       = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!song.trim()) return
    setState('sending')
    setError('')
    try {
      const res = await fetch(`${apiUrl}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester: requester.trim() || 'Anonymous', song: song.trim() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setState('sent')
      setSong('')
      setRequester('')
      setTimeout(() => setState('idle'), 4000)
    } catch (e) {
      setState('error')
      setError(String(e))
    }
  }

  return (
    <div className="song-req-wrap">
      <button
        className="song-req-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        🎵 Request a song {open ? '▲' : '▼'}
      </button>

      {open && (
        <form className="song-req-form" onSubmit={e => void submit(e)}>
          {state === 'sent' && (
            <div className="song-req-success">✅ Request sent! We'll try to play it soon.</div>
          )}
          {state !== 'sent' && (
            <>
              <input
                className="song-req-input"
                placeholder="Your name (optional)"
                value={requester}
                onChange={e => setRequester(e.target.value)}
                maxLength={80}
                disabled={state === 'sending'}
              />
              <input
                className="song-req-input"
                placeholder="Song title or artist *"
                value={song}
                onChange={e => setSong(e.target.value)}
                maxLength={200}
                required
                disabled={state === 'sending'}
              />
              {error && <p className="song-req-error">{error}</p>}
              <button
                type="submit"
                className="song-req-submit"
                disabled={state === 'sending' || !song.trim()}
              >
                {state === 'sending' ? 'Sending…' : 'Send Request'}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  )
}
