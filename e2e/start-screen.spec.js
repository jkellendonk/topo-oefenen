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
  await expect(page.locator('.dir-btn', { hasText: 'Groep 7' })).toHaveClass(/active/)
})

test('Groep 8 shows an empty state and disables the start button', async ({ page }) => {
  await page.goto('/')
  await page.locator('.dir-btn', { hasText: 'Groep 8' }).click()

  await expect(page.locator('.pack-card')).toHaveCount(0)
  await expect(page.getByText(/Nog geen kaarten voor Groep 8/)).toBeVisible()
  await expect(page.locator('.start-btn')).toBeDisabled()
})

test('switching back to Groep 7 restores its map packs', async ({ page }) => {
  await page.goto('/')
  await page.locator('.dir-btn', { hasText: 'Groep 8' }).click()
  await expect(page.locator('.pack-card')).toHaveCount(0)

  await page.locator('.dir-btn', { hasText: 'Groep 7' }).click()
  await expect(page.locator('.pack-card .pname', { hasText: 'Landen van Europa' })).toBeVisible()
  await expect(page.locator('.start-btn')).toBeEnabled()
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
