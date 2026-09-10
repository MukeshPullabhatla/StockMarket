import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getHistory } from '../api/client'
import type { HistoryPoint } from '../types'

const PERIODS = ['5d', '1mo', '6mo', '1y'] as const

interface Props {
  symbol: string | null
}

export function StockChart({ symbol }: Props) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('1mo')
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false
    setError(null)
    getHistory(symbol, period)
      .then((data) => {
        if (!cancelled) setHistory(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [symbol, period])

  if (!symbol) {
    return (
      <div className="panel chart-panel">
        <p className="muted">Select a symbol to see its trend.</p>
      </div>
    )
  }

  return (
    <div className="panel chart-panel">
      <div className="chart-header">
        <h2>{symbol}</h2>
        <div className="tabs">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={p === period ? 'tab active' : 'tab'}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={30} />
          <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={70} />
          <Tooltip />
          <Line type="monotone" dataKey="close" stroke="var(--accent)" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
