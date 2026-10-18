import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'

export function NotFoundPage() {
  usePageTitle('Page not found')

  return (
    <div className="page">
      <h1>Page not found</h1>
      <p className="lead">
        That page doesn't exist. <Link to="/">Go back home</Link>.
      </p>
    </div>
  )
}
