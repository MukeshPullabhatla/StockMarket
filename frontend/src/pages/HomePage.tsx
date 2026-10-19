import { Link } from 'react-router'
import { TypingText } from '../components/TypingText'
import { usePageTitle } from '../hooks/usePageTitle'
import { CONTACT, OWNER_NAME, PROFILE_PHOTO } from '../siteConfig'

const TAGLINES = [
  'AI Engineer',
  'Conversational AI Builder',
  'LLM Orchestration',
  'Full-Stack Developer',
  'Cloud Infrastructure',
]

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

const AI_PLATFORMS = ['Vertex AI', 'Azure AI', 'OpenAI', 'Claude']

export function HomePage() {
  usePageTitle()

  return (
    <div className="page container">
      <section className="hero">
        <div className="hero-text">
          <p className="badge">
            <span className="live-dot" aria-hidden="true" />
            Software Developer III — AI Engineer
          </p>
          <h1>
            Hi, I'm <span className="gradient-text">{OWNER_NAME}</span>
          </h1>
          <p className="hero-tagline">
            <TypingText phrases={TAGLINES} />
          </p>
          <p className="lead">
            I build production conversational AI systems for the mortgage industry. My work
            focuses on integrating and orchestrating multiple AI platforms — Vertex AI, Azure AI,
            OpenAI, and Claude — into reliable, production-grade systems, backed by strong
            full-stack and cloud infrastructure engineering.
          </p>
          <div className="hero-actions">
            <Link to="/stocks/dashboard" className="button-link">
              Try the Stock Trend Dashboard <span aria-hidden="true">→</span>
            </Link>
            <a
              href={CONTACT.linkedin}
              target="_blank"
              rel="noreferrer"
              className="button-link secondary"
            >
              LinkedIn
            </a>
            <Link to="/contact" className="button-link secondary">
              Get in touch
            </Link>
          </div>
        </div>

        <div className="ai-core">
          <div className="ai-core-ring ring-1" aria-hidden="true" />
          <div className="ai-core-ring ring-2" aria-hidden="true" />
          <div className="ai-core-ring ring-3" aria-hidden="true" />
          <div className="ai-core-center">
            <img
              src={PROFILE_PHOTO.large}
              alt={`Photo of ${OWNER_NAME}`}
              width={480}
              height={480}
              fetchPriority="high"
            />
            <span className="ai-core-badge" aria-hidden="true">
              AI
            </span>
          </div>
          {AI_PLATFORMS.map((name, i) => (
            <span key={name} className={`ai-core-orbit orbit-${i + 1}`} aria-hidden="true">
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="home-section reveal">
        <p className="section-kicker">Where I've worked</p>
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

      <section className="home-section reveal">
        <p className="section-kicker">Built by me</p>
        <h2 className="section-title">Featured project</h2>
        <Link to="/stocks/dashboard" className="card card-link feature-card">
          <div>
            <h3>Stock Trend Dashboard</h3>
            <p className="card-subtitle">A live stock market dashboard with a built-in AI assistant</p>
            <ul className="highlight-list">
              {DASHBOARD_HIGHLIGHTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <span className="feature-cta">
            Open dashboard <span aria-hidden="true">→</span>
          </span>
        </Link>
      </section>

      <section className="home-section reveal">
        <p className="section-kicker">What I work with</p>
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
