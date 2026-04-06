import { describe, it, expect } from 'vitest'
import {
  generateTimeSeries,
  generateCountryData,
  generateSourceData,
  generateKpis,
} from '../../src/observability-data'

describe('observability-data', () => {
  describe('generateTimeSeries', () => {
    it('generates correct number of data points', () => {
      expect(generateTimeSeries(7)).toHaveLength(7)
      expect(generateTimeSeries(30)).toHaveLength(30)
      expect(generateTimeSeries(90)).toHaveLength(90)
    })

    it('each point has required fields', () => {
      const data = generateTimeSeries(7)
      for (const point of data) {
        expect(point).toHaveProperty('date')
        expect(point).toHaveProperty('views')
        expect(point).toHaveProperty('chats')
        expect(point).toHaveProperty('tokenCost')
        expect(typeof point.views).toBe('number')
        expect(typeof point.chats).toBe('number')
        expect(point.views).toBeGreaterThan(0)
        expect(point.chats).toBeGreaterThanOrEqual(0)
      }
    })

    it('tokenCost is cumulative (non-decreasing)', () => {
      const data = generateTimeSeries(30)
      for (let i = 1; i < data.length; i++) {
        expect(data[i].tokenCost).toBeGreaterThanOrEqual(data[i - 1].tokenCost)
      }
    })

    it('is deterministic within the same day', () => {
      const a = generateTimeSeries(7)
      const b = generateTimeSeries(7)
      expect(a).toEqual(b)
    })

    it('date format is MM/DD', () => {
      const data = generateTimeSeries(7)
      for (const point of data) {
        expect(point.date).toMatch(/^\d{2}\/\d{2}$/)
      }
    })
  })

  describe('generateCountryData', () => {
    const labels = { BR: 'Brazil', US: 'US', PT: 'Portugal', UK: 'UK', DE: 'Germany', ES: 'Spain' }

    it('returns 6 countries', () => {
      expect(generateCountryData(labels)).toHaveLength(6)
    })

    it('each country has name, key, value', () => {
      for (const c of generateCountryData(labels)) {
        expect(c).toHaveProperty('name')
        expect(c).toHaveProperty('key')
        expect(c).toHaveProperty('value')
        expect(c.value).toBeGreaterThan(0)
      }
    })

    it('is sorted by value descending', () => {
      const data = generateCountryData(labels)
      for (let i = 1; i < data.length; i++) {
        expect(data[i].value).toBeLessThanOrEqual(data[i - 1].value)
      }
    })

    it('uses provided labels', () => {
      const data = generateCountryData(labels)
      const brEntry = data.find(d => d.key === 'BR')
      expect(brEntry?.name).toBe('Brazil')
    })
  })

  describe('generateSourceData', () => {
    const labels = { direct: 'Direct', linkedin: 'LinkedIn', github: 'GitHub', search: 'Search', other: 'Other' }

    it('returns 5 sources', () => {
      expect(generateSourceData(labels)).toHaveLength(5)
    })

    it('is sorted by value descending', () => {
      const data = generateSourceData(labels)
      for (let i = 1; i < data.length; i++) {
        expect(data[i].value).toBeLessThanOrEqual(data[i - 1].value)
      }
    })
  })

  describe('generateKpis', () => {
    it('returns visitors, countries, conversations', () => {
      const kpis = generateKpis()
      expect(kpis).toHaveProperty('visitors')
      expect(kpis).toHaveProperty('countries')
      expect(kpis).toHaveProperty('conversations')
    })

    it('visitors is in reasonable range', () => {
      const { visitors } = generateKpis()
      expect(visitors).toBeGreaterThan(10000)
      expect(visitors).toBeLessThan(15000)
    })

    it('countries is fixed at 23', () => {
      expect(generateKpis().countries).toBe(23)
    })

    it('conversations is in reasonable range', () => {
      const { conversations } = generateKpis()
      expect(conversations).toBeGreaterThan(700)
      expect(conversations).toBeLessThan(1000)
    })
  })
})
