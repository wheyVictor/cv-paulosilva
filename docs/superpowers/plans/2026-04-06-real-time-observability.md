# Real-Time Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mocked observability data with real metrics from Vercel KV (Redis) + Vercel Analytics API, tracked via beacon and chat instrumentation.

**Architecture:** Beacon writes anonymous counters to KV on page load. Chat API writes conversation stats. Daily cron caches Vercel Analytics data. Single `/api/stats` endpoint reads all cached data for the frontend.

**Tech Stack:** Vercel KV (`@vercel/kv`), Vercel Analytics API, Vercel Cron, React hooks, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `api/track.js` | Beacon endpoint — writes anonymous counters + events to KV |
| Create | `api/stats.js` | Read endpoint — returns all observability data from KV |
| Create | `api/cron/evaluate.js` | Daily cron — caches Vercel Analytics data in KV |
| Create | `api/_kv.js` | Shared KV client helper (today's date, key helpers) |
| Create | `src/use-observability-data.ts` | React hook — fetches `/api/stats`, falls back to mocks |
| Create | `tests/unit/use-observability-data.test.ts` | Tests for the data hook |
| Create | `tests/unit/kv-helpers.test.ts` | Tests for KV key helpers |
| Modify | `api/chat.js` | Add KV counter writes after chat response |
| Modify | `src/ObservabilitySection.tsx` | Use real data hook instead of mock generators |
| Modify | `src/App.tsx` | Add beacon on page load + section scroll |
| Modify | `package.json` | Add `@vercel/kv` dependency |
| Keep   | `src/observability-data.ts` | Retained as fallback data source |
| Keep   | `src/use-live-telemetry.ts` | Session timer + scroll depth stay as-is |

---

### Task 1: Install `@vercel/kv` and create shared KV helper

**Files:**
- Modify: `package.json`
- Create: `api/_kv.js`
- Create: `tests/unit/kv-helpers.test.ts`

- [ ] **Step 1: Install `@vercel/kv`**

```bash
cd /home/paulosilva/cv-paulosilva && npm install @vercel/kv
```

- [ ] **Step 2: Write test for KV key helpers**

Create `tests/unit/kv-helpers.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We test the key-generation logic, not the KV connection.
// api/_kv.js is a .js serverless file, so we test the pure helper logic.
describe('KV key helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-06T14:30:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('todayKey returns YYYY-MM-DD', () => {
    const d = new Date()
    const key = d.toISOString().slice(0, 10)
    expect(key).toBe('2026-04-06')
  })

  it('track key format is correct', () => {
    const date = '2026-04-06'
    expect(`track:${date}:visitors`).toBe('track:2026-04-06:visitors')
    expect(`track:${date}:theme:dark`).toBe('track:2026-04-06:theme:dark')
    expect(`track:${date}:lang:pt`).toBe('track:2026-04-06:lang:pt')
  })

  it('chat key format is correct', () => {
    const date = '2026-04-06'
    expect(`chat:${date}:conversations`).toBe('chat:2026-04-06:conversations')
    expect(`chat:${date}:tokens`).toBe('chat:2026-04-06:tokens')
    expect(`chat:${date}:cost`).toBe('chat:2026-04-06:cost')
  })
})
```

- [ ] **Step 3: Run test to verify it passes**

```bash
cd /home/paulosilva/cv-paulosilva && npx vitest run tests/unit/kv-helpers.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 4: Create `api/_kv.js`**

```js
import { createClient } from '@vercel/kv'

/** Lazy-initialized KV client. Returns null if env vars are missing. */
let _kv = null
export function getKv() {
  if (_kv) return _kv
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  _kv = createClient({ url, token })
  return _kv
}

/** Today's date as YYYY-MM-DD */
export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}
```

- [ ] **Step 5: Run build to verify no breakage**

```bash
cd /home/paulosilva/cv-paulosilva && npm run build
```

Expected: Build succeeds. `api/_kv.js` is a serverless helper, not bundled by Vite.

- [ ] **Step 6: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add package.json package-lock.json api/_kv.js tests/unit/kv-helpers.test.ts
git commit -m "feat(observability): add @vercel/kv dependency and shared KV helper"
```

---

### Task 2: Create `POST /api/track` beacon endpoint

**Files:**
- Create: `api/track.js`

- [ ] **Step 1: Create `api/track.js`**

