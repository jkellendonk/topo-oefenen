import { test, expect } from '@playwright/test'

test('shows the app title and all 5 map packs by default', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Topo Oefenen')
  await expect(page.locator('h1')).toHaveText('Topo Oefenen')

  const packTitles = [
    'Landen van Europa',
    'Hoofdsteden van Europa',
    'Rivieren van Europa',
    'Gebergten en Wateren van Europa',
    'Zeeën en meren van Europa',
  ]
  for (const title of packTitles) {
    await expect(page.locator('.pack-card .pname', { hasText: title })).toBeVisible()
  }
  await expect(page.locator('.dir-btn', { hasText: 'Cijfer/letter ➜ Naam' })).toHaveClass(/active/)
})

test('switching direction toggles the active button', async ({ page }) => {
  await page.goto('/')
  await page.locator('.dir-btn', { hasText: 'Naam ➜ Cijfer/letter' }).click()

  await expect(page.locator('.dir-btn', { hasText: 'Naam ➜ Cijfer/letter' })).toHaveClass(/active/)
  await expect(page.locator('.dir-btn', { hasText: 'Cijfer/letter ➜ Naam' })).not.toHaveClass(/active/)
})

test('board screen shows an empty state when nothing has been played yet', async ({ page }) => {
  await page.goto('/')
  await page.locator('button', { hasText: 'Bekijk scorebord' }).click()
  await expect(page.getByText('Hier komt de voortgang te staan')).toBeVisible()
})
