import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StartScreen from './StartScreen.jsx'
import { getPacks } from '../api.js'

vi.mock('../api.js', () => ({
  getPacks: vi.fn(),
}))

const packs = [
  { id: 'landen_europa', title: 'Landen van Europa', count: 45 },
  { id: 'hoofdsteden_europa', title: 'Hoofdsteden van Europa', count: 45 },
]

function setup(overrides = {}) {
  const props = {
    sound: { enabled: true, toggle: vi.fn() },
    playerName: '',
    setPlayerName: vi.fn(),
    direction: 'code-name',
    setDirection: vi.fn(),
    packId: null,
    setPackId: vi.fn(),
    onStart: vi.fn(),
    onOpenBoard: vi.fn(),
    ...overrides,
  }
  render(<StartScreen {...props} />)
  return props
}

beforeEach(() => {
  getPacks.mockResolvedValue(packs)
})

describe('StartScreen', () => {
  it('loads and shows every pack with its item count', async () => {
    setup()
    expect(await screen.findByText('Landen van Europa')).toBeInTheDocument()
    expect(screen.getByText('Hoofdsteden van Europa')).toBeInTheDocument()
    expect(screen.getAllByText('45 items')).toHaveLength(2)
  })

  it('auto-selects the first pack once loaded', async () => {
    const setPackId = vi.fn()
    setup({ setPackId })
    await screen.findByText('Landen van Europa')
    expect(setPackId).toHaveBeenCalledWith('landen_europa')
  })

  it('selecting a pack calls setPackId', async () => {
    const user = userEvent.setup()
    const setPackId = vi.fn()
    setup({ setPackId, packId: 'landen_europa' })
    await user.click(await screen.findByText('Hoofdsteden van Europa'))
    expect(setPackId).toHaveBeenCalledWith('hoofdsteden_europa')
  })

  it('switching direction calls setDirection', async () => {
    const user = userEvent.setup()
    const setDirection = vi.fn()
    setup({ setDirection })
    await user.click(screen.getByText('Naam ➜ Cijfer/letter'))
    expect(setDirection).toHaveBeenCalledWith('name-code')
  })

  it('disables the start button until a pack is chosen', async () => {
    setup({ packId: null })
    await screen.findByText('Landen van Europa')
    expect(screen.getByRole('button', { name: /Start!/ })).toBeDisabled()
  })

  it('submitting the form calls onStart when a pack is selected', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    setup({ packId: 'landen_europa', onStart })
    await screen.findByText('Landen van Europa')
    await user.click(screen.getByRole('button', { name: /Start!/ }))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('opening the scoreboard calls onOpenBoard', async () => {
    const user = userEvent.setup()
    const onOpenBoard = vi.fn()
    setup({ onOpenBoard })
    await user.click(screen.getByText(/Bekijk scorebord/))
    expect(onOpenBoard).toHaveBeenCalledTimes(1)
  })

  it('choosing the Toets button calls setDirection with "toets" and shows an example hint', async () => {
    const user = userEvent.setup()
    const setDirection = vi.fn()
    setup({ setDirection })
    await user.click(screen.getByText(/Zelf typen/))
    expect(setDirection).toHaveBeenCalledWith('toets')
  })

  it('shows the typed-answer example hint once Toets is selected', async () => {
    setup({ direction: 'toets' })
    expect(screen.getByText(/Waar ligt Duitsland/)).toBeInTheDocument()
  })

  it('does not show the toets hint for the multiple-choice directions', async () => {
    setup({ direction: 'code-name' })
    expect(screen.queryByText(/Waar ligt Duitsland/)).not.toBeInTheDocument()
  })
})
