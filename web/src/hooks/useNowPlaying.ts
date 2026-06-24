import { useEffect, useRef, useState } from 'react'

export interface NowPlaying {
  live: boolean
  mount: string
  title: string
  artist: string
  listeners: number
  bitrate: number
  format: string
  stream_start: string | null
  fallback: boolean
  timestamp: string
}

export function useNowPlaying(apiUrl: string, intervalMs = 15_000) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNowPlaying = async () => {
    try {
      const res = await fetch(`${apiUrl}/now-playing`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as NowPlaying
      setNowPlaying(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    void fetchNowPlaying()
    timerRef.current = setInterval(() => void fetchNowPlaying(), intervalMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, intervalMs])

  return { nowPlaying, error }
}
