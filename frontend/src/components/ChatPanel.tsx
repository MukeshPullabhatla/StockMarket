import { useRef, useState } from 'react'
import { streamChat } from '../api/client'
import type { ChatMessage } from '../types'

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [statusLine, setStatusLine] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    })
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...nextMessages, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    setStatusLine(null)
    scrollToBottom()

    try {
      for await (const event of streamChat(nextMessages)) {
        if (event.type === 'text') {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: updated[updated.length - 1].content + event.text,
            }
            return updated
          })
          scrollToBottom()
        } else if (event.type === 'tool') {
          setStatusLine(`Looking up ${event.name.replace('get_', '').replace('_', ' ')}…`)
        } else if (event.type === 'error') {
          setStatusLine(null)
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: updated[updated.length - 1].content || `Error: ${event.error}`,
            }
            return updated
          })
        } else if (event.type === 'done') {
          setStatusLine(null)
        }
      }
    } catch (err) {
      setStatusLine(null)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : String(err)}` },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel chat-panel">
      <h2>Ask about the market</h2>
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <p className="muted">Ask things like "how is AAPL doing today?" or "what are the top movers?"</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <span className="chat-role">{m.role === 'user' ? 'You' : 'Assistant'}</span>
            <span className="chat-content">{m.content || (busy && i === messages.length - 1 ? '…' : '')}</span>
          </div>
        ))}
        {statusLine && <p className="muted status-line">{statusLine}</p>}
      </div>
      <form onSubmit={handleSend} className="chat-input-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a stock or the market…"
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
