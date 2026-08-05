import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, act, fireEvent } from '@testing-library/react'
import QuizScreen from './QuizScreen.jsx'

vi.mock('../utils.js', async (importOriginal) => {
  const actual = await importOriginal()
  // Deterministic "shuffle" (identity) so the quiz order and MCQ options are predictable in tests.
  return { ...actual, shuffle: (arr) => [...arr] }
})

const pack = {
  id: 'test_pack',
  title: 'Landen van Europa',
  image: 'test.jpeg',
  questions: [
    { id: 0, place: 'IJsland', answer: '1' },
    { id: 1, place: 'Noorwegen', answer: '2' },
    { id: 2, place: 'Zweden', answer: '3' },
    { id: 3, place: 'Finland', answer: '4' },
    { id: 4, place: 'Ierland', answer: '5' },
    { id: 5, place: 'Schotland', answer: '6' },
  ],
}

function makeSound() {
  return {
    enabled: true,
    toggle: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
    playStreak: vi.fn(),
    playFinish: vi.fn(),
  }
}

function renderQuiz(overrides = {}) {
  const onFinish = vi.fn()
  const onBackToMenu = vi.fn()
  const sound = makeSound()
  render(
    <QuizScreen
      pack={pack}
      direction="code-name"
      playerName="Sam"
      sound={sound}
      onFinish={onFinish}
      onBackToMenu={onBackToMenu}
      {...overrides}
    />
  )
  return { onFinish, onBackToMenu, sound }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('QuizScreen', () => {
  it('shows the map image, the prompt and 4 unique answer options', () => {
    renderQuiz()
    expect(screen.getByRole('img', { name: 'Landen van Europa' })).toHaveAttribute('src', 'test.jpeg')
    expect(screen.getByText('1')).toBeInTheDocument() // prompt-word for the first (identity-shuffled) question
    const options = screen.getByText('IJsland').closest('.options-grid').querySelectorAll('.option-btn')
    expect(options).toHaveLength(4)
    const labels = [...options].map((o) => o.textContent)
    expect(new Set(labels).size).toBe(4)
    expect(labels).toContain('IJsland')
  })

  it('a correct answer shows positive feedback, grows the streak, and auto-advances', () => {
    renderQuiz()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'IJsland' }))
    })
    expect(screen.getByRole('button', { name: 'IJsland' })).toHaveClass('correct')
    expect(screen.getByText('1 op een rij', { exact: false })).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(700)
    })
    // Advanced to the next (identity-shuffled) question: Noorwegen / "2"
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('a wrong answer shows the correct answer and requires the Volgende button', () => {
    renderQuiz()

    // Correct answer for the first (identity-shuffled) question is IJsland; the
    // distractor set is randomized, so pick whichever option isn't the correct one.
    const wrongOption = screen
      .getAllByRole('button')
      .find((btn) => btn.classList.contains('option-btn') && btn.textContent !== 'IJsland')
    act(() => {
      fireEvent.click(wrongOption)
    })
    expect(wrongOption).toHaveClass('wrong')
    expect(screen.getByRole('button', { name: 'IJsland' })).toHaveClass('correct')
    expect(screen.getByText(/Het juiste antwoord is/)).toBeInTheDocument()

    const nextBtn = screen.getByRole('button', { name: /Volgende/ })
    expect(nextBtn).toBeEnabled()
    act(() => {
      fireEvent.click(nextBtn)
    })
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('clicking "Hoofdmenu" opens a styled confirm modal instead of a native confirm', () => {
    const { onBackToMenu } = renderQuiz()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Hoofdmenu/ }))
    })
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Terug naar het hoofdmenu?')).toBeInTheDocument()

    act(() => {
      fireEvent.click(within(dialog).getByText('Blijf oefenen'))
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Hoofdmenu/ }))
    })
    act(() => {
      fireEvent.click(screen.getByText('Ja, stoppen'))
    })
    expect(onBackToMenu).toHaveBeenCalledTimes(1)
  })

  it('finishing every question calls onFinish with accuracy-based stars', () => {
    const { onFinish, sound } = renderQuiz()

    const correctByPrompt = { 1: 'IJsland', 2: 'Noorwegen', 3: 'Zweden', 4: 'Finland', 5: 'Ierland', 6: 'Schotland' }
    for (let i = 0; i < pack.questions.length; i++) {
      const shown = document.querySelector('.prompt-word').textContent
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: correctByPrompt[shown] }))
      })
      act(() => {
        vi.advanceTimersByTime(700)
      })
    }

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ accuracy: 100, mistakes: 0, stars: 3 })
    )
    expect(sound.playFinish).toHaveBeenCalledTimes(1)
  })
})

describe('QuizScreen — toets (typed) mode', () => {
  it('shows a "Waar ligt ...?" question, a text input, and a TOETS badge instead of multiple choice', () => {
    renderQuiz({ direction: 'toets' })
    expect(screen.getByText('Waar ligt IJsland?')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/typ hier/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Noorwegen' })).not.toBeInTheDocument()
    expect(screen.getAllByText('📝 TOETS').length).toBeGreaterThan(0)
  })

  it('a correct typed answer (case/whitespace-insensitive) advances automatically', () => {
    renderQuiz({ direction: 'toets' })

    const input = screen.getByPlaceholderText(/typ hier/)
    fireEvent.change(input, { target: { value: '  1  ' } })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Controleer' }))
    })
    expect(input).toHaveClass('correct')
    expect(input).toBeDisabled()

    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByText('Waar ligt Noorwegen?')).toBeInTheDocument()
  })

  it('a wrong typed answer shows the correct code and requires Volgende', () => {
    renderQuiz({ direction: 'toets' })

    const input = screen.getByPlaceholderText(/typ hier/)
    fireEvent.change(input, { target: { value: '99' } })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Controleer' }))
    })
    expect(input).toHaveClass('wrong')
    expect(screen.getByText(/Het juiste antwoord is/)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Volgende/ }))
    })
    expect(screen.getByText('Waar ligt Noorwegen?')).toBeInTheDocument()
  })

  it('pressing Enter submits the typed answer', () => {
    renderQuiz({ direction: 'toets' })

    const input = screen.getByPlaceholderText(/typ hier/)
    fireEvent.change(input, { target: { value: '1' } })
    act(() => {
      fireEvent.keyDown(document, { key: 'Enter' })
    })
    expect(input).toHaveClass('correct')
  })

  it('the Controleer button stays disabled until something is typed', () => {
    renderQuiz({ direction: 'toets' })
    expect(screen.getByRole('button', { name: 'Controleer' })).toBeDisabled()
  })
})
