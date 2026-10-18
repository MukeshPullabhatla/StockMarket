import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat } from '../api/client'
import type { ChatMessage } from '../types'

const SUGGESTIONS = [
  'What does Mukesh work on?',
  'Which AI platforms has he used?',
  'Tell me about the Stock Trend Dashboard',
  'How can I contact him?',
]

// Floating "Ask about me" assistant, answering from the backend's profile.md.
export function AskMeWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
    })
  }

  function setLastReply(update: (content: string) => string) {
    setMessages((prev) => {
      const next = [...prev]
      const last = next[next.length - 1]
      next[next.length - 1] = { role: 'assistant', content: update(last?.content ?? '') }
      return next
    })
  }

  async function ask(question: string) {
    const text = question.trim()
    if (!text || busy) return

    const history: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    scrollToBottom()

    try {
      for await (const event of streamChat(history, '/api/profile-chat')) {
        if (event.type === 'text') {
          setLastReply((content) => content + event.text)
          scrollToBottom()
        } else if (event.type === 'error') {
          setLastReply((content) => content || `⚠️ ${event.error}`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setLastReply((content) => content || `⚠️ ${message}`)
    } finally {
      setBusy(false)
      scrollToBottom()
    }
  }

  return (
    <>
      {open && (
        <section className="askme-panel" role="dialog" aria-label="Ask about Mukesh">
          <header className="askme-header">
            <div className="askme-avatar" aria-hidden="true">
              ✨
            </div>
            <div className="askme-heading">
              <h2>Ask about Mukesh</h2>
              <p>AI assistant · answers from his profile</p>
            </div>
            <button className="askme-close" onClick={() => setOpen(false)} aria-label="Close chat">
              ×
            </button>
          </header>

          <div className="askme-messages" ref={scrollRef}>
            <div className="chat-message assistant">
              <div className="chat-content">
                Hi! 👋 I can answer questions about Mukesh's experience, skills and projects.
              </div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`chat-message ${m.role}`}>
                <div className="chat-content">
                  {m.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  ) : (
                    <span className="typing-dots" aria-label="Thinking">
                      <span />
                      <span />
                      <span />
                    </span>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="askme-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="askme-chip" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="askme-form"
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              maxLength={1000}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
              ➤
            </button>
          </form>
        </section>
      )}

      <button
        className={`askme-launcher${open ? ' open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close chat' : 'Ask about me'}
      >
        {open ? '×' : '✨ Ask about me'}
      </button>
    </>
  )
}
