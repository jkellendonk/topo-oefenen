import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultScreen from './ResultScreen.jsx'
import { getScores, postScore } from '../api.js'

vi.mock('../api.js', () => ({
  getScores: vi.fn(),
  postScore: vi.fn(),
}))

const pack = { id: 'landen_europa', title: 'Landen van Europa' }
const result = { accuracy: 92, timeSeconds: 65, mistakes: 2, bestStreak: 10, stars: 3 }

function renderResult(overrides = {}) {
  return render(
    <ResultScreen
      pack={pack}
      direction="code-name"
      playerName="Sam"
      result={result}
      sound={{ enabled: true, toggle: vi.fn() }}
      onPlayAgain={vi.fn()}
      onChangePack={vi.fn()}
      onOpenBoard={vi.fn()}
      {...overrides}
    />
  )
}

beforeEach(() => {
  getScores.mockResolvedValue([])
  postScore.mockResolvedValue({})
})

describe('ResultScreen', () => {
  it('shows stars, metrics and posts the score once', async () => {
    renderResult()
    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText('1:05')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(await screen.findByText(/Nieuw persoonlijk record/)).toBeInTheDocument()
    expect(postScore).toHaveBeenCalledTimes(1)
    expect(postScore).toHaveBeenCalledWith(
      expect.objectContaining({ playerName: 'Sam', packId: 'landen_europa', direction: 'code-name' })
    )
  })

  it('does not show a record banner when a better prior score exists', async () => {
    getScores.mockResolvedValue([
      {
        id: 1,
        playerName: 'Sam',
        packId: 'landen_europa',
        direction: 'code-name',
        accuracy: 100,
        timeSeconds: 10,
        pack: { title: 'Landen van Europa' },
      },
    ])
    renderResult()
    await screen.findByText('Landen van Europa', { exact: false })
    expect(screen.queryByText(/Nieuw persoonlijk record/)).not.toBeInTheDocument()
  })

  it('celebrates a flawless round instead of saying "bijna alles"', () => {
    renderResult({ result: { ...result, accuracy: 100, mistakes: 0 } })
    expect(screen.getByText(/Foutloos! Alles in één keer goed/)).toBeInTheDocument()
    expect(screen.queryByText(/Bijna alles in één keer goed/)).not.toBeInTheDocument()
  })

  it('still says "bijna alles" for a strong-but-not-perfect 3-star round', () => {
    renderResult({ result: { ...result, accuracy: 92 } })
    expect(screen.getByText(/Bijna alles in één keer goed/)).toBeInTheDocument()
    expect(screen.queryByText(/Foutloos/)).not.toBeInTheDocument()
  })

  it('shows a TOETS badge when the result came from the typed toets mode', () => {
    renderResult({ direction: 'toets' })
    expect(screen.getByText('📝 TOETS')).toBeInTheDocument()
  })

  it('does not show a TOETS badge for the multiple-choice directions', () => {
    renderResult({ direction: 'code-name' })
    expect(screen.queryByText('📝 TOETS')).not.toBeInTheDocument()
  })

  it('shows a "Nog even oefenen" review list when the round had missed items', () => {
    renderResult({
      result: { ...result, missed: [{ place: 'Duitsland', answer: '14' }, { place: 'Polen', answer: '19' }] },
    })
    expect(screen.getByText('🔍 Nog even oefenen')).toBeInTheDocument()
    expect(screen.getByText('Duitsland')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('Polen')).toBeInTheDocument()
  })

  it('does not show the review section when nothing was missed', () => {
    renderResult({ result: { ...result, missed: [] } })
    expect(screen.queryByText('🔍 Nog even oefenen')).not.toBeInTheDocument()
  })

  it('never sends the ephemeral "missed" list to score storage', async () => {
    renderResult({ result: { ...result, missed: [{ place: 'Duitsland', answer: '14' }] } })
    await screen.findByText(/Nieuw persoonlijk record/)
    const [savedScore] = postScore.mock.calls[0]
    expect(savedScore.missed).toBeUndefined()
  })
})
