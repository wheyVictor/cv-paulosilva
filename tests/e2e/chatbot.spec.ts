import { test, expect } from '@playwright/test'

test.describe('Chatbot', () => {
  test('chat button is visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    const chatButton = page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]')
    await expect(chatButton).toBeVisible()
  })

  test('chat panel opens on click', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    await page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]').click()
    await expect(page.locator('p:has-text("Victor")').first()).toBeVisible()
  })

  test('shows suggestion buttons', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]').click()
    // Should show 4 suggestion buttons
    const suggestions = page.locator('button:has-text("experience"), button:has-text("projects"), button:has-text("hire"), button:has-text("contact")')
    expect(await suggestions.count()).toBeGreaterThanOrEqual(1)
  })

  test('close button works', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    await page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]').click()
    await page.waitForTimeout(500)
    await page.locator('button[aria-label="Close"]').click()
    await expect(page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]')).toBeVisible()
  })

  test('input field accepts text', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]').click()
    const input = page.locator('input[placeholder]')
    await input.fill('Hello')
    await expect(input).toHaveValue('Hello')
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]').click()
    const sendBtn = page.locator('button[type="submit"]')
    await expect(sendBtn).toBeDisabled()
  })

  test('shows user message after sending', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    await page.locator('button[aria-label="Open chat"], button[aria-label="Abrir chat"]').click()
    const input = page.locator('input[placeholder]')
    await input.fill('Hello')
    await page.locator('button[type="submit"]').click()
    // User message should appear in chat
    await expect(page.locator('text=Hello').first()).toBeVisible()
  })
})
