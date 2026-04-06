import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads and shows Paulo Silva', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=Paulo Silva')).toBeVisible()
  })

  test('has correct page title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Paulo Silva/)
  })

  test('shows all main sections', async ({ page }) => {
    await page.goto('/')

    // Experience section
    await expect(page.locator('#experience')).toBeAttached()

    // Projects section
    await expect(page.locator('#projects')).toBeAttached()

    // Education section
    await expect(page.locator('#education')).toBeAttached()

    // Contact section
    await expect(page.locator('#contact')).toBeAttached()
  })

  test('shows Data Meaning as employer', async ({ page }) => {
    await page.goto('/')
    const dm = page.locator('text=Data Meaning').first()
    await dm.scrollIntoViewIfNeeded()
    await expect(dm).toBeVisible()
  })

  test('no empty visible sections', async ({ page }) => {
    await page.goto('/')
    // Check no cards with empty text content
    const emptyCards = page.locator('.rounded-2xl:has(h3:empty), .rounded-2xl:has(h4:empty)')
    expect(await emptyCards.count()).toBe(0)
  })
})

test.describe('Language switching', () => {
  test('EN page loads at /', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator("text=Hi, I'm")).toBeVisible()
  })

  test('PT page loads at /pt', async ({ page }) => {
    await page.goto('/pt')
    await expect(page.locator('text=Olá, eu sou')).toBeVisible()
  })

  test('language toggle switches from EN to PT', async ({ page }) => {
    await page.goto('/')
    // Click the PT button (flag toggle)
    await page.locator('a:has-text("PT")').first().click()
    await expect(page).toHaveURL('/pt')
    await expect(page.locator('text=Olá, eu sou')).toBeVisible()
  })

  test('language toggle switches from PT to EN', async ({ page }) => {
    await page.goto('/pt')
    await page.locator('a:has-text("EN")').first().click()
    await expect(page).toHaveURL('/')
    await expect(page.locator("text=Hi, I'm")).toBeVisible()
  })
})

test.describe('Theme toggle', () => {
  test('theme toggle changes theme class', async ({ page }) => {
    await page.goto('/')
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class') || ''
    await page.locator('button[aria-label="Toggle theme"]').click()
    const newClass = await html.getAttribute('class') || ''
    // Class should have changed
    expect(newClass).not.toBe(initialClass)
  })
})

test.describe('Navigation', () => {
  test('about page loads (EN)', async ({ page }) => {
    await page.goto('/about')
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toContainText('Paulo')
  })

  test('about page loads (PT)', async ({ page }) => {
    await page.goto('/sobre-mim')
    await page.waitForTimeout(1000)
    await expect(page.locator('body')).toContainText('Paulo')
  })

  test('privacy page loads (EN)', async ({ page }) => {
    await page.goto('/privacy')
    // Privacy page should load without error
    await expect(page.locator('body')).toBeVisible()
  })

  test('404 page shows for unknown routes', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await expect(page.locator('text=404')).toBeVisible()
  })

  test('404 page has back link', async ({ page }) => {
    await page.goto('/nonexistent-page')
    const backLink = page.locator('a:has-text("Back to home"), a:has-text("Voltar")')
    await expect(backLink).toBeVisible()
  })
})

test.describe('No santifer references', () => {
  test('homepage has no santifer text', async ({ page }) => {
    await page.goto('/')
    const content = await page.textContent('body')
    expect(content?.toLowerCase()).not.toContain('santifer')
    expect(content?.toLowerCase()).not.toContain('santiago')
  })

  test('PT homepage has no santifer text', async ({ page }) => {
    await page.goto('/pt')
    const content = await page.textContent('body')
    expect(content?.toLowerCase()).not.toContain('santifer')
    expect(content?.toLowerCase()).not.toContain('santiago')
  })
})
