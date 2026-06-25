// VuMeter.tsx — animated stereo VU meter
// Left/right channel levels with green/amber/red zones.

import { useEffect, useRef, useCallback } from 'react'
import '../styles/vu-meter.css'

interface VuMeterProps {
  audioRef: React.RefObject<HTMLAudioElement>
  playing: boolean
}

const SEGMENTS = 20  // number of LED segments per channel
const DECAY    = 0.85 // per-frame decay multiplier for smooth fallback

// Segment colour zones (fraction of full scale):
// 0–60%: green, 60–80%: amber, 80–100%: red
function segmentClass(segIdx: number): string {
  const pct = segIdx / SEGMENTS
  if (pct > 0.8) return 'vu-seg--red'
  if (pct > 0.6) return 'vu-seg--amber'
  return 'vu-seg--green'
}

// ── Stereo splitter audio graph ────────────────────────────────────────────

interface AudioGraph {
  ctx: AudioContext
  analyserL: AnalyserNode
  analyserR: AnalyserNode
}

export default function VuMeter({ audioRef, playing }: VuMeterProps) {
  const leftRef  = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<AudioGraph | null>(null)
  const rafRef   = useRef<number>(0)
  const levelsRef = useRef({ left: 0, right: 0 })

  // ── Setup audio graph ────────────────────────────────────────────────
  const setupGraph = useCallback(() => {
    const audio = audioRef.current
    if (!audio || graphRef.current) return

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()

      const analyserL = ctx.createAnalyser()
      const analyserR = ctx.createAnalyser()
      analyserL.fftSize = 256
      analyserR.fftSize = 256
      analyserL.smoothingTimeConstant = 0.6
      analyserR.smoothingTimeConstant = 0.6

      const source  = ctx.createMediaElementSource(audio)
      const splitter = ctx.createChannelSplitter(2)
      const mergerL  = ctx.createChannelMerger(1)
      const mergerR  = ctx.createChannelMerger(1)

      source.connect(splitter)
      splitter.connect(mergerL, 0, 0)
      splitter.connect(mergerR, 1, 0)
      mergerL.connect(analyserL)
      mergerR.connect(analyserR)
      analyserL.connect(ctx.destination)

      graphRef.current = { ctx, analyserL, analyserR }
    } catch (err) {
      console.warn('[VuMeter] Web Audio setup failed:', err)
    }
  }, [audioRef])

  // ── Compute RMS level from analyser ──────────────────────────────────
  function getRms(analyser: AnalyserNode): number {
    const buf = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteTimeDomainData(buf)
    let sumSq = 0
    for (const v of buf) {
      const norm = (v - 128) / 128
      sumSq += norm * norm
    }
    return Math.sqrt(sumSq / buf.length)
  }

  // ── Render segments ──────────────────────────────────────────────────
  const renderChannel = useCallback((container: HTMLDivElement | null, level: number) => {
    if (!container) return
    const segs = container.querySelectorAll<HTMLSpanElement>('.vu-seg')
    const lit  = Math.round(level * SEGMENTS)
    segs.forEach((seg, i) => {
      seg.classList.toggle('vu-seg--on', i < lit)
    })
  }, [])

  // ── Draw loop ────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const graph = graphRef.current
    if (graph) {
      const rawL = getRms(graph.analyserL)
      const rawR = getRms(graph.analyserR)
      // Clamp + apply decay
      levelsRef.current.left  = Math.min(1, Math.max(rawL * 3, levelsRef.current.left * DECAY))
      levelsRef.current.right = Math.min(1, Math.max(rawR * 3, levelsRef.current.right * DECAY))
    }

    renderChannel(leftRef.current, levelsRef.current.left)
    renderChannel(rightRef.current, levelsRef.current.right)
    rafRef.current = requestAnimationFrame(draw)
  }, [renderChannel])

  // ── Idle decay ───────────────────────────────────────────────────────
  const drawIdle = useCallback(() => {
    levelsRef.current.left  *= DECAY
    levelsRef.current.right *= DECAY
    if (levelsRef.current.left < 0.01) levelsRef.current.left = 0
    if (levelsRef.current.right < 0.01) levelsRef.current.right = 0
    renderChannel(leftRef.current, levelsRef.current.left)
    renderChannel(rightRef.current, levelsRef.current.right)

    if (levelsRef.current.left > 0 || levelsRef.current.right > 0) {
      rafRef.current = requestAnimationFrame(drawIdle)
    }
  }, [renderChannel])

  useEffect(() => {
    if (playing) {
      setupGraph()
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(draw)
    } else {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(drawIdle)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, draw, drawIdle, setupGraph])

  const segments = Array.from({ length: SEGMENTS }, (_, i) => i)

  return (
    <div className="vu-meter" aria-label="VU meter" aria-hidden="true">
      <div className="vu-channel">
        <span className="vu-label">L</span>
        <div ref={leftRef} className="vu-bar">
          {segments.map((i) => (
            <span key={i} className={`vu-seg ${segmentClass(i)}`} />
          ))}
        </div>
      </div>
      <div className="vu-channel">
        <span className="vu-label">R</span>
        <div ref={rightRef} className="vu-bar">
          {segments.map((i) => (
            <span key={i} className={`vu-seg ${segmentClass(i)}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
