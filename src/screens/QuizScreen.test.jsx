import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, act, fireEvent } from '@testing-library/react'
import QuizScreen from './QuizScreen.jsx'
import { loadQuizSession } from '../sessionStore.js'

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
  sessionStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('QuizScreen', () => {
  it('shows the map image, the prompt and 4 unique answer options', () => {
    renderQuiz()
    expect(screen.getByRole('img', { name: 'Landen van Europa' })).toHaveAttribute('src', 'test.jpeg')
    // prompt-word for the first (identity-shuffled) question; scoped since the option-key
    // hint badges always show "1"-"4" too, regardless of which question is active.
    expect(screen.getByText('1', { selector: '.prompt-word' })).toBeInTheDocument()
    const options = screen.getByText('IJsland').closest('.options-grid').querySelectorAll('.option-btn')
    expect(options).toHaveLength(4)
    const labels = [...options].map((o) => o.querySelector('.option-label').textContent)
    expect(new Set(labels).size).toBe(4)
    expect(labels).toContain('IJsland')
    // Each option is hinted with its 1-4 keyboard shortcut (hidden from the accessible name).
    const keyHints = [...options].map((o) => o.querySelector('.option-key').textContent)
    expect(keyHints).toEqual(['1', '2', '3', '4'])
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
    expect(screen.getByText('2', { selector: '.prompt-word' })).toBeInTheDocument()
  })

  it('a wrong answer shows the correct answer and requires the Volgende button', () => {
    renderQuiz()

    // Correct answer for the first (identity-shuffled) question is IJsland; the
    // distractor set is randomized, so pick whichever option isn't the correct one.
    const wrongOption = screen
      .getAllByRole('button')
      .find(
        (btn) =>
          btn.classList.contains('option-btn') &&
          btn.querySelector('.option-label').textContent !== 'IJsland'
      )
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
    expect(screen.getByText('2', { selector: '.prompt-word' })).toBeInTheDocument()
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

  it('pressing a number key (1-4) selects the matching multiple-choice option', () => {
    renderQuiz()

    const options = [...document.querySelectorAll('.option-btn')]
    const secondLabel = options[1].querySelector('.option-label').textContent
    act(() => {
      fireEvent.keyDown(document, { key: '2' })
    })
    expect(screen.getByText(secondLabel).closest('.option-btn')).toHaveClass(
      secondLabel === 'IJsland' ? 'correct' : 'wrong'
    )
  })

  it('reports every ever-missed question in onFinish, even after it was later mastered', () => {
    const { onFinish } = renderQuiz()

    // Answer the first (IJsland) question wrong, then correctly on retry, then finish the rest correctly.
    const wrongOption = screen
      .getAllByRole('button')
      .find(
        (btn) =>
          btn.classList.contains('option-btn') &&
          btn.querySelector('.option-label').textContent !== 'IJsland'
      )
    act(() => {
      fireEvent.click(wrongOption)
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Volgende/ }))
    })

    const correctByPrompt = { 1: 'IJsland', 2: 'Noorwegen', 3: 'Zweden', 4: 'Finland', 5: 'Ierland', 6: 'Schotland' }
    while (!onFinish.mock.calls.length) {
      const shown = document.querySelector('.prompt-word').textContent
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: correctByPrompt[shown] }))
      })
      act(() => {
        vi.advanceTimersByTime(700)
      })
    }

    expect(onFinish).toHaveBeenCalledWith(
      expect.objectContaining({ missed: [{ place: 'IJsland', answer: '1' }] })
    )
  })

  it('persists progress to sessionStorage after every answer, and clears it once finished', () => {
    renderQuiz()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'IJsland' }))
    })
    let saved = loadQuizSession()
    expect(saved.packId).toBe('test_pack')
    expect(saved.quizState.mastered).toEqual([0])

    act(() => {
      vi.advanceTimersByTime(700)
    })
    saved = loadQuizSession()
    expect(saved.quizState.activeIndex).toBe(1)

    const correctByPrompt = { 1: 'IJsland', 2: 'Noorwegen', 3: 'Zweden', 4: 'Finland', 5: 'Ierland', 6: 'Schotland' }
    while (loadQuizSession()) {
      const shown = document.querySelector('.prompt-word')?.textContent
      if (!shown) break
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: correctByPrompt[shown] }))
      })
      act(() => {
        vi.advanceTimersByTime(700)
      })
    }
    expect(loadQuizSession()).toBeNull()
  })

  it('clears the saved session when the player confirms stopping via the Hoofdmenu modal', () => {
    renderQuiz()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'IJsland' }))
    })
    expect(loadQuizSession()).not.toBeNull()

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Hoofdmenu/ }))
    })
    act(() => {
      fireEvent.click(screen.getByText('Ja, stoppen'))
    })
    expect(loadQuizSession()).toBeNull()
  })

  it('resumes from a resumeSession snapshot instead of starting fresh', () => {
    renderQuiz({
      resumeSession: {
        packId: pack.id,
        direction: 'code-name',
        playerName: 'Sam',
        elapsedSeconds: 42,
        quizState: {
          queue: [1, 2, 3, 4, 5],
          activeIndex: 1,
          mastered: [0],
          struggling: [],
          missed: [],
          mistakes: 0,
          firstTryCorrect: 1,
          attemptedFirstTime: [0],
          streak: 1,
          bestStreak: 1,
        },
      },
    })

    // Noorwegen's code — the resumed active question
    expect(screen.getByText('2', { selector: '.prompt-word' })).toBeInTheDocument()
    expect(screen.getByText('1 / 6 onder de knie', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('0:42', { exact: false })).toBeInTheDocument()
  })
})

