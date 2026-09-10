export interface Quote {
  symbol: string
  name: string | null
  price: number | null
  previous_close: number | null
  change: number | null
  change_percent: number | null
  day_high: number | null
  day_low: number | null
  volume: number | null
  currency: string | null
}

export interface HistoryPoint {
  date: string
  close: number
}

export interface WatchlistItem {
  symbol: string
  name: string | null
  added_at: string
}

export type MoverCategory = 'gainers' | 'losers' | 'most_active'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
