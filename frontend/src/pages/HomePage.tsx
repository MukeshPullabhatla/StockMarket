import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'
import { CONTACT, OWNER_NAME } from '../siteConfig'

const EXPERIENCE = [
  {
    company: 'United Wholesale Mortgage (UWM)',
    role: 'Software Developer III — AI Engineer',
    description:
      'Developing ChatUWM, an AI-powered chat platform that helps brokers, account executives, and underwriters manage loan data and process mortgage payments through natural conversation.',
  },
  {
    company: 'Rocket Companies',
    description: 'Built scalable web platforms in the mortgage tech space.',
  },
]

const SKILLS = [
  { group: 'AI / LLM platforms', items: ['Vertex AI', 'Azure AI', 'OpenAI', 'Claude'] },
  {
    group: 'Languages & frameworks',
    items: ['C#', '.NET', 'TypeScript', 'React', 'Python', 'FastAPI'],
  },
  {
    group: 'Cloud & infrastructure',
    items: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CircleCI'],
  },
  { group: 'Version control', items: ['GitHub', 'Bitbucket'] },
]

const DASHBOARD_HIGHLIGHTS = [
  'Live quotes, trend charts, market movers, and a personal watchlist',
  'Real-time price updates pushed over WebSockets',
  'AI assistant that calls live market-data tools before it answers, so every number is current',
  'React + TypeScript, FastAPI, and an LLM via the Groq API; deployed with Docker on Oracle Cloud with automatic HTTPS',
]

export function HomePage() {
  usePageTitle()

  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Software Developer III — AI Engineer</p>
        <h1>Hi, I'm {OWNER_NAME}</h1>
        <p className="lead">
          I build production conversational AI systems for the mortgage industry. My work
          focuses on integrating and orchestrating multiple AI platforms — Vertex AI, Azure AI,
          OpenAI, and Claude — into reliable, production-grade systems, backed by strong
          full-stack and cloud infrastructure engineering.
        </p>
        <div className="hero-actions">
          <Link to="/stocks/dashboard" className="button-link">
            Try the Stock Trend Dashboard
          </Link>
          <a href={CONTACT.linkedin} target="_blank" rel="noreferrer" className="button-link secondary">
            LinkedIn
          </a>
          <Link to="/contact" className="button-link secondary">
            Get in touch
          </Link>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">Experience</h2>
        <div className="card-grid">
          {EXPERIENCE.map((job) => (
            <div key={job.company} className="card">
              <h3>{job.company}</h3>
              {job.role && <p className="card-subtitle">{job.role}</p>}
              <p>{job.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">Featured project</h2>
        <Link to="/stocks/dashboard" className="card card-link">
          <h3>Stock Trend Dashboard</h3>
          <p className="card-subtitle">A live stock market dashboard with a built-in AI assistant</p>
          <ul className="highlight-list">
            {DASHBOARD_HIGHLIGHTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Link>
      </section>

      <section className="home-section">
        <h2 className="section-title">Skills</h2>
        <div className="card-grid">
          {SKILLS.map((skill) => (
            <div key={skill.group} className="card">
              <h3>{skill.group}</h3>
              <ul className="chip-list">
                {skill.items.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
