import { useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  streamSmartWrite,
  type SmartWriteFormat,
  type SmartWriteLength,
  type SmartWriteTone,
} from '../api/client'
import { usePageTitle } from '../hooks/usePageTitle'
import { useVoiceInput } from '../hooks/useVoice'

const MAX_CHARS = 3000

const FORMATS: { value: SmartWriteFormat; label: string; limit?: number }[] = [
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text message', limit: 160 },
  { value: 'linkedin', label: 'LinkedIn post' },
  { value: 'slack', label: 'Slack / Teams' },
  { value: 'x', label: 'X post', limit: 280 },
]

const TONES: { value: SmartWriteTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'concise', label: 'Concise' },
  { value: 'persuasive', label: 'Persuasive' },
  { value: 'apologetic', label: 'Apologetic' },
  { value: 'enthusiastic', label: 'Enthusiastic' },
]

const LENGTHS: { value: SmartWriteLength; label: string }[] = [
  { value: 'shorter', label: 'Shorter' },
  { value: 'same', label: 'Same' },
  { value: 'longer', label: 'Longer' },
]

const EXAMPLES = [
  {
    label: 'Reschedule a meeting',
    text: "hey cant make the meeting tmrw, can we move it to thurs? sorry",
    format: 'email' as SmartWriteFormat,
    tone: 'apologetic' as SmartWriteTone,
  },
  {
    label: 'Announce a launch',
    text: 'we just launched a new feature, you can now talk to the AI assistant on our site and it answers out loud. took a few weeks. works on phones too',
    format: 'linkedin' as SmartWriteFormat,
    tone: 'enthusiastic' as SmartWriteTone,
  },
  {
    label: 'Status update',
    text: 'finished the api changes, tests passing, still waiting on review from design for the new page. should be done by friday if nothing blocks',
    format: 'slack' as SmartWriteFormat,
    tone: 'concise' as SmartWriteTone,
  },
]

interface OptionGroupProps<T extends string> {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}

