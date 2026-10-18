import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'

const STOCK_TOOLS = [
  {
    to: '/stocks/dashboard',
    title: 'Stock Trend Dashboard',
    description:
      'Live quotes, market movers, a personal watchlist, price charts, and an AI assistant that answers questions using live market data.',
  },
]

export function StocksPage() {
  usePageTitle('Stocks')

  return (
    <div className="page">
      <h1>Stocks</h1>
      <div className="card-grid">
        {STOCK_TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="card card-link">
            <h2>{tool.title}</h2>
            <p>{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
