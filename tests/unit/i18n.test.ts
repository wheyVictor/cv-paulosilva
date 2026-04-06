import { describe, it, expect } from 'vitest'
import { translations, seo } from '../../src/i18n'

describe('i18n', () => {
  describe('translations completeness', () => {
    it('both languages have the same top-level keys', () => {
      const ptKeys = Object.keys(translations.pt).sort()
      const enKeys = Object.keys(translations.en).sort()
      expect(ptKeys).toEqual(enKeys)
    })

    it('seo has both pt and en', () => {
      expect(seo).toHaveProperty('pt')
      expect(seo).toHaveProperty('en')
      expect(seo.pt.title).toBeTruthy()
      expect(seo.en.title).toBeTruthy()
      expect(seo.pt.description).toBeTruthy()
      expect(seo.en.description).toBeTruthy()
    })

    it('email is consistent across languages', () => {
      expect(translations.pt.email).toBe(translations.en.email)
      expect(translations.pt.email).toContain('@')
    })

    it('greeting roles exist in both languages', () => {
      expect(translations.pt.greetingRoles.length).toBeGreaterThan(0)
      expect(translations.en.greetingRoles.length).toBeGreaterThan(0)
    })
  })

  describe('no Spanish content in PT', () => {
    const ptString = JSON.stringify(translations.pt)

    it('does not contain common Spanish words', () => {
      const spanishPatterns = [
        'Hola, soy',
        'Experiencia Profesional',
        'Contacto',
        'Volver al inicio',
        'curan solos',
        'Compartiendo',
        'Privacidad',
      ]
      for (const pattern of spanishPatterns) {
        expect(ptString).not.toContain(pattern)
      }
    })
  })

  describe('no Spanish content in EN', () => {
    const enString = JSON.stringify(translations.en)

    it('does not contain common Spanish words', () => {
      const spanishPatterns = [
        'Hola',
        'Experiencia',
        'Contacto',
        'Volver',
        'curan solos',
      ]
      for (const pattern of spanishPatterns) {
        expect(enString).not.toContain(pattern)
      }
    })
  })

  describe('no santifer references', () => {
    const fullString = JSON.stringify(translations)

    it('does not contain santifer', () => {
      expect(fullString.toLowerCase()).not.toContain('santifer')
    })

    it('does not contain Santiago', () => {
      expect(fullString).not.toContain('Santiago')
    })

    it('does not contain Seville', () => {
      expect(fullString).not.toContain('Seville')
      expect(fullString).not.toContain('Sevilla')
    })
  })

  describe('observability translations', () => {
    it('pt has observability section', () => {
      expect(translations.pt).toHaveProperty('observability')
    })

    it('en has observability section', () => {
      expect(translations.en).toHaveProperty('observability')
    })
  })

  describe('experience section', () => {
    it('uses dataMeaning key (not santifer)', () => {
      expect(translations.pt.experience).toHaveProperty('dataMeaning')
      expect(translations.en.experience).toHaveProperty('dataMeaning')
      expect(translations.pt.experience).not.toHaveProperty('santifer')
    })

    it('dataMeaning has company name', () => {
      expect(translations.pt.experience.dataMeaning.company).toBeTruthy()
      expect(translations.en.experience.dataMeaning.company).toBeTruthy()
    })
  })
})
