import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../api/client'

// Voice input: the browser's own SpeechRecognition where it exists (desktop Chrome/Edge,
// Safari), otherwise record the question and transcribe it on the server (Groq Whisper) —
// needed on iPhone, where every browser except Safari lacks speech recognition.
// Voice output: the browser's speechSynthesis.

export type VoicePhase = 'idle' | 'starting' | 'listening' | 'transcribing'

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
  const [phase, setPhase] = useState<VoicePhase>('idle')
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

const NO_SPEECH = "I didn't hear anything. Tap 🎤 and speak — I'll stop listening when you pause."
const MAX_RECORDING_MS = 30_000
const SILENCE_AFTER_SPEECH_MS = 1400
const NO_SPEECH_TIMEOUT_MS = 7000
const MIN_AUDIO_BYTES = 1000
const MIN_ANALYSED_FOR_SILENCE = 50 // ~5 s of actual 100 ms checks before concluding "no speech"
const MIN_ANALYSED_ON_TAP = 10

function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus']
  return candidates.find((t) => MediaRecorder.isTypeSupported?.(t))
}

/**
 * Speech-to-text by recording: works in any browser with a microphone API.
 * Stops automatically after a pause in speech (or 30 s), then transcribes on the server.
 */
export function useRecordedSpeechInput(onFinal: (text: string) => void) {
  const supported =
    typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'
  const [phase, setPhase] = useState<VoicePhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const stoppedByUserRef = useRef(false)
  const onFinalRef = useRef(onFinal)
  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  // Automatic stop (pause detected, timeout or max length).
  const finishRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }, [])

  // The visitor tapped the mic to finish.
  const stop = useCallback(() => {
    stoppedByUserRef.current = true
    finishRecording()
  }, [finishRecording])

  const start = useCallback(async () => {
    if (!supported || recorderRef.current) return
    setError(null)
    stoppedByUserRef.current = false
    setPhase('starting')

    // Create the audio context inside the tap (iOS only allows it during a user gesture).
    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    const ctx = AudioCtx ? new AudioCtx() : null

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (err) {
      void ctx?.close()
      setPhase('idle')
      const name = err instanceof DOMException ? err.name : ''
      setError(
        name === 'NotAllowedError'
          ? 'Microphone access is blocked. Allow it in your browser settings to talk to me.'
          : name === 'NotFoundError'
            ? 'No microphone found. Check that one is connected and enabled.'
            : "Couldn't start the microphone. Please try again.",
      )
      return
    }

    const mimeType = pickMimeType()
    const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 })
    const chunks: Blob[] = []
    let heardSpeech = false
    let voiceDetection = false
    let analysed = 0
    let tickTimer = 0

    // Simple voice-activity detection: stop after a pause once speech was heard.
    if (ctx) {
      void ctx.resume()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      ctx.createMediaStreamSource(stream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      const startedAt = performance.now()
      let lastLoud = startedAt
      const tick = () => {
        voiceDetection = ctx.state === 'running'
        if (voiceDetection) {
          analyser.getByteTimeDomainData(samples)
          analysed += 1
          let sum = 0
          for (const v of samples) sum += ((v - 128) / 128) ** 2
          const now = performance.now()
          if (Math.sqrt(sum / samples.length) > 0.035) {
            heardSpeech = true
            lastLoud = now
          }
          if (heardSpeech && now - lastLoud > SILENCE_AFTER_SPEECH_MS) return finishRecording()
          // Only give up once enough audio was actually analysed — a busy page can delay
          // these checks, and wall-clock time alone could miss the speech entirely.
          if (!heardSpeech && now - startedAt > NO_SPEECH_TIMEOUT_MS && analysed >= MIN_ANALYSED_FOR_SILENCE) {
            return finishRecording()
          }
        }
        tickTimer = window.setTimeout(tick, 100)
      }
      tickTimer = window.setTimeout(tick, 300)
    }
    const maxTimer = window.setTimeout(finishRecording, MAX_RECORDING_MS)

    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    recorder.onstop = async () => {
      window.clearTimeout(tickTimer)
      window.clearTimeout(maxTimer)
      stream.getTracks().forEach((t) => t.stop())
      void ctx?.close()
      recorderRef.current = null

      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
      // Discard only when detection reliably heard nothing; otherwise let the server decide.
      // Trust the detector once it has analysed enough audio: ~5 s for an automatic stop,
      // ~1 s when the visitor tapped stop (they may have spoken briefly).
      const enoughAnalysed = analysed >= (stoppedByUserRef.current ? MIN_ANALYSED_ON_TAP : MIN_ANALYSED_FOR_SILENCE)
      const confidentlySilent = voiceDetection && !heardSpeech && enoughAnalysed
      // A near-empty file holds no real audio (Whisper would invent text for it).
      if (confidentlySilent || blob.size < MIN_AUDIO_BYTES) {
        setPhase('idle')
        setError(NO_SPEECH)
        return
      }
      setPhase('transcribing')
      try {
        const text = await transcribeAudio(blob)
        setPhase('idle')
        if (text) onFinalRef.current(text)
        else setError(NO_SPEECH)
      } catch (err) {
        setPhase('idle')
        setError(err instanceof Error ? err.message : "Couldn't transcribe that. Please try again.")
      }
    }

    recorderRef.current = recorder
    recorder.start()
    setPhase('listening')
  }, [supported, finishRecording])

  useEffect(() => () => recorderRef.current?.stop(), [])

  const clearError = useCallback(() => setError(null), [])

  return { supported, listening: phase !== 'idle', phase, interim: '', error, clearError, start, stop }
}

/** Voice input using the best method this browser supports. */
export function useVoiceInput(onFinal: (text: string) => void) {
  const native = useSpeechInput(onFinal)
  const recorded = useRecordedSpeechInput(onFinal)
  return native.supported ? native : recorded
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

  /**
   * iOS only lets a page speak if speech was first started directly by a tap. Call this
   * from tap handlers; a silent utterance unlocks speech for answers that arrive later.
   */
  const unlockedRef = useRef(false)
  const unlock = useCallback(() => {
    if (!supported || unlockedRef.current) return
    const silent = new SpeechSynthesisUtterance(' ')
    silent.volume = 0
    window.speechSynthesis.speak(silent)
    unlockedRef.current = true
  }, [supported])

  const cancel = useCallback(() => {
    bufferRef.current = ''
    pendingRef.current = 0
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, feed, flush, cancel, unlock }
}