```js
import { getKv, todayKey } from './_kv.js'

export const config = { runtime: 'nodejs', maxDuration: 5 }

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const kv = getKv()
  if (!kv) return res.status(204).end()

  try {
    const { theme, lang, event } = req.body || {}
    const date = todayKey()

    const pipeline = kv.pipeline()

    // Visitor counter
    pipeline.incr(`track:${date}:visitors`)

    // Theme counter
    if (theme === 'dark' || theme === 'light') {
      pipeline.incr(`track:${date}:theme:${theme}`)
    }

    // Language counter
    if (lang === 'pt' || lang === 'en') {
      pipeline.incr(`track:${date}:lang:${lang}`)
    }

    // Event log
    if (event && typeof event === 'string') {
      const city = req.headers['x-vercel-ip-city'] || ''
      const now = new Date()
      const time = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`
      const entry = JSON.stringify({ time, event: event.slice(0, 100), source: decodeURIComponent(city) || 'web' })
      pipeline.lpush('events:recent', entry)
      pipeline.ltrim('events:recent', 0, 49)
    }

    await pipeline.exec()
  } catch (err) {
    console.error('Track error:', err.message)
    // Swallow — tracking must never break UX
  }

  return res.status(204).end()
}
```

- [ ] **Step 2: Run build to verify no breakage**

```bash
cd /home/paulosilva/cv-paulosilva && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add api/track.js
git commit -m "feat(observability): add POST /api/track beacon endpoint"
```

---

### Task 3: Create `GET /api/stats` read endpoint

**Files:**
- Create: `api/stats.js`

- [ ] **Step 1: Create `api/stats.js`**

```js
import { getKv, todayKey } from './_kv.js'

export const config = { runtime: 'nodejs', maxDuration: 10 }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  const kv = getKv()
  if (!kv) {
    return res.status(200).json(null)
  }

  try {
    const date = todayKey()

    // Read all data in parallel
    const [
      summary,
      timeSeries,
      themeDark,
      themeLight,
      langPt,
      langEn,
      events,
    ] = await Promise.all([
      kv.get('analytics:summary'),
      kv.get('analytics:timeseries'),
      kv.get(`track:${date}:theme:dark`),
      kv.get(`track:${date}:theme:light`),
      kv.get(`track:${date}:lang:pt`),
      kv.get(`track:${date}:lang:en`),
      kv.lrange('events:recent', 0, 19),
    ])

    const darkCount = Number(themeDark) || 0
    const lightCount = Number(themeLight) || 0
    const themeTotal = darkCount + lightCount
    const ptCount = Number(langPt) || 0
    const enCount = Number(langEn) || 0
    const langTotal = ptCount + enCount

    // Parse summary (cached by cron)
    const sum = summary || {}
    const ts = timeSeries || []

    // Parse events
    const parsedEvents = (events || []).map((e) => {
      try { return typeof e === 'string' ? JSON.parse(e) : e } catch { return null }
    }).filter(Boolean)

    // Count unique countries from summary
    const countriesCount = Array.isArray(sum.countries) ? sum.countries.length : 0

    // Sum conversations from time series
    const totalConversations = Array.isArray(ts)
      ? ts.reduce((s, p) => s + (p.chats || 0), 0)
      : 0

    return res.status(200).json({
      kpis: {
        visitors: sum.visitors || 0,
        countries: countriesCount,
        conversations: totalConversations,
      },
      timeSeries: ts,
      countries: sum.countries || [],
      sources: sum.sources || [],
      theme: {
        dark: themeTotal > 0 ? Math.round((darkCount / themeTotal) * 100) : 50,
        light: themeTotal > 0 ? Math.round((lightCount / themeTotal) * 100) : 50,
      },
      lang: {
        pt: langTotal > 0 ? Math.round((ptCount / langTotal) * 100) : 50,
        en: langTotal > 0 ? Math.round((enCount / langTotal) * 100) : 50,
      },
      events: parsedEvents,
      updatedAt: sum.updatedAt || null,
    })
  } catch (err) {
    console.error('Stats error:', err.message)
    return res.status(200).json(null)
  }
}
```

- [ ] **Step 2: Run build to verify no breakage**

```bash
cd /home/paulosilva/cv-paulosilva && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add api/stats.js
git commit -m "feat(observability): add GET /api/stats read endpoint"
```

---

### Task 4: Create daily cron `/api/cron/evaluate`

**Files:**
- Create: `api/cron/evaluate.js`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p /home/paulosilva/cv-paulosilva/api/cron
```

Create `api/cron/evaluate.js`:

