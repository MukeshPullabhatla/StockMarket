import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
        <AreaChart data={history}>
          <defs>
            <linearGradient id="chart-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 255, 0.1)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#6f7799' }}
            stroke="rgba(148, 163, 255, 0.2)"
            minTickGap={30}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#6f7799' }}
            stroke="rgba(148, 163, 255, 0.2)"
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(17, 20, 40, 0.92)',
              border: '1px solid rgba(167, 139, 250, 0.5)',
              borderRadius: 12,
              color: '#f4f6ff',
            }}
            labelStyle={{ color: '#a3abc8' }}
            itemStyle={{ color: '#22d3ee' }}
            cursor={{ stroke: 'rgba(167, 139, 250, 0.5)' }}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke="url(#chart-stroke)"
            strokeWidth={2.5}
            fill="url(#chart-fill)"
            dot={false}
            activeDot={{ r: 5, fill: '#22d3ee', stroke: '#05060f', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
