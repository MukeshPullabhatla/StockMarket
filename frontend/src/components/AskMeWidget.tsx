import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { streamChat } from '../api/client'
import { useSpeechInput, useSpeechOutput } from '../hooks/useVoice'
import { PROFILE_PHOTO } from '../siteConfig'
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
  const [readAloud, setReadAloud] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const tts = useSpeechOutput()
  const mic = useSpeechInput((text) => ask(text, true))
  const { stop: stopListening } = mic
  const { cancel: cancelSpeech } = tts

  const close = useCallback(() => {
    stopListening()
    cancelSpeech()
    setOpen(false)
  }, [stopListening, cancelSpeech])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

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

  async function ask(question: string, fromVoice = false) {
    const text = question.trim()
    if (!text || busy) return

    // Talking to the assistant turns on spoken answers; typing keeps the current setting.
    const speak = tts.supported && (fromVoice || readAloud)
    if (fromVoice && !readAloud) setReadAloud(true)
    tts.cancel()
    mic.clearError()

    const history: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setBusy(true)
    scrollToBottom()

    try {
      for await (const event of streamChat(history, '/api/profile-chat')) {
        if (event.type === 'text') {
          setLastReply((content) => content + event.text)
          if (speak) tts.feed(event.text)
          scrollToBottom()
        } else if (event.type === 'error') {
          setLastReply((content) => content || `⚠️ ${event.error}`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setLastReply((content) => content || `⚠️ ${message}`)
    } finally {
      if (speak) tts.flush()
      setBusy(false)
      scrollToBottom()
    }
  }

  return (
    <>
      {open && (
        <section className="askme-panel" role="dialog" aria-label="Ask about Mukesh">
          <header className="askme-header">
            <div className="askme-avatar">
              <img src={PROFILE_PHOTO.small} alt="" width={128} height={128} />
              <span className="askme-avatar-spark" aria-hidden="true">
                ✨
              </span>
            </div>
            <div className="askme-heading">
              <h2>Ask about Mukesh</h2>
              <p>AI assistant · answers from his profile</p>
            </div>
            {tts.supported && (
              <button
                className={`askme-icon-btn${readAloud ? ' active' : ''}`}
                onClick={() => {
                  if (readAloud) tts.cancel()
                  setReadAloud((on) => !on)
                }}
                aria-pressed={readAloud}
                aria-label="Read answers aloud"
                title={readAloud ? 'Reading answers aloud — click to mute' : 'Read answers aloud'}
              >
                {readAloud ? '🔊' : '🔇'}
              </button>
            )}
            <button className="askme-close" onClick={close} aria-label="Close chat">
              ×
            </button>
          </header>

          <div className="askme-messages" ref={scrollRef}>
            <div className="chat-message assistant">
              <div className="chat-content">
                Hi! 👋 I can answer questions about Mukesh's experience, skills and projects.
                {mic.supported && " You can also tap 🎤 and talk to me — I'll answer out loud."}
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

          {(tts.speaking || mic.error || mic.listening) && (
            <div className="askme-status" role="status">
              {mic.error ? (
                <span className="askme-status-error">{mic.error}</span>
              ) : mic.phase === 'starting' ? (
                <span>Starting microphone… if your browser asks, click Allow.</span>
              ) : mic.phase === 'listening' ? (
                <>
                  <span className="rec-dot" aria-hidden="true" />
                  Listening — speak now
                </>
              ) : (
                <>
                  <span className="voice-bars" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                  Speaking…
                  <button type="button" className="askme-stop" onClick={tts.cancel}>
                    Stop
                  </button>
                </>
              )}
            </div>
          )}

          <form
            className="askme-form"
            onSubmit={(e) => {
              e.preventDefault()
              ask(input)
            }}
          >
            <input
              ref={inputRef}
              value={mic.listening ? mic.interim : input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mic.phase === 'starting'
                  ? 'Starting microphone…'
                  : mic.phase === 'listening'
                    ? 'Listening — speak now…'
                    : 'Ask a question…'
              }
              maxLength={1000}
              disabled={busy}
              readOnly={mic.listening}
            />
            {mic.supported && (
              <button
                type="button"
                className={`askme-mic${mic.listening ? ` ${mic.phase}` : ''}`}
                onClick={() => {
                  if (mic.listening) {
                    mic.stop()
                  } else {
                    tts.cancel()
                    mic.start()
                  }
                }}
                disabled={busy}
                aria-pressed={mic.listening}
                aria-label={mic.listening ? 'Stop listening' : 'Talk to the assistant'}
                title={mic.listening ? 'Stop listening' : 'Talk to the assistant'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </button>
            )}
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
              ➤
            </button>
          </form>
        </section>
      )}

      <button
        className={`askme-launcher${open ? ' open' : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-label={open ? 'Close chat' : 'Ask about me'}
      >
        {open ? (
          '×'
        ) : (
          <>
            <img className="askme-launcher-photo" src={PROFILE_PHOTO.small} alt="" width={128} height={128} />
            ✨ Ask about me
          </>
        )}
      </button>
    </>
  )
}
