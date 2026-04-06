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