describe('QuizScreen — progress dots do not leak the answer', () => {
  const steps = () => [...document.querySelectorAll('.trail .step')]
  const classesAfterStep = () => steps().map((s) => s.className.replace('step', '').trim() || 'plain')

  const fullState = (over) => ({
    queue: [0, 1, 2, 3, 4, 5],
    activeIndex: 0,
    mastered: [],
    struggling: [],
    missed: [],
    mistakes: 0,
    firstTryCorrect: 0,
    attemptedFirstTime: [],
    streak: 0,
    bestStreak: 0,
    ...over,
  })
  const resume = (quizState) => ({
    packId: pack.id,
    direction: 'code-name',
    playerName: 'Sam',
    elapsedSeconds: 0,
    quizState,
  })

  it('draws one dot per question', () => {
    renderQuiz()
    expect(steps()).toHaveLength(pack.questions.length)
  })

  it('highlights the first dot at the start even when the active question is not question #1', () => {
    // Nothing answered yet, but the shuffled queue starts on question index 4.
    renderQuiz({ resumeSession: resume(fullState({ queue: [4, 5, 0, 1, 2, 3], activeIndex: 4 })) })

    const cls = classesAfterStep()
    expect(cls[0]).toBe('current') // position = progress (0), not the active question's index
    expect(cls.filter((c) => c === 'current')).toHaveLength(1)
    expect(cls.slice(1)).toEqual(['plain', 'plain', 'plain', 'plain', 'plain'])
  })

  it('fills mastered dots from the left, not at the answered question’s own index', () => {
    // Resume mid-shuffle: the active question is index 3 ("Finland" / code "4").
    renderQuiz({ resumeSession: resume(fullState({ queue: [3, 4, 5, 0, 1, 2], activeIndex: 3 })) })

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Finland' }))
    })
    act(() => {
      vi.advanceTimersByTime(700)
    })

    const cls = classesAfterStep()
    expect(cls[0]).toBe('mastered') // one answered -> leftmost dot fills
    expect(cls[1]).toBe('current')
    expect(cls[3]).not.toBe('mastered') // the dot at the question's own index stays neutral
    expect(cls.filter((c) => c === 'mastered')).toHaveLength(1)
  })

  it('counts a missed question as a struggling dot without pinning it to that question’s index', () => {
    // Active question is index 2 ("Zweden" / code "3"). The MCQ distractor set is
    // randomised, so click whichever option isn't the correct one.
    renderQuiz({ resumeSession: resume(fullState({ queue: [2, 3, 4, 5, 0, 1], activeIndex: 2 })) })

    const wrongOption = screen
      .getAllByRole('button')
      .find(
        (btn) =>
          btn.classList.contains('option-btn') &&
          btn.querySelector('.option-label').textContent !== 'Zweden'
      )
    act(() => {
      fireEvent.click(wrongOption)
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Volgende/ }))
    })

    const cls = classesAfterStep()
    expect(cls[0]).toBe('struggling')
    expect(cls[1]).toBe('current')
    expect(cls[2]).toBe('plain') // not pinned to the missed question's index (2)
    expect(cls.filter((c) => c === 'struggling')).toHaveLength(1)
  })

  it('keeps the highlighted dot at "number answered", so it never reveals the code', () => {
    renderQuiz() // identity queue, starts on question 0

    const correctByPrompt = { 1: 'IJsland', 2: 'Noorwegen', 3: 'Zweden', 4: 'Finland', 5: 'Ierland', 6: 'Schotland' }
    for (let answered = 1; answered <= 3; answered++) {
      const shown = document.querySelector('.prompt-word').textContent
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: correctByPrompt[shown] }))
      })
      act(() => {
        vi.advanceTimersByTime(700)
      })
      const cls = classesAfterStep()
      const currentIndex = cls.indexOf('current')
      expect(currentIndex).toBe(answered) // position tracks progress, not the active code
    }
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
