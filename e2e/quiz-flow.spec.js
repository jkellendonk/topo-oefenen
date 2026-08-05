import { test, expect } from '@playwright/test'

const PACK_TITLE = 'Rivieren van Europa'
// Mirrors src/data/topo/rivieren_van_europa.json (kept inline to avoid a JSON import
// in the Playwright config). Default direction is "code-name": the prompt shows the
// code, the correct button is the place name.
const RIVIEREN_QUESTIONS = [
  { place: 'Theems', answer: '1' },
  { place: 'Rijn', answer: '2' },
  { place: 'Elbe', answer: '3' },
  { place: 'Oder', answer: '4' },
  { place: 'Wijsel', answer: '5' },
  { place: 'Seine', answer: '6' },
  { place: 'Loire', answer: '7' },
  { place: 'Rhône', answer: '8' },
  { place: 'Donau', answer: '9' },
  { place: 'Po', answer: '10' },
  { place: 'Douro', answer: '11' },
  { place: 'Taag', answer: '12' },
  { place: 'Ebre', answer: '13' },
]
const ANSWER_TO_PLACE = Object.fromEntries(RIVIEREN_QUESTIONS.map((q) => [q.answer, q.place]))
const PLACE_TO_ANSWER = Object.fromEntries(RIVIEREN_QUESTIONS.map((q) => [q.place, q.answer]))

async function startQuiz(page, playerName = 'E2ETest') {
  await page.goto('/')
  await page.fill('#nameInput', playerName)
  await page.locator('.pack-card', { hasText: PACK_TITLE }).click()
  await page.locator('.start-btn').click()
  await expect(page.locator('.prompt-word')).toBeVisible()
}

async function startToetsQuiz(page, playerName = 'E2ETest') {
  await page.goto('/')
  await page.fill('#nameInput', playerName)
  await page.locator('.pack-card', { hasText: PACK_TITLE }).click()
  await page.locator('.toets-btn').click()
  await expect(page.locator('.toets-btn')).toHaveClass(/active/)
  await page.locator('.start-btn').click()
  await expect(page.locator('.prompt-word')).toBeVisible()
}

async function correctOptionLocator(page) {
  const code = (await page.locator('.prompt-word').innerText()).trim()
  const place = ANSWER_TO_PLACE[code]
  return page.locator('.option-btn', { hasText: place })
}

async function answerCorrectly(page) {
  const option = await correctOptionLocator(page)
  await option.click()
  await expect(option).toHaveClass(/correct/)
  // A correct answer auto-advances after ~700ms. Wait for that transition to
  // finish (a fresh, non-disabled question, or the result screen) before the
  // next read of ".prompt-word" — otherwise it can race and read a stale question.
  await page.waitForFunction(() => {
    if (document.querySelector('.result-title')) return true
    return !!document.querySelector('.option-btn:not([disabled])')
  })
}

test('a wrong answer shows the correct place name and resets the streak', async ({ page }) => {
  await startQuiz(page)

  // Build a streak of 1 first.
  await answerCorrectly(page)
  await expect(page.locator('.streak-badge')).toContainText('1 op een rij')

  const correctOption = await correctOptionLocator(page)
  const correctText = await correctOption.innerText()
  const wrongOption = page.locator('.option-btn').filter({ hasNotText: correctText }).first()
  await wrongOption.click()

  await expect(page.locator('.msg.bad')).toContainText(correctText)
  await expect(wrongOption).toHaveClass(/wrong/)
  await expect(page.locator('.streak-badge')).toContainText('0 op een rij')
})

test('completing a full pack reaches the result screen with correct stats', async ({ page }) => {
  await startQuiz(page)

  for (let i = 0; i < RIVIEREN_QUESTIONS.length; i++) {
    await answerCorrectly(page)
  }

  await expect(page.locator('.result-title')).toContainText(PACK_TITLE)
  await expect(page.locator('.metric .mval').first()).toHaveText('100%')
  await expect(page.getByText('Nieuw persoonlijk record')).toBeVisible()
})

