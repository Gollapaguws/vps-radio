// Visualizer.tsx — Canvas waveform visualizer using Web Audio API AnalyserNode
// Animated frequency bars synced to the audio element.

import { useEffect, useRef, useCallback } from 'react'
import '../styles/visualizer.css'

interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>
  playing: boolean
  barCount?: number
}

const BAR_COUNT = 48
const FFT_SIZE  = 256  // must be power of 2; bins = fftSize / 2

export default function Visualizer({ audioRef, playing, barCount = BAR_COUNT }: VisualizerProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const ctxRef      = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef   = useRef<MediaElementAudioSourceNode | null>(null)
  const rafRef      = useRef<number>(0)
  const dataRef     = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(FFT_SIZE / 2) as Uint8Array<ArrayBuffer>)

  // ── Setup Web Audio graph ──────────────────────────────────────────────
  const setupAudio = useCallback(() => {
    const audio = audioRef.current
    if (!audio || ctxRef.current) return

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = FFT_SIZE
      analyser.smoothingTimeConstant = 0.8

      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)

      ctxRef.current   = ctx
      analyserRef.current = analyser
      sourceRef.current   = source
      dataRef.current     = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    } catch (err) {
      console.warn('[Visualizer] Web Audio setup failed:', err)
    }
  }, [audioRef])

  // ── Draw loop ──────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas  = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    analyser.getByteFrequencyData(dataRef.current)

    const { width, height } = canvas
    ctx2d.clearRect(0, 0, width, height)

    const bins   = dataRef.current.length
    const step   = Math.floor(bins / barCount)
    const gap    = 2
    const barW   = Math.max(1, Math.floor(width / barCount) - gap)

    for (let i = 0; i < barCount; i++) {
      // Average a few bins per bar for smoother look
      let sum = 0
      for (let j = 0; j < step; j++) {
        sum += dataRef.current[i * step + j] ?? 0
      }
      const value = sum / step / 255  // normalise 0..1

      const barH = Math.max(2, value * height)
      const x = i * (barW + gap)
      const y = height - barH

      // Gradient: bottom = accent purple → top = cyan
      const gradient = ctx2d.createLinearGradient(0, height, 0, 0)
      gradient.addColorStop(0,   'rgba(124, 106, 245, 0.9)')
      gradient.addColorStop(0.6, 'rgba(100, 200, 255, 0.85)')
      gradient.addColorStop(1,   'rgba(200, 240, 255, 0.6)')

      ctx2d.fillStyle = gradient
      ctx2d.beginPath()
      ctx2d.roundRect(x, y, barW, barH, [2, 2, 0, 0])
      ctx2d.fill()
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [barCount])

  // ── Idle animation (when not playing) ─────────────────────────────────
  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    ctx2d.clearRect(0, 0, canvas.width, canvas.height)

    const gap  = 2
    const barW = Math.max(1, Math.floor(canvas.width / barCount) - gap)
    const t    = Date.now() / 1000

    for (let i = 0; i < barCount; i++) {
      const wave  = Math.sin(t * 1.5 + i * 0.4) * 0.5 + 0.5
      const barH  = Math.max(2, wave * canvas.height * 0.15 + 3)
      const x     = i * (barW + gap)
      const y     = canvas.height - barH

      ctx2d.fillStyle = 'rgba(46, 46, 56, 0.8)'
      ctx2d.beginPath()
      ctx2d.roundRect(x, y, barW, barH, [2, 2, 0, 0])
      ctx2d.fill()
    }

    rafRef.current = requestAnimationFrame(drawIdle)
  }, [barCount])

  // ── Lifecycle ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      setupAudio()
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(draw)
    } else {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(drawIdle)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, draw, drawIdle, setupAudio])

  // ── Resize handler ─────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width  = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    return () => ro.disconnect()
  }, [])

  return (
    <div className="visualizer" aria-hidden="true">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  )
}
