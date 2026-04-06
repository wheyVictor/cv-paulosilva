import Redis from 'ioredis'

/** Lazy-initialized Redis client. Returns null if env var is missing. */
let _kv = null
export function getKv() {
  if (_kv) return _kv
  const url = process.env.obs_redis_REDIS_URL
  if (!url) return null
  _kv = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true })
  return _kv
}

/** Today's date as YYYY-MM-DD */
export function todayKey() {
  return new Date().toISOString().slice(0, 10)
}