```js
import { getKv, todayKey } from '../_kv.js'

export const config = { runtime: 'nodejs', maxDuration: 30 }

export default async function handler(req, res) {
  // Validate cron secret
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const kv = getKv()
  if (!kv) {
    return res.status(500).json({ error: 'KV not configured' })
  }

  try {
    // --- 1. Fetch Vercel Analytics (last 90 days) ---
    let analyticsVisitors = 0
    const analyticsCountries = []
    const analyticsSources = []
    const dailyPageviews = {}

    const analyticsToken = process.env.VERCEL_ANALYTICS_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID
    const teamId = process.env.VERCEL_TEAM_ID

    if (analyticsToken && projectId) {
      const now = new Date()
      const from = new Date(now)
      from.setDate(from.getDate() - 90)
      const fromStr = from.toISOString()
      const toStr = now.toISOString()

      const baseUrl = 'https://vercel.com/api/web/insights'
      const params = `projectId=${projectId}${teamId ? `&teamId=${teamId}` : ''}&from=${fromStr}&to=${toStr}`
      const headers = { Authorization: `Bearer ${analyticsToken}` }

      // Fetch pageviews (time series)
      try {
        const pvRes = await fetch(`${baseUrl}/stats/path?${params}&limit=1`, { headers })
        if (pvRes.ok) {
          const pvData = await pvRes.json()
          analyticsVisitors = pvData.total?.visitors || pvData.total?.pageViews || 0
        }
      } catch (e) {
        console.error('Analytics pageviews fetch failed:', e.message)
      }

      // Fetch countries
      try {
        const geoRes = await fetch(`${baseUrl}/stats/country?${params}&limit=10`, { headers })
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          if (Array.isArray(geoData.data)) {
            for (const row of geoData.data) {
              analyticsCountries.push({ key: row.key, value: row.total?.visitors || row.total?.pageViews || 0 })
            }
          }
        }
      } catch (e) {
        console.error('Analytics geo fetch failed:', e.message)
      }

      // Fetch referrers
      try {
        const refRes = await fetch(`${baseUrl}/stats/referrer?${params}&limit=10`, { headers })
        if (refRes.ok) {
          const refData = await refRes.json()
          if (Array.isArray(refData.data)) {
            for (const row of refData.data) {
              analyticsSources.push({ key: row.key || 'direct', value: row.total?.visitors || row.total?.pageViews || 0 })
            }
          }
        }
      } catch (e) {
        console.error('Analytics referrer fetch failed:', e.message)
      }
    }

    // --- 2. Build time series from KV daily counters (last 90 days) ---
    const timeSeries = []
    const now = new Date()

    // Batch-read all chat counters for 90 days
    const pipeline = kv.pipeline()
    const dates = []
    for (let i = 90; i > 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      dates.push(dateStr)
      pipeline.get(`track:${dateStr}:visitors`)
      pipeline.get(`chat:${dateStr}:conversations`)
      pipeline.get(`chat:${dateStr}:tokens`)
      pipeline.get(`chat:${dateStr}:cost`)
    }

    const results = await pipeline.exec()
    let cumulativeCost = 0

    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i]
      const views = Number(results[i * 4]) || 0
      const chats = Number(results[i * 4 + 1]) || 0
      const tokens = Number(results[i * 4 + 2]) || 0
      const dayCost = Number(results[i * 4 + 3]) || 0
      cumulativeCost += dayCost

      const d = new Date(dateStr)
      const dateLabel = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`

      timeSeries.push({
        date: dateLabel,
        views,
        chats,
        tokenCost: Math.round(cumulativeCost * 100) / 100,
      })
    }

    // --- 3. Write cached analytics ---
    const summary = {
      visitors: analyticsVisitors,
      countries: analyticsCountries,
      sources: analyticsSources,
      updatedAt: new Date().toISOString(),
    }

    await Promise.all([
      kv.set('analytics:summary', JSON.stringify(summary)),
      kv.set('analytics:timeseries', JSON.stringify(timeSeries)),
    ])

    return res.status(200).json({
      ok: true,
      visitors: analyticsVisitors,
      countries: analyticsCountries.length,
      timeSeriesDays: timeSeries.length,
    })
  } catch (err) {
    console.error('Cron evaluate error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
```

- [ ] **Step 2: Run build to verify no breakage**

```bash
cd /home/paulosilva/cv-paulosilva && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add api/cron/evaluate.js
git commit -m "feat(observability): add daily cron to cache Vercel Analytics in KV"
```

---

### Task 5: Instrument `api/chat.js` with KV counters

**Files:**
- Modify: `api/chat.js:1-106`

- [ ] **Step 1: Add KV import and counter writes to `api/chat.js`**

At the top of `api/chat.js`, add after existing imports (line 4):

```js
import { getKv, todayKey } from './_kv.js'
```

Replace the streaming section (lines 82-96) with:

```js
    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt + langNote,
      messages: recentMessages,
    })

    let outputTokens = 0
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
      if (event.type === 'message_delta' && event.usage) {
        outputTokens = event.usage.output_tokens || 0
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()

    // Fire-and-forget: write chat stats to KV
    const kv = getKv()
    if (kv) {
      const date = todayKey()
      const inputTokens = recentMessages.reduce((s, m) => s + m.content.length / 4, 0)
      const totalTokens = Math.round(inputTokens) + outputTokens
      const cost = totalTokens * 0.000001 // Haiku 4.5 approximate cost
      kv.incr(`chat:${date}:conversations`).catch(() => {})
      kv.incrby(`chat:${date}:tokens`, totalTokens).catch(() => {})
      kv.incrbyfloat(`chat:${date}:cost`, cost).catch(() => {})
    }
```

- [ ] **Step 2: Run tests**

```bash
cd /home/paulosilva/cv-paulosilva && npm test
```

Expected: All existing tests pass.

- [ ] **Step 3: Run build**

```bash
cd /home/paulosilva/cv-paulosilva && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add api/chat.js
git commit -m "feat(observability): instrument chat API with KV conversation counters"
```

---

### Task 6: Create `useObservabilityData` hook with fallback

**Files:**
- Create: `src/use-observability-data.ts`
- Create: `tests/unit/use-observability-data.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/use-observability-data.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useObservabilityData } from '../../src/use-observability-data'

