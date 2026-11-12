import type { ChatMessage, HistoryPoint, MoverCategory, Quote, WatchlistItem } from '../types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export function getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  return request(`/api/quote?symbols=${symbols.join(',')}`)
}

export function getHistory(symbol: string, period = '1mo'): Promise<HistoryPoint[]> {
  return request(`/api/history/${symbol}?period=${period}`)
}

export function getMovers(category: MoverCategory): Promise<Quote[]> {
  return request(`/api/movers/${category}`)
}

export function getWatchlist(): Promise<WatchlistItem[]> {
  return request('/api/watchlist')
}

export function lookupSymbol(symbol: string): Promise<{ symbol: string; name: string | null }> {
  return request(`/api/symbol/${encodeURIComponent(symbol)}`)
}

export type ChatStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; name: string; input: unknown }
  | { type: 'error'; error: string }
  | { type: 'done' }

export function streamChat(messages: ChatMessage[], endpoint = '/api/chat'): AsyncGenerator<ChatStreamEvent> {
  return streamEvents(endpoint, { messages })
}

export type SmartWriteFormat = 'email' | 'text' | 'linkedin' | 'slack' | 'x'
export type SmartWriteTone = 'professional' | 'friendly' | 'concise' | 'persuasive' | 'apologetic' | 'enthusiastic'
export type SmartWriteLength = 'shorter' | 'same' | 'longer'

export interface SmartWriteRequest {
  text: string
  format: SmartWriteFormat
  tone: SmartWriteTone
  length: SmartWriteLength
  grammar_only: boolean
}

export function streamSmartWrite(req: SmartWriteRequest): AsyncGenerator<ChatStreamEvent> {
  return streamEvents('/api/smart-write', req)
}

/** POSTs JSON and yields the Server-Sent Events the backend streams back. */
async function* streamEvents(endpoint: string, payload: unknown): AsyncGenerator<ChatStreamEvent> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = Array.isArray(body.detail) ? 'Please check your input and try again.' : body.detail
    throw new Error(detail || `Request failed: ${res.status}`)
  }
  if (!res.body) throw new Error('No response body from the server')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const line = part.trim()
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload) continue
      yield JSON.parse(payload) as ChatStreamEvent
    }
  }
}

export function recordVisit(): Promise<{ total: number }> {
  return request('/api/visits', { method: 'POST' })
}

export async function transcribeAudio(audio: Blob): Promise<string> {
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': audio.type || 'audio/webm' },
    body: audio,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.detail || `Request failed: ${res.status}`)
  return (body.text ?? '').trim()
}
