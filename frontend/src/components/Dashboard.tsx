import { useState } from 'react'
import { usePriceStream } from '../hooks/usePriceStream'
import { ChatPanel } from './ChatPanel'
import { MarketMovers } from './MarketMovers'
import { StockChart } from './StockChart'
import { Watchlist } from './Watchlist'

export function Dashboard() {
  const liveQuotes = usePriceStream()
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  return (
    <div className="dashboard">
      <header className="app-header">
        <h1>Stock Trend Dashboard</h1>
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
