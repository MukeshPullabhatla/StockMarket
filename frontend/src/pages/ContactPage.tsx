import { usePageTitle } from '../hooks/usePageTitle'
import { CONTACT } from '../siteConfig'

export function ContactPage() {
  usePageTitle('Contact')

  return (
    <div className="page">
      <h1>Contact</h1>
      <p className="lead">Feel free to reach out — I'd be happy to hear from you.</p>
      <ul className="contact-list">
        <li className="card">
          <h2>Email</h2>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </li>
        <li className="card">
          <h2>LinkedIn</h2>
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
            {CONTACT.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        </li>
        <li className="card">
          <h2>GitHub</h2>
          <a href={CONTACT.github} target="_blank" rel="noreferrer">
            {CONTACT.github.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        </li>
      </ul>
    </div>
  )
}
