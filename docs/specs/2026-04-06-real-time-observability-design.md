# Real-Time Observability — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all mocked observability data with real metrics sourced from Vercel Analytics API + self-tracked stats in Vercel KV (Redis).

**Architecture:** Cron-cached hybrid — a daily cron pulls Vercel Analytics for traffic/geo/referrers, while a lightweight beacon and chat instrumentation write real-time counters and events to KV. A single `/api/stats` endpoint reads cached KV data for the frontend.

**Tech Stack:** Vercel KV (Redis), Vercel Analytics API, `@vercel/analytics/react`, `@vercel/kv`, Vercel Cron

---

## 1. Architecture

Three write paths, one read path:

1. **Beacon** (`POST /api/track`) — fires on page load and section scroll-into-view. Increments daily visitor/theme/lang counters, logs anonymous events.
2. **Chat** (`api/chat.js`) — on every chat message, increments daily conversation/token/cost counters.
3. **Cron** (`POST /api/cron/evaluate`, daily 8AM UTC) — pulls Vercel Analytics API for last 90 days (visitors, pageviews, countries, referrers), combines with KV chat counters, caches aggregated summary + time series in KV.
4. **Read** (`GET /api/stats`) — single endpoint, reads cached KV data, returns full JSON payload for frontend.

## 2. KV Data Schema

Keys follow `namespace:date` for daily data, `namespace:latest` for cached aggregates.

### Daily counters (written by beacon + chat)

| Key pattern | Type | Writer |
|---|---|---|
| `track:YYYY-MM-DD:visitors` | integer (INCR) | beacon |
| `track:YYYY-MM-DD:theme:dark` | integer (INCR) | beacon |
| `track:YYYY-MM-DD:theme:light` | integer (INCR) | beacon |
| `track:YYYY-MM-DD:lang:pt` | integer (INCR) | beacon |
| `track:YYYY-MM-DD:lang:en` | integer (INCR) | beacon |
| `chat:YYYY-MM-DD:conversations` | integer (INCR) | chat.js |
| `chat:YYYY-MM-DD:tokens` | integer (INCRBY) | chat.js |
| `chat:YYYY-MM-DD:cost` | float (INCRBYFLOAT) | chat.js |

### Recent events (written by beacon)

| Key | Type | Details |
|---|---|---|
| `events:recent` | Redis List (LPUSH + LTRIM 0 49) | Capped at 50 entries |

Each entry is JSON: `{"time":"14:32:05","event":"viewed Projects","source":"São Paulo"}`

### Cached analytics (written by cron)

| Key | Type | Details |
|---|---|---|
| `analytics:summary` | JSON string | `{ visitors, pageviews, countries: [{key, value}], sources: [{key, value}], updatedAt }` |
| `analytics:timeseries` | JSON string | Array of `{ date, views, chats, tokenCost }` for last 90 days |

## 3. API Endpoints

### `POST /api/track`

Called via `navigator.sendBeacon` on page load (non-blocking, fire-and-forget).

**Request body:**
```json
{
  "theme": "dark",
  "lang": "pt",
  "event": "viewed Projects",
  "city": ""
}
```

**Logic:**
1. Extract date as `YYYY-MM-DD`
2. `INCR track:{date}:visitors`
3. `INCR track:{date}:theme:{theme}` (if theme is "dark" or "light")
4. `INCR track:{date}:lang:{lang}` (if lang is "pt" or "en")
5. If `event` present: derive city from `x-vercel-ip-city` header, `LPUSH events:recent` with `{time, event, source: city}`, then `LTRIM events:recent 0 49`
6. Return `204 No Content`

**Security:** Validate `theme` is "dark"/"light", `lang` is "pt"/"en". Ignore unknown fields. No auth required — all data is anonymous counters.

### `GET /api/stats`

Returns all observability data in a single payload.

**Response:**
```json
{
  "kpis": { "visitors": 12450, "countries": 23, "conversations": 812 },
  "timeSeries": [{ "date": "04/01", "views": 130, "chats": 8, "tokenCost": 0.02 }],
  "countries": [{ "key": "BR", "value": 4100 }],
  "sources": [{ "key": "direct", "value": 3200 }],
  "theme": { "dark": 72, "light": 28 },
  "lang": { "pt": 55, "en": 45 },
  "events": [{ "time": "14:32:05", "event": "viewed Projects", "source": "São Paulo" }],
  "updatedAt": "2026-04-06T08:00:00Z"
}
```

**Logic:**
1. Read `analytics:summary` and `analytics:timeseries` from KV
2. Read today's `track:{date}:theme:*` and `track:{date}:lang:*` counters, compute percentages
3. Read `events:recent` list (last 20)
4. Derive `countries` count from summary
5. If KV is empty or fails, return `null` — frontend falls back to mock data

