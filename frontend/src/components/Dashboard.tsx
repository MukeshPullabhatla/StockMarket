import { useState } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import { usePriceStream } from '../hooks/usePriceStream'
import { ChatPanel } from './ChatPanel'
import { MarketMovers } from './MarketMovers'
import { StockChart } from './StockChart'
import { Watchlist } from './Watchlist'

export function Dashboard() {
  usePageTitle('Stock Trend Dashboard')
  const liveQuotes = usePriceStream()
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  return (
    <div className="dashboard container">
      <header className="app-header">
        <p className="eyebrow">
          <span className="live-dot" aria-hidden="true" /> Live market data
        </p>
        <h1>
          Stock Trend <span className="gradient-text">Dashboard</span>
        </h1>
      </header>
      <div className="dashboard-grid">
        <div className="dashboard-column">
          <MarketMovers liveQuotes={liveQuotes} onSelectSymbol={setSelectedSymbol} />
          <Watchlist liveQuotes={liveQuotes} onSelectSymbol={setSelectedSymbol} />
        </div>
        <div className="dashboard-column">
          <StockChart symbol={selectedSymbol} />
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}
