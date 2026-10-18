import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { OWNER_NAME, SITE_NAME } from '../siteConfig'
import { NeuralBackground } from './NeuralBackground'
import { VisitorCounter } from './VisitorCounter'

// Clicking a dropdown item keeps focus inside the menu, which would hold it
// open via :focus-within; blur so it closes after navigating.
function closeMenu() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

// Fade/slide in every `.reveal` element on the current page as it scrolls into view.
function useScrollReveal(pathname: string) {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.site-main .reveal')
    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('visible'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pathname])
}

export function Layout() {
  const { pathname } = useLocation()
  useScrollReveal(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <>
      <NeuralBackground calm={pathname.startsWith('/stocks/')} />
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="site-name">
            <span className="site-logo" aria-hidden="true" />
            {SITE_NAME}
          </Link>
          <nav className="site-nav">
            <NavLink to="/" end className="nav-link">
              Home
            </NavLink>
            <div className="nav-dropdown">
              <NavLink to="/stocks" className="nav-link" aria-haspopup="true">
                Stocks <span className="nav-caret">▾</span>
              </NavLink>
              <div className="nav-menu">
                <NavLink to="/stocks/dashboard" className="nav-menu-item" onClick={closeMenu}>
                  <span className="nav-menu-title">Stock Trend Dashboard</span>
                  <span className="nav-menu-desc">Live markets + AI assistant</span>
                </NavLink>
              </div>
            </div>
            <NavLink to="/contact" className="nav-link">
              Contact
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <div className="container">
          <VisitorCounter />
          <p>
            © {new Date().getFullYear()} {OWNER_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  )
}
