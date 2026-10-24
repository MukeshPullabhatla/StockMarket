import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { PlatformDiagram } from '../components/PlatformDiagram'
import { TypingText } from '../components/TypingText'
import { usePageTitle } from '../hooks/usePageTitle'
import { CONTACT, OWNER_NAME, PROFILE_PHOTO } from '../siteConfig'

const TAGLINES = [
  'AI Engineer',
  'GenAI Platform Architecture',
  'Conversational AI Builder',
  'RAG & Knowledge Graphs',
  'Real-time Voice AI',
  'Full-Stack Developer',
]

const EXPERIENCE = [
  {
    company: 'United Wholesale Mortgage (UWM)',
    role: 'Software Developer III — AI Engineer',
    description:
      'Architecting and building ChatUWM and the GenAI platform behind it — conversational AI, RAG and knowledge-graph search, real-time voice agents, and shared AI tooling that helps brokers, account executives, and underwriters work with loan data through natural conversation.',
  },
  {
    company: 'Rocket Companies',
    description: 'Built scalable web platforms in the mortgage tech space.',
  },
]

type IconName = 'chat' | 'hub' | 'graph' | 'voice' | 'rules'

const BUILT = [
  {
    icon: 'chat' as IconName,
    title: 'ChatUWM — enterprise conversational AI',
    description:
      'Designed and built the platform end to end — core .NET API, real-time streaming layer, integration layer and React frontend — then extracted a reusable agent framework that now powers 4+ specialized AI agents.',
    tech: ['.NET', 'React', 'TypeScript', 'SignalR'],
  },
  {
    icon: 'hub' as IconName,
    title: 'GenAI microservices platform',
    description:
      'Designed the pattern GenAI services run on: a plugin-based gateway, a reusable "Starter Kit" service template, config and prompt management, and an evaluation framework that mutation-tests AI output quality. Early adopter of the Model Context Protocol (MCP).',
    tech: ['C#', 'Python', 'FastAPI', 'MCP', 'Docker', 'Kubernetes'],
  },
  {
    icon: 'graph' as IconName,
    title: 'RAG & knowledge-graph search',
    description:
      'Built the pipeline behind retrieval-augmented generation: document ingestion, enrichment, transformation and indexing into a knowledge graph, so AI answers are grounded in company content.',
    tech: ['Python', 'BigQuery', 'Pub/Sub', 'Cosmos DB (Gremlin)', 'Orkes Conductor'],
  },
  {
    icon: 'voice' as IconName,
    title: 'Real-time voice AI agent',
    description:
      'Worked on an LLM-powered phone agent: live telephony, speech-to-text, LLM reasoning and text-to-speech in a single real-time pipeline.',
    tech: ['Pipecat', 'Twilio', 'Deepgram', 'OpenAI / Gemini', 'ElevenLabs'],
  },
  {
    icon: 'rules' as IconName,
    title: 'Lending platform services',
    description:
      'Contributed to the rules-driven services behind loan origination — income calculation and loan validation on a rules engine, loan qualification, identity propagation and content delivery.',
    tech: ['C#', 'NRules', 'SQL Server', 'Redis'],
  },
]

const ICONS: Record<IconName, ReactNode> = {
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </svg>
  ),
  hub: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="5" r="2" />
      <circle cx="20" cy="5" r="2" />
      <circle cx="4" cy="19" r="2" />
      <circle cx="20" cy="19" r="2" />
      <path d="M5.6 6.4 9.8 10M18.4 6.4 14.2 10M5.6 17.6 9.8 14M18.4 17.6 14.2 14" />
    </svg>
  ),
  graph: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
  voice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10v4M7 7v10M11 4v16M15 8v8M19 11v2" />
    </svg>
  ),
  rules: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M5 21h14M5 8l-3 6a3 3 0 0 0 6 0L5 8zM19 8l-3 6a3 3 0 0 0 6 0l-3-6zM5 8h14" />
    </svg>
  ),
}

const SKILLS = [
  {
    group: 'AI / LLM',
    items: ['Vertex AI', 'Azure OpenAI', 'OpenAI', 'Gemini', 'Claude', 'RAG', 'MCP', 'Prompt engineering', 'Knowledge graphs', 'AI evaluation'],
  },
  { group: 'Voice AI', items: ['Pipecat', 'Deepgram', 'ElevenLabs', 'Twilio', 'Daily'] },
  { group: 'Languages', items: ['C#', 'TypeScript', 'JavaScript', 'Python'] },
  { group: 'Frontend', items: ['React', 'Vite', 'MUI', 'SignalR'] },
  { group: 'Backend', items: ['ASP.NET Core', 'FastAPI', 'Node.js', 'Domain-Driven Design', 'NRules'] },
  { group: 'Data & messaging', items: ['Kafka (Avro)', 'Pub/Sub', 'BigQuery', 'Orkes Conductor'] },
  { group: 'Data stores', items: ['Cosmos DB (Gremlin)', 'Redis', 'SQL Server'] },
  {
    group: 'Cloud & DevOps',
    items: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Helm', 'Terraform', 'Jenkins', 'CircleCI', 'nginx'],
  },
  { group: 'Testing & quality', items: ['xUnit', 'Vitest', 'Pytest', 'Stryker mutation testing'] },
  { group: 'Security & tools', items: ['JWT', 'Active Directory', 'GitHub', 'Bitbucket'] },
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
            I design and build production GenAI and conversational AI platforms for the mortgage
            industry — from architecture to live deployment. At UWM I architected ChatUWM and the
            GenAI microservices it runs on: LLM orchestration across Vertex AI, Azure OpenAI,
            OpenAI, Gemini and Claude, RAG and knowledge-graph search, real-time voice agents, and
            the shared libraries other teams build on.
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
        <p className="section-kicker">At work</p>
        <h2 className="section-title">What I've built</h2>
        <div className="card-grid built-grid">
          {BUILT.map((item) => (
            <div key={item.title} className="card built-card">
              <div className="card-icon" aria-hidden="true">
                {ICONS[item.icon]}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <ul className="chip-list">
                {item.tech.map((t) => (
                  <li key={t} className="chip">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="home-section reveal">
        <p className="section-kicker">Architecture</p>
        <h2 className="section-title">How I build GenAI platforms</h2>
        <p className="section-intro">
          A simplified view of the pattern: every AI experience goes through one gateway that
          routes to the right models and knowledge, on a shared foundation for reliability,
          messaging and quality.
        </p>
        <PlatformDiagram />
      </section>

      <section className="home-section reveal">
        <p className="section-kicker">Side project</p>
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
