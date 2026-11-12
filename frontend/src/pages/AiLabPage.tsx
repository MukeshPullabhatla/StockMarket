import { Link } from 'react-router'
import { usePageTitle } from '../hooks/usePageTitle'

const AI_TOOLS = [
  {
    to: '/ai-lab/smart-writer',
    title: 'Smart Writer',
    description:
      'Turn a rough draft into a polished email, text, LinkedIn post, Slack message or X post — in the tone and length you choose. You can even dictate it.',
    tags: ['Rewriting', 'Tone control', 'Voice dictation'],
  },
]

export function AiLabPage() {
  usePageTitle('AI Lab')

  return (
    <div className="page container">
      <header className="page-header">
        <p className="section-kicker">Experiments</p>
        <h1>
          <span className="gradient-text">AI Lab</span>
        </h1>
        <p className="lead">Hands-on AI tools you can try right now — built and hosted by me.</p>
      </header>
      <div className="card-grid">
        {AI_TOOLS.map((tool) => (
          <Link key={tool.to} to={tool.to} className="card card-link reveal">
            <div className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
