import { test, expect } from '@playwright/test'

const GROEP_7_PACKS = [
  'Landen van Europa',
  'Hoofdsteden van Europa',
  'Rivieren van Europa',
  'Gebergten en Wateren van Europa',
  'Zeeën en meren van Europa',
]
const GROEP_8_PACKS = [
  'Landen van Noord-Amerika',
  'Landen van Midden-Amerika',
  'Landen van Zuid-Amerika',
  'Landen van Azië',
  'Landen van Oceanië',
  'Landen van Afrika – deel 1',
  'Landen van Afrika – deel 2',
]

test('shows the app title and the Groep 7 map packs by default', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Topo Oefenen')
  await expect(page.locator('h1')).toHaveText('Topo Oefenen')

  for (const title of GROEP_7_PACKS) {
    await expect(page.locator('.pack-card .pname', { hasText: title })).toBeVisible()
  }
  await expect(page.locator('.pack-card')).toHaveCount(GROEP_7_PACKS.length)
  await expect(page.locator('.dir-btn', { hasText: 'Cijfer/letter ➜ Naam' })).toHaveClass(/active/)
  await expect(page.locator('.dir-btn', { hasText: 'Groep 7' })).toHaveClass(/active/)
})

test('selecting Groep 8 shows its werelddeel map packs and keeps Start enabled', async ({ page }) => {
  await page.goto('/')
  await page.locator('.dir-btn', { hasText: 'Groep 8' }).click()

  await expect(page.locator('.dir-btn', { hasText: 'Groep 8' })).toHaveClass(/active/)
  for (const title of GROEP_8_PACKS) {
    await expect(page.locator('.pack-card .pname', { hasText: title })).toBeVisible()
  }
  await expect(page.locator('.pack-card')).toHaveCount(GROEP_8_PACKS.length)
  await expect(page.locator('.pack-card .pname', { hasText: 'Landen van Europa' })).toHaveCount(0)
  // First map of the group is auto-selected, so the quiz can start straight away.
  await expect(page.locator('.pack-card.active')).toHaveCount(1)
  await expect(page.locator('.start-btn')).toBeEnabled()
})

test('switching group swaps the map packs both ways', async ({ page }) => {
  await page.goto('/')

  await page.locator('.dir-btn', { hasText: 'Groep 8' }).click()
  await expect(page.locator('.pack-card .pname', { hasText: 'Landen van Azië' })).toBeVisible()
  await expect(page.locator('.pack-card')).toHaveCount(GROEP_8_PACKS.length)

  await page.locator('.dir-btn', { hasText: 'Groep 7' }).click()
  await expect(page.locator('.pack-card .pname', { hasText: 'Landen van Europa' })).toBeVisible()
  await expect(page.locator('.pack-card')).toHaveCount(GROEP_7_PACKS.length)
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