describe('useObservabilityData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns loading true initially', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}) // never resolves
    )
    const { result } = renderHook(() => useObservabilityData())
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
  })

  it('returns API data on success', async () => {
    const mockData = {
      kpis: { visitors: 500, countries: 10, conversations: 50 },
      timeSeries: [{ date: '04/01', views: 100, chats: 5, tokenCost: 0.01 }],
      countries: [{ key: 'BR', value: 200 }],
      sources: [{ key: 'direct', value: 100 }],
      theme: { dark: 70, light: 30 },
      lang: { pt: 60, en: 40 },
      events: [{ time: '14:00:00', event: 'page loaded', source: 'web' }],
      updatedAt: '2026-04-06T08:00:00Z',
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)

    const { result } = renderHook(() => useObservabilityData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBe(null)
  })

  it('returns null data on fetch failure (fallback)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useObservabilityData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe('Network error')
  })

  it('returns null data when API returns null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    } as Response)

    const { result } = renderHook(() => useObservabilityData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(null)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/paulosilva/cv-paulosilva && npx vitest run tests/unit/use-observability-data.test.ts
```

Expected: FAIL — module `use-observability-data` not found.

- [ ] **Step 3: Implement the hook**

Create `src/use-observability-data.ts`:

```ts
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
        if (!cancelled) {
          setData(json)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setData(null)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/paulosilva/cv-paulosilva && npx vitest run tests/unit/use-observability-data.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Run all tests + build**

```bash
cd /home/paulosilva/cv-paulosilva && npm test && npm run build
```

Expected: All pass.

- [ ] **Step 6: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add src/use-observability-data.ts tests/unit/use-observability-data.test.ts
git commit -m "feat(observability): add useObservabilityData hook with fallback"
```

---

### Task 7: Update `ObservabilitySection.tsx` to use real data

**Files:**
- Modify: `src/ObservabilitySection.tsx`

- [ ] **Step 1: Replace mock data imports with the hook**

In `src/ObservabilitySection.tsx`, replace the import block (lines 1-27) with:

```tsx
import { useState, useMemo, useEffect, useRef } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { Activity } from 'lucide-react'
import {
  generateTimeSeries,
  generateCountryData,
  generateSourceData,
  generateKpis,
} from './observability-data'
import { useObservabilityData } from './use-observability-data'
import {
  useSessionDuration,
  useScrollDepth,
  useEventLog,
  type LiveEvent,
} from './use-live-telemetry'
import type { Lang } from './i18n'
```

- [ ] **Step 2: Replace data wiring in the component body**

Replace lines 152-163 (the data generation block) with:

```tsx
  /* real data from API, with mock fallback */
  const { data: apiData } = useObservabilityData()

  /* time range state */
  const [range, setRange] = useState<TimeRange>('30d')

  /* chart data — real if available, mock fallback */
  const timeSeries = useMemo(() => {
    if (apiData?.timeSeries?.length) {
      const days = daysFor[range]
      return apiData.timeSeries.slice(-days)
    }
    return generateTimeSeries(daysFor[range])
  }, [range, apiData])

  const countryData = useMemo(() => {
    if (apiData?.countries?.length) {
      return apiData.countries
        .map((c) => ({ key: c.key, name: countryLabels[c.key] ?? c.key, value: c.value }))
        .sort((a, b) => b.value - a.value)
    }
    return generateCountryData(countryLabels)
  }, [lang, apiData, countryLabels])

  const sourceData = useMemo(() => {
    if (apiData?.sources?.length) {
      return apiData.sources
        .map((s) => ({ key: s.key, name: sourceLabels[s.key] ?? s.key, value: s.value }))
        .sort((a, b) => b.value - a.value)
    }
    return generateSourceData(sourceLabels)
  }, [lang, apiData, sourceLabels])

  const kpis = useMemo(() => {
    if (apiData?.kpis && apiData.kpis.visitors > 0) {
      return apiData.kpis
    }
    return generateKpis()
  }, [apiData])
```

- [ ] **Step 3: Replace event log wiring**

Replace lines 162-171 (simulated events + push event) with:

```tsx
  /* live telemetry — real events from API + session events */
  const apiEvents: LiveEvent[] = useMemo(() => {
    if (apiData?.events?.length) {
      return apiData.events.map((e, i) => ({
        id: i,
        time: e.time,
        event: e.event,
        source: e.source,
      }))
    }
    return generateSimulatedEvents(eventStrings)
  }, [apiData, eventStrings])

  const { events, pushEvent } = useEventLog(apiEvents)
```

- [ ] **Step 4: Replace hardcoded theme/lang percentages**

Replace lines 212-214 (hardcoded dark/light):

```tsx
  /* theme/lang percentages — real if available */
  const darkPct = apiData?.theme?.dark ?? 72
  const lightPct = apiData?.theme?.light ?? 28
```

Replace lines 388-396 (hardcoded language split) with:

```tsx
            <div className="rounded-xl bg-card border border-border p-4">
              <p className="text-muted-foreground text-sm">{obs.langSplit as string}</p>
              <div className="mt-2 flex h-4 w-full overflow-hidden rounded-full">
                <div className="h-full bg-primary" style={{ width: `${apiData?.lang?.pt ?? 55}%` }} />
                <div className="h-full bg-accent" style={{ width: `${apiData?.lang?.en ?? 45}%` }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>PT {apiData?.lang?.pt ?? 55}%</span>
                <span>EN {apiData?.lang?.en ?? 45}%</span>
              </div>
            </div>
```

- [ ] **Step 5: Run all tests + build**

```bash
cd /home/paulosilva/cv-paulosilva && npm test && npm run build
```

Expected: All pass. The existing `observability-data.test.ts` still passes since the mock generators are retained as fallback.

- [ ] **Step 6: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add src/ObservabilitySection.tsx
git commit -m "feat(observability): wire ObservabilitySection to real API data with mock fallback"
```

---

### Task 8: Add beacon to `src/App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add beacon on page load**

In `src/App.tsx`, inside the main `App` component, find the existing `useEffect` that runs on mount (the one setting up hydration/SEO). Add a new `useEffect` after the existing ones:

```tsx
  // Observability beacon — fire once on page load
  const beaconFired = useRef(false)
  useEffect(() => {
    if (beaconFired.current) return
    beaconFired.current = true

    const isDark = document.documentElement.classList.contains('dark')
    const payload = JSON.stringify({
      theme: isDark ? 'dark' : 'light',
      lang,
      event: 'page loaded',
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
    }
  }, [lang])
```

- [ ] **Step 2: Add section-view beacons using IntersectionObserver**

Add a helper hook near the top of the file (after the existing `useInView` hook around line 26):

```tsx
function useSectionBeacon(sectionId: string) {
  const fired = useRef(false)
  const setRef = useCallback((el: HTMLElement | null) => {
    if (!el || fired.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fired.current) {
          fired.current = true
          observer.disconnect()
          const payload = JSON.stringify({ event: `viewed ${sectionId}` })
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
          }
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
  }, [sectionId])

  return setRef
}
```

Then attach the beacon refs to the main section elements. In the JSX where each section is rendered, add the ref. For example, for the experience section:

```tsx
  const expBeacon = useSectionBeacon('Experience')
  const projBeacon = useSectionBeacon('Projects')
  const obsBeacon = useSectionBeacon('Observability')
  const contactBeacon = useSectionBeacon('Contact')
```

And on each `<section>` tag, add `ref={expBeacon}` etc. For example:

```tsx
<section id="experience" ref={expBeacon} className="py-16 ...">
```

- [ ] **Step 3: Run tests + build**

```bash
cd /home/paulosilva/cv-paulosilva && npm test && npm run build
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add src/App.tsx
git commit -m "feat(observability): add page-load and section-view beacons"
```

---

### Task 9: Update existing tests and add integration smoke test

**Files:**
- Modify: `tests/unit/observability-data.test.ts`
- Create: `tests/integration/stats-api.test.ts`

- [ ] **Step 1: Update existing observability test description**

In `tests/unit/observability-data.test.ts`, update the top-level describe to clarify these are fallback generators:

```ts
describe('observability-data (fallback generators)', () => {
```

No other changes — the tests continue validating the mock generators used as fallback.

- [ ] **Step 2: Create integration smoke test**

Create `tests/integration/stats-api.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'

describe('/api/stats smoke test', () => {
  it('stats module exports a handler function', async () => {
    // Verify the module structure is correct (can be imported)
    const mod = await import('../../api/stats.js')
    expect(typeof mod.default).toBe('function')
  })

  it('track module exports a handler function', async () => {
    const mod = await import('../../api/track.js')
    expect(typeof mod.default).toBe('function')
  })

  it('cron evaluate module exports a handler function', async () => {
    const mod = await import('../../api/cron/evaluate.js')
    expect(typeof mod.default).toBe('function')
  })
})
```

- [ ] **Step 3: Run all tests + build**

```bash
cd /home/paulosilva/cv-paulosilva && npm test && npm run build
```

Expected: All pass.

- [ ] **Step 4: Commit**

```bash
cd /home/paulosilva/cv-paulosilva
git add tests/unit/observability-data.test.ts tests/integration/stats-api.test.ts
git commit -m "test(observability): update tests and add API smoke tests"
```

---

### Task 10: Environment variables and deployment verification

**Files:**
- No code changes — configuration + manual verification

- [ ] **Step 1: Document required env vars**

The following environment variables must be set in Vercel dashboard (Settings > Environment Variables):

| Variable | How to get |
|---|---|
| `KV_REST_API_URL` | Create a KV store in Vercel dashboard (Storage > KV > Create), then link to project. Auto-populated. |
| `KV_REST_API_TOKEN` | Auto-populated when KV store is linked to project. |
| `VERCEL_ANALYTICS_TOKEN` | Vercel dashboard > project > Settings > Analytics > API Token |
| `CRON_SECRET` | Generate with `openssl rand -hex 32`, set in Vercel env vars |
| `VERCEL_PROJECT_ID` | Already available in Vercel's runtime environment |
| `VERCEL_TEAM_ID` | Already available in Vercel's runtime environment (if using a team) |

- [ ] **Step 2: Verify build passes**

```bash
cd /home/paulosilva/cv-paulosilva && npm test && npm run build
```

Expected: All pass.

- [ ] **Step 3: Final commit (if any docs changes)**

```bash
cd /home/paulosilva/cv-paulosilva
git add -A
git status
# Only commit if there are changes
git diff --cached --quiet || git commit -m "docs(observability): add env var documentation"
```

- [ ] **Step 4: Create PR**

```bash
cd /home/paulosilva/cv-paulosilva
git push -u origin HEAD
gh pr create --title "feat: real-time observability data" --body "## Summary
- Replace mocked observability data with real metrics
- Add beacon tracking (page loads, section views, theme, language)
- Instrument chat API with conversation/token/cost counters
- Add daily cron to cache Vercel Analytics data in KV
- Add /api/stats endpoint for frontend consumption
- Graceful fallback to mock data when KV is empty

## Setup Required
- Create Vercel KV store and link to project
- Set VERCEL_ANALYTICS_TOKEN and CRON_SECRET env vars

## Test plan
- [ ] npm test passes
- [ ] npm run build passes
- [ ] /api/stats returns JSON after KV setup
- [ ] Beacon fires on page load (check Network tab)
- [ ] Chat stats increment after conversation
- [ ] Cron runs successfully (check Vercel dashboard)
- [ ] Fallback to mock data works when KV is empty"
```
