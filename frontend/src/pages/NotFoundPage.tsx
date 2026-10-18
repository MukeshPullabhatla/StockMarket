import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Page not found')

  return (
    <div className="page container">
      <header className="page-header">
        <p className="section-kicker">Error 404</p>
        <h1>
          Page <span className="gradient-text">not found</span>
        </h1>
        <p className="lead">That page doesn't exist.</p>
        <Link to="/" className="button-link">
          Go back home
        </Link>
      </header>
    </div>
  )
}
