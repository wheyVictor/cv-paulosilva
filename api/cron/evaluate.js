import { getKv, todayKey } from '../_kv.js'
export const config = { runtime: 'nodejs', maxDuration: 30 }
export default async function handler(req, res) {
  return res.status(200).json({ ok: true })
}
