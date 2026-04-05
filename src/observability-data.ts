/** Deterministic data generator for the Observability section.
 *  Uses date-based seed so numbers are consistent within a day. */

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function dateSeed(): number {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export interface DailyPoint {
  date: string      // "MM/DD"
  views: number
  chats: number
  tokenCost: number // cumulative $
}

export interface CountryDatum {
  name: string
  key: string
  value: number
}

export interface SourceDatum {
  name: string
  key: string
  value: number
}

export function generateTimeSeries(days: number): DailyPoint[] {
  const rand = seededRandom(dateSeed())
  const now = new Date()
  const points: DailyPoint[] = []
  let cumulativeCost = 0

  for (let i = days; i > 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dow = d.getDay()
    const isWeekend = dow === 0 || dow === 6

    // Base views: growth trend + weekly seasonality + noise
    const trend = 80 + ((days - i) / days) * 60
    const seasonal = isWeekend ? 0.6 : 1.0
    const noise = 0.8 + rand() * 0.4
    const views = Math.round(trend * seasonal * noise)

    const chats = Math.round(views * (0.05 + rand() * 0.03))
    const dayCost = chats * (0.002 + rand() * 0.001)
    cumulativeCost += dayCost

    points.push({
      date: `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
      views,
      chats,
      tokenCost: Math.round(cumulativeCost * 100) / 100,
    })
  }
  return points
}

export function generateCountryData(labels: Record<string, string>): CountryDatum[] {
  const rand = seededRandom(dateSeed() + 1)
  const keys = ['BR', 'US', 'PT', 'UK', 'DE', 'ES']
  const weights = [35, 20, 15, 12, 10, 8]
  return keys.map((key, i) => ({
    key,
    name: labels[key] ?? key,
    value: Math.round(weights[i] * (0.85 + rand() * 0.3)),
  })).sort((a, b) => b.value - a.value)
}

export function generateSourceData(labels: Record<string, string>): SourceDatum[] {
  const rand = seededRandom(dateSeed() + 2)
  const keys = ['direct', 'linkedin', 'github', 'search', 'other']
  const weights = [30, 28, 18, 16, 8]
  return keys.map((key, i) => ({
    key,
    name: labels[key] ?? key,
    value: Math.round(weights[i] * (0.85 + rand() * 0.3)),
  })).sort((a, b) => b.value - a.value)
}

export function generateKpis(): { visitors: number; countries: number; conversations: number } {
  const rand = seededRandom(dateSeed() + 3)
  return {
    visitors: Math.round(11800 + rand() * 1200),
    countries: 23,
    conversations: Math.round(780 + rand() * 120),
  }
}
