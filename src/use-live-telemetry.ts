import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/** Live session duration in seconds */
export function useSessionDuration(): number {
  const [seconds, setSeconds] = useState(0)
  const start = useRef(Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - start.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return seconds
}

/** Scroll depth as 0-100 percentage */
export function useScrollDepth(): number {
  const [depth, setDepth] = useState(0)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollH = document.documentElement.scrollHeight - window.innerHeight
        if (scrollH > 0) {
          setDepth(Math.min(100, Math.round((window.scrollY / scrollH) * 100)))
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return depth
}

export interface LiveEvent {
  id: number
  time: string
  event: string
  source: string
}

/** Accumulates real user events + mixes with simulated ones */
export function useEventLog(simulatedEvents: LiveEvent[]): {
  events: LiveEvent[]
  pushEvent: (event: string, source: string) => void
} {
  const [realEvents, setRealEvents] = useState<LiveEvent[]>([])
  const nextId = useRef(1000)

  const pushEvent = useCallback((event: string, source: string) => {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    setRealEvents(prev => [...prev, { id: nextId.current++, time, event, source }])
  }, [])

  const events = useMemo(
    () => [...simulatedEvents, ...realEvents].slice(-8),
    [simulatedEvents, realEvents]
  )

  return { events, pushEvent }
}
