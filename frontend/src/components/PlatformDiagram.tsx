// A generic, non-confidential view of how the GenAI platforms Mukesh builds
// fit together. Plain HTML (not an image) so it reflows on small screens.

const EXPERIENCES = [
  { title: 'Conversational chat', detail: 'AI agents on a shared framework' },
  { title: 'Voice agents', detail: 'Real-time AI phone calls' },
  { title: 'AI writing & tools', detail: 'Self-service AI tooling' },
]

const CAPABILITIES = [
  { title: 'LLMs', detail: 'Vertex AI · Azure OpenAI · OpenAI · Gemini · Claude' },
  { title: 'RAG pipeline', detail: 'Ingest → enrich → transform → index' },
  { title: 'Knowledge graph', detail: 'Cosmos DB (Gremlin) search' },
  { title: 'Speech', detail: 'Deepgram STT · ElevenLabs TTS' },
]

const FOUNDATION = [
  'Resilient HTTP & retries',
  'Redis caching',
  'Kafka + Avro schemas',
  'Orkes Conductor workflows',
  'AI quality evaluation',
]

function Connector() {
  return (
    <div className="arch-link" aria-hidden="true">
      <span />
    </div>
  )
}

export function PlatformDiagram() {
  return (
    <figure className="arch" aria-label="Diagram of a GenAI platform: apps connect through a gateway to LLMs, a RAG pipeline, a knowledge graph and speech services, on a shared foundation">
      <div className="arch-col">
        <p className="arch-label">Experiences</p>
        {EXPERIENCES.map((node) => (
          <div key={node.title} className="arch-node">
            <strong>{node.title}</strong>
            <span>{node.detail}</span>
          </div>
        ))}
      </div>

      <Connector />

      <div className="arch-col arch-center">
        <p className="arch-label">Orchestration</p>
        <div className="arch-node arch-core-node">
          <strong>GenAI Gateway</strong>
          <span>Plugin-based routing</span>
          <span>Model Context Protocol (MCP)</span>
          <span>Config & prompt management</span>
        </div>
      </div>

      <Connector />

      <div className="arch-col">
        <p className="arch-label">Capabilities</p>
        {CAPABILITIES.map((node) => (
          <div key={node.title} className="arch-node">
            <strong>{node.title}</strong>
            <span>{node.detail}</span>
          </div>
        ))}
      </div>

      <div className="arch-foundation">
        <p className="arch-label">Shared foundation</p>
        <ul className="chip-list">
          {FOUNDATION.map((item) => (
            <li key={item} className="chip">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}
