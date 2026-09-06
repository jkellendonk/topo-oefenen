import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StartScreen from './StartScreen.jsx'
import { getPacks } from '../api.js'

vi.mock('../api.js', () => ({
  getPacks: vi.fn(),
  GROUPS: ['Groep 7', 'Groep 8'],
}))

const groep7Packs = [
  { id: 'landen_europa', title: 'Landen van Europa', count: 45, group: 'Groep 7' },
  { id: 'hoofdsteden_europa', title: 'Hoofdsteden van Europa', count: 45, group: 'Groep 7' },
]
const groep8Packs = [
  { id: 'landen_azie', title: 'Landen van Azië', count: 25, group: 'Groep 8' },
  { id: 'landen_afrika_1', title: 'Landen van Afrika – deel 1', count: 26, group: 'Groep 8' },
]

function setup(overrides = {}) {
  const props = {
    sound: { enabled: true, toggle: vi.fn() },
    playerName: '',
    setPlayerName: vi.fn(),
    group: 'Groep 7',
    setGroup: vi.fn(),
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
  getPacks.mockImplementation((group) =>
    Promise.resolve(group === 'Groep 7' ? groep7Packs : group === 'Groep 8' ? groep8Packs : [])
  )
})

describe('StartScreen — group selection', () => {
  it('fetches only the selected group and shows its maps with counts', async () => {
    setup({ group: 'Groep 7' })
    expect(await screen.findByText('Landen van Europa')).toBeInTheDocument()
    expect(screen.getByText('Hoofdsteden van Europa')).toBeInTheDocument()
    expect(screen.queryByText('Landen van Azië')).not.toBeInTheDocument()
    expect(screen.getAllByText('45 items')).toHaveLength(2)
    expect(getPacks).toHaveBeenCalledWith('Groep 7')
  })

  it('shows Groep 7 and Groep 8 as choices, Groep 7 active by default', async () => {
    setup()
    await screen.findByText('Landen van Europa')
    expect(screen.getByRole('button', { name: 'Groep 7' })).toHaveClass('active')
    expect(screen.getByRole('button', { name: 'Groep 8' })).not.toHaveClass('active')
  })

  it('clicking Groep 8 calls setGroup', async () => {
    const user = userEvent.setup()
    const setGroup = vi.fn()
    setup({ setGroup })
    await user.click(screen.getByRole('button', { name: 'Groep 8' }))
    expect(setGroup).toHaveBeenCalledWith('Groep 8')
  })

  it('rendering with Groep 8 selected fetches and shows the Groep 8 maps only', async () => {
    setup({ group: 'Groep 8' })
    expect(await screen.findByText('Landen van Azië')).toBeInTheDocument()
    expect(screen.getByText('Landen van Afrika – deel 1')).toBeInTheDocument()
    expect(screen.queryByText('Landen van Europa')).not.toBeInTheDocument()
    expect(getPacks).toHaveBeenCalledWith('Groep 8')
  })

  it('changing the group prop re-fetches, clears the old selection and auto-selects the new first map', async () => {
    const setPackId = vi.fn()
    const { rerender } = renderRerenderable({ group: 'Groep 7', setPackId })
    await screen.findByText('Landen van Europa')
    expect(setPackId).toHaveBeenCalledWith('landen_europa')

    setPackId.mockClear()
    rerender({ group: 'Groep 8', setPackId })
    await screen.findByText('Landen van Azië')
    expect(setPackId).toHaveBeenCalledWith(null) // old selection dropped
    expect(setPackId).toHaveBeenCalledWith('landen_azie') // new group's first map
  })

  it('auto-selects the first map of the current group on mount', async () => {
    const setPackId = vi.fn()
    setup({ setPackId })
    await screen.findByText('Landen van Europa')
    expect(setPackId).toHaveBeenCalledWith('landen_europa')
  })

  it('selecting a map calls setPackId and marks it active', async () => {
    const user = userEvent.setup()
    const setPackId = vi.fn()
    setup({ setPackId, packId: 'landen_europa' })
    await user.click(await screen.findByText('Hoofdsteden van Europa'))
    expect(setPackId).toHaveBeenCalledWith('hoofdsteden_europa')
    expect(screen.getByText('Landen van Europa').closest('.pack-card')).toHaveClass('active')
  })

  it('shows an empty state and disables Start when the chosen group has no maps', async () => {
    setup({ group: 'Groep 12' })
    expect(await screen.findByText(/Nog geen kaarten voor Groep 12/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start!/ })).toBeDisabled()
  })
})

describe('StartScreen — practice form', () => {
  it('switching direction calls setDirection', async () => {
    const user = userEvent.setup()
    const setDirection = vi.fn()
    setup({ setDirection })
    await user.click(screen.getByText('Naam ➜ Cijfer/letter'))
    expect(setDirection).toHaveBeenCalledWith('name-code')
  })

  it('choosing the Toets button calls setDirection with "toets"', async () => {
    const user = userEvent.setup()
    const setDirection = vi.fn()
    setup({ setDirection })
    await user.click(screen.getByText(/Zelf typen/))
    expect(setDirection).toHaveBeenCalledWith('toets')
  })

  it('shows the typed-answer example hint only once Toets is selected', async () => {
    setup({ direction: 'toets' })
    expect(screen.getByText(/Waar ligt Duitsland/)).toBeInTheDocument()
  })

  it('does not show the toets hint for the multiple-choice directions', async () => {
    setup({ direction: 'code-name' })
    expect(screen.queryByText(/Waar ligt Duitsland/)).not.toBeInTheDocument()
  })

  it('disables the start button until a map is chosen', async () => {
    setup({ packId: null })
    await screen.findByText('Landen van Europa')
    expect(screen.getByRole('button', { name: /Start!/ })).toBeDisabled()
  })

  it('submitting the form calls onStart when a map is selected', async () => {
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
})

// Helper: render StartScreen so the same instance can be re-rendered with new props
// (needed to exercise the group-change effect).
function renderRerenderable(initial = {}) {
  const base = {
    sound: { enabled: true, toggle: vi.fn() },
    playerName: '',
    setPlayerName: vi.fn(),
    group: 'Groep 7',
    setGroup: vi.fn(),
    direction: 'code-name',
    setDirection: vi.fn(),
    packId: null,
    setPackId: vi.fn(),
    onStart: vi.fn(),
    onOpenBoard: vi.fn(),
    ...initial,
  }
  const utils = render(<StartScreen {...base} />)
  return {
    ...utils,
    rerender: (next) => utils.rerender(<StartScreen {...base} {...next} />),
  }
}
