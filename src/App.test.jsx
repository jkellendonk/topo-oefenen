import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import rivierenData from './data/topo/rivieren_van_europa.json'

// answer (code shown as the prompt in the default "code-name" direction) -> place (the correct button label)
const RIVIEREN_ANSWER_TO_PLACE = Object.fromEntries(
  rivierenData.questions.map((q) => [q.answer, q.place])
)

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('navigates start -> quiz -> back to start via the confirm modal', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Naam'), 'Sam')
    await user.click(await screen.findByText('Landen van Europa'))
    await user.click(screen.getByRole('button', { name: /Start!/ }))

    expect(await screen.findByText(/Sam/)).toBeInTheDocument()
    expect(document.querySelector('.prompt-word')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Hoofdmenu/ }))
    await user.click(screen.getByText('Ja, stoppen'))
    expect(await screen.findByLabelText('Naam')).toBeInTheDocument()
  })

  it('opens the scoreboard from the start screen and shows the empty state', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByText(/Bekijk scorebord/))
    expect(await screen.findByText(/Hier komt de voortgang te staan/)).toBeInTheDocument()
  })

  it('completes a full quiz and reaches Result -> Board with the saved score', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByLabelText('Naam'), 'Robin')
    // Rivieren van Europa is the smallest pack (13 items), keeping this test fast.
    await user.click(await screen.findByText('Rivieren van Europa'))
    await user.click(screen.getByRole('button', { name: /Start!/ }))
    expect(await screen.findByText(/Robin/)).toBeInTheDocument()

    // Switch to fake timers only for the answer loop, so the ~700ms auto-advance
    // after a correct answer doesn't make this test slow.
    vi.useFakeTimers()
    try {
      for (let i = 0; i < rivierenData.questions.length && !document.querySelector('.result-title'); i++) {
        const shownCode = document.querySelector('.prompt-word').textContent
        const correctPlace = RIVIEREN_ANSWER_TO_PLACE[shownCode]
        const options = [...document.querySelectorAll('.option-btn')]
        const correctBtn = options.find((o) => o.textContent === correctPlace)
        act(() => {
          fireEvent.click(correctBtn)
        })
        act(() => {
          vi.advanceTimersByTime(700)
        })
      }

      expect(document.querySelector('.result-title')).toHaveTextContent('Rivieren van Europa')
    } finally {
      vi.useRealTimers()
    }

    // Wait for ResultScreen's async postScore() effect to finish writing to
    // localStorage before navigating away to the scoreboard.
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('topo-oefenen-scores-v1') || '[]')
      expect(saved).toHaveLength(1)
    })

    await user.click(screen.getByText(/Volledig scorebord/))
    expect(screen.getByText('👤 Robin')).toBeInTheDocument()
    expect(screen.getByText('Rivieren van Europa')).toBeInTheDocument()
  })
})
