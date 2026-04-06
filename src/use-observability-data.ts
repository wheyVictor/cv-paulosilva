import { useState, useEffect } from 'react'

export interface StatsData {
  kpis: { visitors: number; countries: number; conversations: number }
  timeSeries: { date: string; views: number; chats: number; tokenCost: number }[]
  countries: { key: string; value: number }[]
  sources: { key: string; value: number }[]
  theme: { dark: number; light: number }
  lang: { pt: number; en: number }
  events: { time: string; event: string; source: string }[]
  updatedAt: string | null
}

export function useObservabilityData(): {
  data: StatsData | null
  loading: boolean
  error: string | null
} {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) { setData(json); setLoading(false) }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setData(null); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
