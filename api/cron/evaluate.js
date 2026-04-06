import { getKv, todayKey } from '../_kv.js'

export const config = { runtime: 'nodejs', maxDuration: 30 }

export default async function handler(req, res) {
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
    let analyticsVisitors = 0
    const analyticsCountries = []
    const analyticsSources = []

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

      try {
        const pvRes = await fetch(`${baseUrl}/stats/path?${params}&limit=1`, { headers })
        if (pvRes.ok) {
          const pvData = await pvRes.json()
          analyticsVisitors = pvData.total?.visitors || pvData.total?.pageViews || 0
        }
      } catch (e) {
        console.error('Analytics pageviews fetch failed:', e.message)
      }

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

    const timeSeries = []
    const now = new Date()

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
