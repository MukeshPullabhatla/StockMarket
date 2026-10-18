import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'

const STOCK_TOOLS = [
  {
    to: '/stocks/dashboard',
    title: 'Stock Trend Dashboard',
    description:
      'Live quotes, market movers, a personal watchlist, price charts, and an AI assistant that answers questions using live market data.',
    tags: ['Live data', 'AI assistant', 'Charts'],
  },
]

export function StocksPage() {
  usePageTitle('Stocks')

  return (
    <div className="page container">
      <header className="page-header">
        <p className="section-kicker">Tools</p>
        <h1>
          <span className="gradient-text">Stocks</span>
        </h1>
        <p className="lead">Market tools powered by live data and AI.</p>
      </header>
      <div className="card-grid">
        {STOCK_TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="card card-link reveal">
            <div className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <ul className="chip-list">
              {tool.tags.map((tag) => (
                <li key={tag} className="chip">
                  {tag}
                </li>
              ))}
            </ul>
            <span className="feature-cta">
              Open <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
