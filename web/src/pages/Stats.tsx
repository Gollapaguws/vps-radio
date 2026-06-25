import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import '../styles/stats.css'

type Period = '24h' | '7d' | '30d'

interface StatsData {
  period: Period
  peak: number
  labels: string[]
  datasets: Array<{ label: string; data: number[] }>
}

function formatLabel(iso: string, period: Period): string {
  const d = new Date(iso)
  if (period === '24h') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Stats() {
  const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
  const [period, setPeriod] = useState<Period>('24h')
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${apiUrl}/stats?period=${period}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json() as StatsData
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchData()
    const interval = setInterval(() => void fetchData(), 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [apiUrl, period])

  const chartData = data
    ? data.labels.map((label, i) => ({
        time: formatLabel(label, period),
        listeners: data.datasets[0]?.data[i] ?? 0,
      }))
    : []

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h2>Listener Stats</h2>
        <div className="stats-periods">
          {(['24h', '7d', '30d'] as Period[]).map(p => (
            <button
              key={p}
              className={period === p ? 'active' : ''}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <div className="stats-peak">
          Peak: <strong>{data.peak}</strong> listeners
        </div>
      )}

      <div className="stats-chart">
        {loading && <div className="stats-loading">Loading…</div>}
        {error && <div className="stats-error">No data yet — stats are collected every 5 min once the server runs.</div>}
        {!loading && !error && chartData.length === 0 && (
          <div className="stats-empty">No snapshots yet. Check back in 5 minutes.</div>
        )}
        {!loading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="time"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                tickLine={false}
                allowDecimals={false}
                minTickGap={20}
              />
              <Tooltip
                contentStyle={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8 }}
                labelStyle={{ color: 'white' }}
                itemStyle={{ color: '#7dd3fc' }}
              />
              <Line
                type="monotone"
                dataKey="listeners"
                stroke="#7dd3fc"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
