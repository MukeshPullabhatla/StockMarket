import { useEffect, useRef, useState } from 'react'
import type { Quote } from '../types'

export function usePriceStream() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const reconnectTimer = useRef<number | null>(null)

  useEffect(() => {
    let socket: WebSocket | null = null
    let cancelled = false

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      socket = new WebSocket(`${protocol}//${window.location.host}/ws/prices`)

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === 'quotes') {
          setQuotes((prev) => ({ ...prev, ...message.quotes }))
        }
      }

      socket.onclose = () => {
        if (!cancelled) {
          reconnectTimer.current = window.setTimeout(connect, 3000)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current)
      socket?.close()
    }
  }, [])

  return quotes
}
