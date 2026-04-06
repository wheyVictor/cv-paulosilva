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
  }

  return res.status(204).end()
}
