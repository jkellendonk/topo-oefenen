import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BoardScreen from './BoardScreen.jsx'
import { getScores } from '../api.js'

vi.mock('../api.js', () => ({
  getScores: vi.fn(),
}))

function renderBoard(onBack = vi.fn()) {
  return render(<BoardScreen sound={{ enabled: true, toggle: vi.fn() }} onBack={onBack} />)
}

describe('BoardScreen', () => {
  it('shows an empty state when no scores exist yet', async () => {
    getScores.mockResolvedValue([])
    renderBoard()
    expect(await screen.findByText(/Hier komt de voortgang te staan/)).toBeInTheDocument()
  })

  it('groups scores by player and marks the first attempt', async () => {
    getScores.mockResolvedValue([
      {
        id: 1,
        playerName: 'Sam',
        packId: 'landen_europa',
        direction: 'code-name',
        accuracy: 80,
        timeSeconds: 90,
        createdAt: '2026-01-01T00:00:00.000Z',
        pack: { title: 'Landen van Europa' },
      },
    ])
    renderBoard()
    expect(await screen.findByText('👤 Sam')).toBeInTheDocument()
    expect(screen.getByText('Landen van Europa')).toBeInTheDocument()
    expect(screen.getByText('eerste poging')).toBeInTheDocument()
  })

  it('shows a delta arrow when a player retries the same pack and direction', async () => {
    getScores.mockResolvedValue([
      {
        id: 1,
        playerName: 'Sam',
        packId: 'landen_europa',
        direction: 'code-name',
        accuracy: 60,
        timeSeconds: 120,
        createdAt: '2026-01-01T00:00:00.000Z',
        pack: { title: 'Landen van Europa' },
      },
      {
        id: 2,
        playerName: 'Sam',
        packId: 'landen_europa',
        direction: 'code-name',
        accuracy: 90,
        timeSeconds: 90,
        createdAt: '2026-01-02T00:00:00.000Z',
        pack: { title: 'Landen van Europa' },
      },
    ])
    renderBoard()
    await screen.findByText('👤 Sam')
    expect(screen.getByText(/▲ 30%/)).toBeInTheDocument()
  })
})