test('a score is saved to the board and survives a reload (localStorage)', async ({ page }) => {
  await startQuiz(page, 'BoardTester')
  for (let i = 0; i < RIVIEREN_QUESTIONS.length; i++) {
    await answerCorrectly(page)
  }
  await expect(page.locator('.result-title')).toBeVisible()

  await page.locator('button', { hasText: 'Volledig scorebord' }).click()
  await expect(page.getByText('BoardTester')).toBeVisible()

  await page.reload()
  await page.locator('button', { hasText: 'Bekijk scorebord' }).click()
  await expect(page.getByText('BoardTester')).toBeVisible()
})

test('the "Hoofdmenu" button shows a custom confirm modal, not a native popup', async ({ page }) => {
  await startQuiz(page)
  await page.locator('button', { hasText: 'Hoofdmenu' }).click()

  const modal = page.locator('.dialog-card')
  await expect(modal).toBeVisible()
  await expect(modal.locator('.dialog-title')).toHaveText('Terug naar het hoofdmenu?')

  // "Blijf oefenen" closes the modal and keeps the quiz running.
  await modal.locator('button', { hasText: 'Blijf oefenen' }).click()
  await expect(modal).not.toBeVisible()
  await expect(page.locator('.prompt-word')).toBeVisible()

  // Reopen, then confirm stopping actually returns to the start screen.
  await page.locator('button', { hasText: 'Hoofdmenu' }).click()
  await page.locator('.dialog-card button', { hasText: 'Ja, stoppen' }).click()
  await expect(page.locator('#nameInput')).toBeVisible()
})

test('Escape closes the confirm modal', async ({ page }) => {
  await startQuiz(page)
  await page.locator('button', { hasText: 'Hoofdmenu' }).click()
  await expect(page.locator('.dialog-card')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.locator('.dialog-card')).not.toBeVisible()
})

test('toets mode: asks "Waar ligt ...?" with a typed answer, clearly marked as TOETS', async ({ page }) => {
  await startToetsQuiz(page)

  await expect(page.locator('.prompt-word')).toHaveText(/^Waar ligt .+\?$/)
  await expect(page.locator('.answer-row input')).toBeVisible()
  await expect(page.locator('.options-grid')).toHaveCount(0)
  await expect(page.getByText('📝 TOETS').first()).toBeVisible()

  const question = (await page.locator('.prompt-word').innerText()).match(/^Waar ligt (.+)\?$/)[1]
  const correctCode = PLACE_TO_ANSWER[question]

  // Wrong answer first: shows the correct code and does not auto-advance.
  await page.fill('.answer-row input', '999')
  await page.locator('.check-btn').click()
  await expect(page.locator('.msg.bad')).toContainText(correctCode)
  await expect(page.locator('.answer-row input')).toHaveClass(/wrong/)

  await page.locator('.next-btn').click()
  await expect(page.locator('.prompt-word')).toHaveText(/^Waar ligt .+\?$/)
})

test('toets mode: completing the pack by typing every answer reaches the result screen', async ({ page }) => {
  await startToetsQuiz(page, 'ToetsTester')

  for (let i = 0; i < RIVIEREN_QUESTIONS.length; i++) {
    const question = (await page.locator('.prompt-word').innerText()).match(/^Waar ligt (.+)\?$/)[1]
    const code = PLACE_TO_ANSWER[question]
    await page.fill('.answer-row input', code)
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => {
      if (document.querySelector('.result-title')) return true
      const input = document.querySelector('.answer-row input')
      return !!input && !input.disabled
    })
  }

  await expect(page.locator('.result-title')).toContainText(PACK_TITLE)
  await expect(page.locator('.metric .mval').first()).toHaveText('100%')
  await expect(page.getByText('📝 TOETS')).toBeVisible()

  // The board should also flag this attempt as a toets attempt, not a plain direction.
  await page.locator('button', { hasText: 'Volledig scorebord' }).click()
  await expect(page.getByText('📝 Toets (zelf typen)')).toBeVisible()
})
