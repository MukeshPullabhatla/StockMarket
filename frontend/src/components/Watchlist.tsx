import { useEffect, useState } from 'react'
import { addToWatchlist, getWatchlist, removeFromWatchlist } from '../api/client'
import { changeDirection, formatChange, formatPrice } from '../format'
import type { Quote, WatchlistItem } from '../types'

interface Props {
  liveQuotes: Record<string, Quote>
  onSelectSymbol: (symbol: string) => void
}

export function Watchlist({ liveQuotes, onSelectSymbol }: Props) {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  function refresh() {
    getWatchlist().then(setItems).catch((err) => setError(err.message))
  }

  useEffect(refresh, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const symbol = input.trim().toUpperCase()
    if (!symbol) return
    setAdding(true)
    setError(null)
    try {
      await addToWatchlist(symbol)
      setInput('')
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(symbol: string) {
    await removeFromWatchlist(symbol)
    refresh()
  }

  return (
    <div className="panel">
      <h2>Watchlist</h2>
      <form onSubmit={handleAdd} className="add-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add symbol, e.g. AAPL"
        />
        <button type="submit" disabled={adding}>
          Add
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      <table className="quote-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Change</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const quote = liveQuotes[item.symbol]
            return (
              <tr key={item.symbol} onClick={() => onSelectSymbol(item.symbol)}>
                <td className="symbol">{item.symbol}</td>
                <td>{formatPrice(quote?.price ?? null, quote?.currency ?? null)}</td>
                <td className={changeDirection(quote?.change ?? null)}>
                  {formatChange(quote?.change ?? null, quote?.change_percent ?? null)}
                </td>
                <td>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(item.symbol)
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            )
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                No symbols yet — add one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