### `POST /api/cron/evaluate`

Vercel cron, daily at 8AM UTC (already declared in `vercel.json`).

**Logic:**
1. Validate `CRON_SECRET` header
2. Call Vercel Analytics API for last 90 days: visitors total, pageviews per day, top countries, top referrers
3. Read last 90 days of `chat:YYYY-MM-DD:*` counters from KV
4. Build combined time series: each day gets `{ date, views: analyticsPageviews, chats: kvChats, tokenCost: kvCost }`
5. Build summary: `{ visitors: analyticsTotal, countries: [...], sources: [...] }`
6. Write `analytics:summary` and `analytics:timeseries` to KV
7. Return `200`

**Auth:** Verify `authorization` header equals `Bearer ${CRON_SECRET}`. Vercel sends this automatically for cron invocations.

**Vercel Analytics API:** Uses `https://vercel.com/api/web/insights/stats` with `bearer ${VERCEL_ANALYTICS_TOKEN}` auth. Requires the project's Analytics to be enabled (already done).

### Changes to `api/chat.js`

After each successful streaming response, add:
```js
const today = new Date().toISOString().slice(0, 10)
await kv.incr(`chat:${today}:conversations`)
await kv.incrby(`chat:${today}:tokens`, tokenCount)
await kv.incrbyfloat(`chat:${today}:cost`, estimatedCost)
```

Token count and cost estimated from the response usage metadata.

## 4. Frontend Changes

### New dependency: `@vercel/analytics/react`
Add `<Analytics />` component in `src/main.tsx` to enable Vercel's automatic pageview tracking.

### New dependency: `@vercel/kv`
Used server-side only in API endpoints.

### Replace `src/observability-data.ts`
Replace with `src/use-observability-data.ts` — a React hook:
```ts
export function useObservabilityData() {
  // fetch /api/stats on mount
  // return { data, loading, error }
  // if fetch fails, fall back to current mock generators
}
```

Keep the old `observability-data.ts` file as the fallback source (imported by the hook when API returns null).

### Update `src/ObservabilitySection.tsx`
- Replace `generateTimeSeries/generateCountryData/generateSourceData/generateKpis` with the data hook
- Add lightweight loading skeleton while data fetches
- Event log reads from real `events` array instead of `generateSimulatedEvents`
- Theme/lang percentages from API instead of hardcoded 72/28 and 55/45
- Session timer + scroll depth stay client-side (already real)
- Zero layout changes — same charts, cards, structure

### Beacon in `src/App.tsx`
On mount, fire once:
```ts
navigator.sendBeacon('/api/track', JSON.stringify({
  theme: isDark ? 'dark' : 'light',
  lang: currentLang,
  event: 'page loaded'
}))
```

On section scroll into view (using IntersectionObserver), fire:
```ts
navigator.sendBeacon('/api/track', JSON.stringify({
  event: 'viewed Projects'
}))
```

Each section fires its beacon only once per session (tracked via ref/set).

## 5. Graceful Degradation

- If `/api/stats` fails or returns empty: frontend falls back to current mock generators. Visitor sees plausible data, never broken charts.
- If KV is unavailable: `api/track` and `api/chat.js` swallow errors silently. Tracking failure never breaks user experience.
- If Vercel Analytics API fails in cron: keep previous cached data in KV (don't overwrite with empty).

## 6. Privacy

- No PII stored. No cookies. No user IDs.
- City derived from Vercel's `x-vercel-ip-city` header (already available, no extra service needed).
- Events only store section names and timestamps — nothing user-identifiable.
- Theme and language are anonymous counters, not tied to any session.

## 7. Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `KV_REST_API_URL` | Vercel env | Vercel KV connection URL |
| `KV_REST_API_TOKEN` | Vercel env | Vercel KV auth token |
| `VERCEL_ANALYTICS_TOKEN` | Vercel env | Vercel Analytics API read access |
| `CRON_SECRET` | Vercel env | Validates cron invocations |

All set in Vercel dashboard, never committed to code.

## 8. Testing

- **Unit tests (Vitest):** Test `useObservabilityData` hook with mocked fetch responses and fallback behavior. Test beacon payload construction.
- **Build verification:** `npm run build` must pass with new dependencies.
- **Manual verification:** After deploy, check `/api/stats` returns real JSON. Check beacon fires in Network tab. Check cron runs in Vercel dashboard logs.

## 9. Dependencies

| Package | Purpose | Size |
|---|---|---|
| `@vercel/analytics` | Automatic pageview tracking | ~1KB gzipped |
| `@vercel/kv` | Redis client for API endpoints | server-side only |
