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

    const sum = typeof summary === 'string' ? JSON.parse(summary) : (summary || {})
    const ts = typeof timeSeries === 'string' ? JSON.parse(timeSeries) : (timeSeries || [])

    const parsedEvents = (events || []).map((e) => {
      try { return typeof e === 'string' ? JSON.parse(e) : e } catch { return null }
    }).filter(Boolean)

    const countriesCount = Array.isArray(sum.countries) ? sum.countries.length : 0

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
