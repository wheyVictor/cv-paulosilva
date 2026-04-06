import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useObservabilityData } from '../../src/use-observability-data'

describe('useObservabilityData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns loading true initially', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}) // never resolves
    )
    const { result } = renderHook(() => useObservabilityData())
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
  })

  it('returns API data on success', async () => {
    const mockData = {
      kpis: { visitors: 500, countries: 10, conversations: 50 },
      timeSeries: [{ date: '04/01', views: 100, chats: 5, tokenCost: 0.01 }],
      countries: [{ key: 'BR', value: 200 }],
      sources: [{ key: 'direct', value: 100 }],
      theme: { dark: 70, light: 30 },
      lang: { pt: 60, en: 40 },
      events: [{ time: '14:00:00', event: 'page loaded', source: 'web' }],
      updatedAt: '2026-04-06T08:00:00Z',
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response)

    const { result } = renderHook(() => useObservabilityData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBe(null)
  })

  it('returns null data on fetch failure (fallback)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useObservabilityData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe('Network error')
  })

  it('returns null data when API returns null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(null),
    } as Response)

    const { result } = renderHook(() => useObservabilityData())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBe(null)
  })
})
