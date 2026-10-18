import { useEffect, useMemo, useState } from 'react'
import { getQuotes, getWatchlist, lookupSymbol } from '../api/client'
import { changeDirection, formatChange, formatPrice } from '../format'
import type { Quote, WatchlistItem } from '../types'

// Each visitor's watchlist lives in their own browser. The server's shared
// list (curated by the site owner) is only the starting point.
const STORAGE_KEY = 'personal-watchlist'
const MAX_SYMBOLS = 20
const QUOTE_REFRESH_MS = 20_000

function loadSaved(): WatchlistItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WatchlistItem[]) : null
  } catch {
    return null
  }
}

function save(items: WatchlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage unavailable (private mode etc.) — the list still works for this visit.
  }
}

interface Props {
  liveQuotes: Record<string, Quote>
  onSelectSymbol: (symbol: string) => void
}

export function Watchlist({ liveQuotes, onSelectSymbol }: Props) {
  const [items, setItems] = useState<WatchlistItem[]>(() => loadSaved() ?? [])
  const [polledQuotes, setPolledQuotes] = useState<Record<string, Quote>>({})
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  // First visit: start from the site owner's default list.
  useEffect(() => {
    if (loadSaved() !== null) return
    getWatchlist()
      .then((defaults) => {
        setItems(defaults)
        save(defaults)
      })
      .catch((err) => setError(err.message))
  }, [])

  // The live feed only covers the default list and market movers, so poll
  // prices for any other symbols this visitor added.
  const symbolKey = items.map((i) => i.symbol).join(',')
  useEffect(() => {
    if (!symbolKey) return
    let cancelled = false
    const refresh = () =>
      getQuotes(symbolKey.split(','))
        .then((quotes) => {
          if (!cancelled) setPolledQuotes(quotes)
        })
        .catch(() => {})
    refresh()
    const timer = window.setInterval(refresh, QUOTE_REFRESH_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [symbolKey])

  const quotes = useMemo(() => ({ ...polledQuotes, ...liveQuotes }), [polledQuotes, liveQuotes])

  function update(next: WatchlistItem[]) {
    setItems(next)
    save(next)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const symbol = input.trim().toUpperCase()
    if (!symbol) return
    if (items.some((i) => i.symbol === symbol)) {
      setError(`${symbol} is already in your watchlist.`)
      return
    }
    if (items.length >= MAX_SYMBOLS) {
      setError(`Your watchlist can hold up to ${MAX_SYMBOLS} symbols.`)
      return
    }
    setAdding(true)
    setError(null)
    try {
      const info = await lookupSymbol(symbol)
      update([...items, { symbol: info.symbol, name: info.name, added_at: new Date().toISOString() }])
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setAdding(false)
    }
  }

  function handleRemove(symbol: string) {
    update(items.filter((i) => i.symbol !== symbol))
  }

  return (
    <div className="panel">
      <div className="panel-title-row">
        <h2>My Watchlist</h2>
        <span className="panel-hint">Saved in this browser</span>
      </div>
      <form onSubmit={handleAdd} className="add-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add symbol, e.g. AAPL"
          maxLength={15}
        />
        <button type="submit" disabled={adding}>
          {adding ? 'Adding…' : 'Add'}
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
            const quote = quotes[item.symbol]
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
                    aria-label={`Remove ${item.symbol}`}
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
