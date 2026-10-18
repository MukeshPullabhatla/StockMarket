import { useEffect, useState } from 'react'

// Types out each phrase, pauses, deletes it, then moves to the next one.
export function TypingText({ phrases }: { phrases: string[] }) {
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const phrase = phrases[index % phrases.length]

  useEffect(() => {
    if (reduceMotion) return
    const doneTyping = !deleting && length === phrase.length
    const doneDeleting = deleting && length === 0
    const delay = doneTyping ? 1800 : deleting ? 35 : 70

    const timer = window.setTimeout(() => {
      if (doneTyping) setDeleting(true)
      else if (doneDeleting) {
        setDeleting(false)
        setIndex((i) => i + 1)
      } else setLength((l) => l + (deleting ? -1 : 1))
    }, delay)
    return () => window.clearTimeout(timer)
  }, [length, deleting, phrase, reduceMotion])

  return (
    <span className="typing" aria-label={phrases.join(', ')}>
      <span aria-hidden="true">{reduceMotion ? phrases[0] : phrase.slice(0, length)}</span>
      <span className="typing-caret" aria-hidden="true" />
    </span>
  )
}
