import { test, expect } from '@playwright/test'

test.describe('Concise landing smoke', () => {
  test('renders hero copy and CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Concise Books/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Coming Soon/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Notify Me/i })).toBeVisible()
  })

  test('shows email capture fields', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/name/i)).toBeVisible()
  })
})
