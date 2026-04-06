import { describe, it, expect } from 'vitest'

const API_URL = 'http://localhost:5173/api/chat'

describe('Security — Rate Limiting', () => {
  it('allows normal request volume', async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'hi' }],
        lang: 'en',
      }),
    })
    expect(res.status).not.toBe(429)
  })
})