function OptionGroup<T extends string>({ label, options, value, onChange, disabled }: OptionGroupProps<T>) {
  return (
    <div className="sw-option">
      <span className="sw-option-label" id={`sw-${label}`}>
        {label}
      </span>
      <div className="sw-pills" role="radiogroup" aria-labelledby={`sw-${label}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            className={`sw-pill${o.value === value ? ' active' : ''}`}
            onClick={() => onChange(o.value)}
            disabled={disabled}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SmartWriterPage() {
  usePageTitle('Smart Writer')
  const [text, setText] = useState('')
  const [format, setFormat] = useState<SmartWriteFormat>('email')
  const [tone, setTone] = useState<SmartWriteTone>('professional')
  const [length, setLength] = useState<SmartWriteLength>('same')
  const [grammarOnly, setGrammarOnly] = useState(false)
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  // Dictation appends what was said to the draft.
  const mic = useVoiceInput((spoken) => setText((t) => (t ? `${t.trimEnd()} ${spoken}` : spoken).slice(0, MAX_CHARS)))

  const limit = FORMATS.find((f) => f.value === format)?.limit
  const overLimit = !grammarOnly && limit !== undefined && output.length > limit

  async function rewrite() {
    if (!text.trim() || busy) return
    setBusy(true)
    setError(null)
    setOutput('')
    setCopied(false)
    requestAnimationFrame(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    try {
      for await (const event of streamSmartWrite({ text, format, tone, length, grammar_only: grammarOnly })) {
        if (event.type === 'text') setOutput((o) => o + event.text)
        else if (event.type === 'error') setError(event.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output.trim())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Copy failed — select the text and copy it manually.')
    }
  }

  return (
    <div className="page container">
      <header className="page-header">
        <p className="section-kicker">
          <Link to="/ai-lab" className="crumb">
            AI Lab
          </Link>{' '}
          / Tool
        </p>
        <h1>
          Smart <span className="gradient-text">Writer</span>
        </h1>
        <p className="lead">
          Paste a rough draft, pick where it's going, and get a polished version in seconds.
        </p>
      </header>

      <div className="sw-layout">
        <section className="card sw-input" aria-label="Your draft">
          <div className="sw-field-head">
            <label htmlFor="sw-draft" className="sw-option-label">
              Your draft
            </label>
            <span className={`sw-count${text.length > MAX_CHARS * 0.9 ? ' warn' : ''}`}>
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
          <div className="sw-textarea-wrap">
            <textarea
              id="sw-draft"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="e.g. hey cant make the meeting tmrw, can we move it to thurs? sorry"
              rows={7}
              disabled={busy}
            />
            {mic.supported && (
              <button
                type="button"
                className={`sw-mic${mic.listening ? ` ${mic.phase}` : ''}`}
                onClick={() => (mic.listening ? mic.stop() : void mic.start())}
                disabled={busy || mic.phase === 'transcribing'}
                aria-pressed={mic.listening}
                aria-label={mic.listening ? 'Stop dictation' : 'Dictate your draft'}
                title={mic.listening ? 'Stop dictation' : 'Dictate your draft'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
              </button>
            )}
          </div>
          {(mic.listening || mic.error) && (
            <p className={`sw-voice-status${mic.error ? ' error' : ''}`} role="status">
              {mic.error ??
                (mic.phase === 'starting'
                  ? 'Starting microphone… if your browser asks, click Allow.'
                  : mic.phase === 'transcribing'
                    ? 'Transcribing…'
                    : `Listening — speak now${mic.interim ? `: “${mic.interim}”` : ''}`)}
            </p>
          )}

          <div className="sw-examples">
            <span className="sw-option-label">Try an example:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className="askme-chip"
                disabled={busy}
                onClick={() => {
                  setText(ex.text)
                  setFormat(ex.format)
                  setTone(ex.tone)
                  setGrammarOnly(false)
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          <label className="sw-toggle">
            <input type="checkbox" checked={grammarOnly} onChange={(e) => setGrammarOnly(e.target.checked)} disabled={busy} />
            <span>Fix grammar only (keep my wording)</span>
          </label>

          <div className={`sw-options${grammarOnly ? ' muted-options' : ''}`}>
            <OptionGroup label="Format" options={FORMATS} value={format} onChange={setFormat} disabled={busy || grammarOnly} />
            <OptionGroup label="Tone" options={TONES} value={tone} onChange={setTone} disabled={busy || grammarOnly} />
            <OptionGroup label="Length" options={LENGTHS} value={length} onChange={setLength} disabled={busy || grammarOnly} />
          </div>

          <button type="button" className="sw-submit" onClick={rewrite} disabled={busy || !text.trim()}>
            {busy ? 'Writing…' : grammarOnly ? '✨ Fix grammar' : '✨ Rewrite'}
          </button>
          <p className="sw-note">Drafts aren't stored, but they're sent to an AI provider — don't paste confidential information.</p>
        </section>

        <section className="card sw-output" aria-label="Result" ref={outputRef}>
          <div className="sw-field-head">
            <span className="sw-option-label">Result</span>
            <div className="sw-actions">
              <button type="button" className="sw-action" onClick={copy} disabled={!output || busy}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <button type="button" className="sw-action" onClick={rewrite} disabled={!text.trim() || busy}>
                Try again
              </button>
            </div>
          </div>
          <div className="sw-result" aria-live="polite">
            {output ? (
              output
            ) : busy ? (
              <span className="typing-dots" aria-label="Writing">
                <span />
                <span />
                <span />
              </span>
            ) : (
              <span className="muted">Your polished text will appear here.</span>
            )}
          </div>
          {error && <p className="error">⚠️ {error}</p>}
          {output && (
            <p className={`sw-count result-count${overLimit ? ' over' : ''}`}>
              {output.trim().length.toLocaleString()} characters
              {limit !== undefined && !grammarOnly && ` · limit ${limit}`}
              {overLimit && ' — over the limit, try "Shorter"'}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
