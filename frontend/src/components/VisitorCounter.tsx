import { useEffect, useState } from 'react'
import { recordVisit } from '../api/client'
import { VISITOR_COUNT_MIN } from '../siteConfig'

// Counts this visit (the backend dedupes per visitor per day) and shows the
// total with a short count-up, once it's past VISITOR_COUNT_MIN.
export function VisitorCounter() {
  const [total, setTotal] = useState<number | null>(null)
  const [shown, setShown] = useState(0)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    recordVisit()
      .then((res) => setTotal(res.total))
      .catch(() => setTotal(null))
  }, [])

  useEffect(() => {
    if (total === null || reduceMotion) return
    const duration = 1200
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setShown(Math.round(total * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [total, reduceMotion])

  if (total === null || total < VISITOR_COUNT_MIN) return null

  return (
    <p className="visitor-counter" title="Unique visitors, counted once per day">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span className="visitor-count">{(reduceMotion ? total : shown).toLocaleString()}</span> {total === 1 ? 'visitor' : 'visitors'}
    </p>
  )
}
