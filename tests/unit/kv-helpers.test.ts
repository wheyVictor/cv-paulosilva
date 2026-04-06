import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
