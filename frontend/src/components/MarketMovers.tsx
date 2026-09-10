import { useEffect, useState } from 'react'
import { getMovers } from '../api/client'
import { changeDirection, formatChange, formatPrice } from '../format'
import type { MoverCategory, Quote } from '../types'

const TABS: { key: MoverCategory; label: string }[] = [
  { key: 'gainers', label: 'Top Gainers' },
  { key: 'losers', label: 'Top Losers' },
  { key: 'most_active', label: 'Most Active' },
]

interface Props {
  liveQuotes: Record<string, Quote>
  onSelectSymbol: (symbol: string) => void
}

export function MarketMovers({ liveQuotes, onSelectSymbol }: Props) {
  const [tab, setTab] = useState<MoverCategory>('gainers')
  const [movers, setMovers] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getMovers(tab)
      .then((data) => {
        if (!cancelled) setMovers(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tab])

  return (
    <div className="panel">
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}
      <table className="quote-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Price</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {movers.map((m) => {
            const quote = liveQuotes[m.symbol] ?? m
            return (
              <tr key={m.symbol} onClick={() => onSelectSymbol(m.symbol)}>
                <td className="symbol">{m.symbol}</td>
                <td className="name">{m.name}</td>
                <td>{formatPrice(quote.price, quote.currency)}</td>
                <td className={changeDirection(quote.change)}>
                  {formatChange(quote.change, quote.change_percent)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
