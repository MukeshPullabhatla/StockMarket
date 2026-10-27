import { useCallback, useEffect, useRef, useState } from 'react'

// Browser speech APIs: SpeechRecognition (Chrome, Edge, Safari) for listening and
// speechSynthesis (all modern browsers) for talking. Free and on-device/browser-provided,
// so voice mode costs nothing beyond the normal chat request.

interface RecognitionResult {
  isFinal: boolean
  0: { transcript: string }
}

interface RecognitionEvent {
  resultIndex: number
  results: ArrayLike<RecognitionResult>
}

interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  onaudiostart: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => Recognition

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

const RECOGNITION_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser (address bar) to talk to me.',
  'service-not-allowed': 'Microphone access is blocked. Allow it in your browser (address bar) to talk to me.',
  'no-speech': "I didn't hear anything. Tap 🎤, wait for \"Listening\", then speak.",
  'audio-capture': 'No microphone found. Check that one is connected and enabled.',
  network: "The browser's voice service is unreachable (a VPN or firewall can block it). Try typing instead.",
  'language-not-supported': "Voice input isn't available for this language in your browser.",
}

/**
 * Speech-to-text: one utterance per start(); calls onFinal with the transcript.
 * phase is 'starting' until the browser is actually capturing audio (this can take
 * several seconds while it connects or waits for permission), then 'listening'.
 */
export function useSpeechInput(onFinal: (text: string) => void) {
  const Ctor = getRecognitionCtor()
  const [phase, setPhase] = useState<'idle' | 'starting' | 'listening'>('idle')
  const listening = phase !== 'idle'
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<Recognition | null>(null)
  const onFinalRef = useRef(onFinal)
  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  const stop = useCallback(() => recognitionRef.current?.stop(), [])

  const start = useCallback(() => {
    if (!Ctor || recognitionRef.current) return
    const recognition = new Ctor()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    let finalText = ''

    recognition.onaudiostart = () => setPhase('listening')
    recognition.onresult = (e) => {
      setPhase('listening')
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else live += result[0].transcript
      }
      setInterim((finalText + live).trim())
    }
    recognition.onerror = (e) => {
      if (e.error === 'aborted') return
      console.warn('Speech recognition error:', e.error)
      setError(RECOGNITION_ERRORS[e.error] ?? "Sorry, I couldn't hear that. Please try again.")
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setPhase('idle')
      setInterim('')
      const text = finalText.trim()
      if (text) onFinalRef.current(text)
    }

    setError(null)
    setInterim('')
    recognitionRef.current = recognition
    setPhase('starting')
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setPhase('idle')
      setError("Couldn't start the microphone. Please try again.")
    }
  }, [Ctor])

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const clearError = useCallback(() => setError(null), [])

  return { supported: Ctor !== null, listening, phase, interim, error, clearError, start, stop }
}

/** Turns markdown chat text into something natural to read aloud. */
export function toSpeakable(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](url) -> text
    .replace(/https?:\/\/(?:www\.)?([^/\s]+)\S*/g, '$1') // bare URLs -> just the domain
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, '') // table separator rows
    .replace(/\|/g, ', ')
    .replace(/^\s*[-*+]\s+/gm, '') // bullets
    .replace(/^\s*#+\s*/gm, '') // headings
    .replace(/[*_`~>#]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '') // stray commas left by table pipes
}

function pickVoice(offlineOnly = false): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('en') && (!offlineOnly || v.localService))
  const preferred = [/natural/i, /neural/i, /google us english/i, /samantha/i, /aria|jenny|guy|andrew/i]
  for (const pattern of preferred) {
    const match = voices.find((v) => pattern.test(v.name) && v.lang.toLowerCase() === 'en-us')
    if (match) return match
  }
  return voices.find((v) => v.lang.toLowerCase() === 'en-us') ?? voices[0] ?? null
}

/** Text-to-speech that can be fed a streaming answer and speaks it sentence by sentence. */
export function useSpeechOutput() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const bufferRef = useRef('')
  const pendingRef = useRef(0)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!supported) return
    const load = () => {
      voiceRef.current = pickVoice()
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  const say = useCallback(
    (sentence: string) => {
      const text = toSpeakable(sentence)
      if (!supported || !text) return
      const speakWith = (voice: SpeechSynthesisVoice | null, isRetry: boolean) => {
        const utterance = new SpeechSynthesisUtterance(text)
        if (voice) utterance.voice = voice
        utterance.rate = 1.03
        pendingRef.current += 1
        setSpeaking(true)
        const done = () => {
          pendingRef.current = Math.max(0, pendingRef.current - 1)
          if (pendingRef.current === 0) setSpeaking(false)
        }
        utterance.onend = done
        utterance.onerror = (e) => {
          const cancelled = e.error === 'interrupted' || e.error === 'canceled'
          if (!cancelled) console.warn('Speech synthesis error:', e.error)
          // An online voice can fail when its service is unreachable; retry offline once.
          if (!cancelled && !isRetry && voice && !voice.localService) {
            const offline = pickVoice(true)
            voiceRef.current = offline
            speakWith(offline, true)
          }
          done()
        }
        window.speechSynthesis.speak(utterance)
      }
      speakWith(voiceRef.current, false)
    },
    [supported],
  )

  /** Feed streamed text; complete sentences are spoken right away. */
  const feed = useCallback(
    (chunk: string) => {
      bufferRef.current += chunk
      const parts = bufferRef.current.split(/(?<=[.!?:])\s+|\n+/)
      bufferRef.current = parts.pop() ?? ''
      for (const part of parts) say(part)
    },
    [say],
  )

  /** Speak whatever is left once the answer has finished streaming. */
  const flush = useCallback(() => {
    const rest = bufferRef.current
    bufferRef.current = ''
    say(rest)
  }, [say])

  const cancel = useCallback(() => {
    bufferRef.current = ''
    pendingRef.current = 0
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, feed, flush, cancel }
}
