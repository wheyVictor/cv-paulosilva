import { describe, it, expect, vi } from 'vitest'

describe('/api/stats smoke test', () => {
  it('stats module exports a handler function', async () => {
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
