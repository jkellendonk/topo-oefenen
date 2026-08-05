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
})
