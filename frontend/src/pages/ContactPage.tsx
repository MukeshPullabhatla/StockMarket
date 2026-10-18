import type { ReactNode } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import { CONTACT } from '../siteConfig'

const stripProtocol = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '')

const ICONS: Record<string, ReactNode> = {
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export function ContactPage() {
  usePageTitle('Contact')

  const items = [
    { key: 'email', label: 'Email', href: `mailto:${CONTACT.email}`, text: CONTACT.email, external: false },
    { key: 'linkedin', label: 'LinkedIn', href: CONTACT.linkedin, text: stripProtocol(CONTACT.linkedin), external: true },
    { key: 'github', label: 'GitHub', href: CONTACT.github, text: stripProtocol(CONTACT.github), external: true },
  ]

  return (
    <div className="page container">
      <header className="page-header">
        <p className="section-kicker">Say hello</p>
        <h1>
          Let's <span className="gradient-text">connect</span>
        </h1>
        <p className="lead">Feel free to reach out — I'd be happy to hear from you.</p>
      </header>
      <ul className="contact-list">
        {items.map((item) => (
          <li key={item.key} className="reveal">
            <a
              href={item.href}
              className="card card-link contact-card"
              {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
            >
              <div className="card-icon" aria-hidden="true">
                {ICONS[item.key]}
              </div>
              <h3>{item.label}</h3>
              <span className="contact-value">{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
