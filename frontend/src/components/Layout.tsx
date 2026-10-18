import { Link, NavLink, Outlet } from 'react-router'
import { OWNER_NAME, SITE_NAME } from '../siteConfig'

// Clicking a dropdown item keeps focus inside the menu, which would hold it
// open via :focus-within; blur so it closes after navigating.
function closeMenu() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
}

export function Layout() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="site-name">
          {SITE_NAME}
        </Link>
        <nav className="site-nav">
          <NavLink to="/" end className="nav-link">
            Home
          </NavLink>
          <div className="nav-dropdown">
            <NavLink to="/stocks" className="nav-link" aria-haspopup="true">
              Stocks ▾
            </NavLink>
            <div className="nav-menu">
              <NavLink to="/stocks/dashboard" className="nav-menu-item" onClick={closeMenu}>
                Stock Trend Dashboard
              </NavLink>
            </div>
          </div>
          <NavLink to="/contact" className="nav-link">
            Contact
          </NavLink>
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        © {new Date().getFullYear()} {OWNER_NAME}. All rights reserved.
      </footer>
    </>
  )
}
