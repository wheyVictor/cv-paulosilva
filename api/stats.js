import { getKv, todayKey } from './_kv.js'
export const config = { runtime: 'nodejs', maxDuration: 10 }
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  return res.status(200).json(null)
}
