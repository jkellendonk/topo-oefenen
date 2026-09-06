import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import Header from '../components/Header.jsx'
import Modal from '../components/Modal.jsx'
import {
  fmtTime,
  shuffle,
  promptValue,
  answerValue,
  promptLabel,
  buildOptions,
  isTypedMode,
  normalize,
} from '../utils.js'
import { saveQuizSession, clearQuizSession } from '../sessionStore.js'

const PRAISE = ['Goed zo!', 'Top!', 'Knap gedaan!', 'Yes!']
const OPTION_KEYS = ['1', '2', '3', '4']

export function initialQuizState(pack) {
  const queue = shuffle(pack.questions.map((q) => q.id))
  return {
    queue,
    activeIndex: queue[0],
    mastered: new Set(),
    struggling: new Set(),
    missed: new Set(),
    mistakes: 0,
    firstTryCorrect: 0,
    attemptedFirstTime: new Set(),
    streak: 0,
    bestStreak: 0,
    justHitMilestone: false,
    answered: false,
    lastResult: null,
    selectedValue: null,
    message: '',
    finished: false,
  }
}

// Rebuilds reducer state from a sessionStorage snapshot (see sessionStore.js),
// so a refreshed page can pick a round back up mid-way through.
export function hydrateQuizState(quizState) {
  return {
    queue: quizState.queue,
    activeIndex: quizState.activeIndex,
    mastered: new Set(quizState.mastered),
    struggling: new Set(quizState.struggling),
    missed: new Set(quizState.missed),
    mistakes: quizState.mistakes,
    firstTryCorrect: quizState.firstTryCorrect,
    attemptedFirstTime: new Set(quizState.attemptedFirstTime),
    streak: quizState.streak,
    bestStreak: quizState.bestStreak,
    justHitMilestone: false,
    answered: false,
    lastResult: null,
    selectedValue: null,
    message: '',
    finished: false,
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SUBMIT': {
      const { isCorrect, idx, selectedValue } = action
      const isFirstAttempt = !state.attemptedFirstTime.has(idx)
      const attemptedFirstTime = new Set(state.attemptedFirstTime)
      if (isFirstAttempt) attemptedFirstTime.add(idx)

      if (isCorrect) {
        const streak = state.streak + 1
        const mastered = new Set(state.mastered).add(idx)
        const struggling = new Set(state.struggling)
        struggling.delete(idx)
        return {
          ...state,
          answered: true,
          lastResult: 'correct',
          selectedValue,
          mastered,
          struggling,
          firstTryCorrect: state.firstTryCorrect + (isFirstAttempt ? 1 : 0),
          attemptedFirstTime,
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          justHitMilestone: streak > 0 && streak % 5 === 0,
          message: PRAISE[Math.floor(Math.random() * PRAISE.length)],
        }
      }
      return {
        ...state,
        answered: true,
        lastResult: 'wrong',
        selectedValue,
        mistakes: state.mistakes + 1,
        struggling: new Set(state.struggling).add(idx),
        missed: new Set(state.missed).add(idx),
        attemptedFirstTime,
        streak: 0,
        justHitMilestone: false,
        message: '',
      }
    }
    case 'ADVANCE': {
      const queue = state.queue.slice(1)
      if (state.lastResult === 'wrong') queue.push(state.activeIndex)
      if (queue.length === 0) return { ...state, finished: true }
      return {
        ...state,
        queue,
        activeIndex: queue[0],
        answered: false,
        lastResult: null,
        selectedValue: null,
        justHitMilestone: false,
        message: '',
      }
    }
    default:
      return state
  }
}

function QuizScreen({ pack, direction, playerName, sound, onFinish, onBackToMenu, resumeSession }) {
  const [state, dispatch] = useReducer(reducer, pack, (p) =>
    resumeSession ? hydrateQuizState(resumeSession.quizState) : initialQuizState(p)
  )
  const [elapsed, setElapsed] = useState(resumeSession?.elapsedSeconds ?? 0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [typedValue, setTypedValue] = useState('')
  const startedAtRef = useRef(Date.now() - (resumeSession?.elapsedSeconds ?? 0) * 1000)
  const inputRef = useRef(null)
  const typed = isTypedMode(direction)

  const question = pack.questions[state.activeIndex]
  const shownPrompt = promptValue(question, direction)
  const correctAnswer = answerValue(question, direction)
  const options = useMemo(
    () => buildOptions(pack.questions, question, direction),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activeIndex, direction]
  )

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!typed || state.answered) return
    setTypedValue('')
    if (inputRef.current) inputRef.current.focus()
  }, [typed, state.activeIndex, state.answered])

  // Snapshot progress after every answer so a refresh can resume instead of losing the round.
  useEffect(() => {
    if (state.finished) return
    saveQuizSession({
      packId: pack.id,
      direction,
      playerName,
      elapsedSeconds: elapsed,
      quizState: {
        queue: state.queue,
        activeIndex: state.activeIndex,
        mastered: [...state.mastered],
        struggling: [...state.struggling],
        missed: [...state.missed],
        mistakes: state.mistakes,
        firstTryCorrect: state.firstTryCorrect,
        attemptedFirstTime: [...state.attemptedFirstTime],
        streak: state.streak,
        bestStreak: state.bestStreak,
      },
    })
  }, [state, pack.id, direction, playerName, elapsed])

  const selectOption = (value) => {
    if (state.answered) return
    dispatch({
      type: 'SUBMIT',
      isCorrect: value === correctAnswer,
      idx: state.activeIndex,
      selectedValue: value,
    })
  }

  const submitTyped = () => {
    if (state.answered || !typedValue.trim()) return
    dispatch({
      type: 'SUBMIT',
      isCorrect: normalize(typedValue) === normalize(correctAnswer),
      idx: state.activeIndex,
      selectedValue: typedValue,
    })
  }

  useEffect(() => {
    if (!state.answered) return
    if (state.justHitMilestone) sound.playStreak()
    else if (state.lastResult === 'correct') sound.playCorrect()
    else sound.playWrong()

    if (state.lastResult === 'correct') {
      const t = setTimeout(() => dispatch({ type: 'ADVANCE' }), 700)
      return () => clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answered, state.lastResult, state.justHitMilestone])

  useEffect(() => {
    if (!state.finished) return
    clearQuizSession()
    const total = pack.questions.length
    const accuracy = Math.round((state.firstTryCorrect / total) * 100)
    let stars = 1
    if (accuracy >= 90) stars = 3
    else if (accuracy >= 70) stars = 2
    sound.playFinish()
    onFinish({
      total,
      firstTryCorrect: state.firstTryCorrect,
      accuracy,
      mistakes: state.mistakes,
      timeSeconds: elapsed,
      bestStreak: state.bestStreak,
      stars,
      missed: [...state.missed].map((id) => {
        const q = pack.questions[id]
        return { place: q.place, answer: q.answer }
      }),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished])

  useEffect(() => {
    const handler = (e) => {
      if (showConfirm) return
      if (e.key === 'Enter') {
        if (state.answered) dispatch({ type: 'ADVANCE' })
        else if (typed) submitTyped()
        return
      }
      if (!typed && !state.answered && OPTION_KEYS.includes(e.key)) {
        const opt = options[OPTION_KEYS.indexOf(e.key)]
        if (opt !== undefined) selectOption(opt)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answered, showConfirm, typed, typedValue, correctAnswer, options])

  const requestBackToMenu = () => setShowConfirm(true)
  const confirmBackToMenu = () => {
    clearQuizSession()
    onBackToMenu()
  }

  // Progress dots, drawn in "how far along am I" order rather than question order.
  // Keying them to question identity/position would leak the answer: with the
  // questions numbered 1..N, the highlighted dot's index gives the number away.
  const masteredCount = state.mastered.size
  const strugglingCount = Math.max(
    0,
    state.struggling.size - (state.struggling.has(state.activeIndex) ? 1 : 0)
  )
  const currentPos = state.answered ? -1 : masteredCount + strugglingCount
  const trail = Array.from({ length: pack.questions.length }, (_, i) => {
    let cls = 'step'
    if (i < masteredCount) cls += ' mastered'
    else if (i < masteredCount + strugglingCount) cls += ' struggling'
    else if (i === currentPos) cls += ' current'
    return <div key={i} className={cls}></div>
  })

  return (
    <>
      <Header
        soundEnabled={sound.enabled}
        onToggleSound={sound.toggle}
        right={
          <>
            <div className="player-badge">
              👤 {playerName} &middot; {pack.title}
            </div>
            {typed && <span className="toets-pill toets-pill-header">📝 TOETS</span>}
            <button className="menu-btn" onClick={requestBackToMenu}>
              🏠 Hoofdmenu
            </button>
          </>
        }
      />

      <div className="top-bar">
        <span className="streak-badge">🔥 {state.streak} op een rij</span>
        <span className="timer">
          ⏱ <span>{fmtTime(elapsed)}</span>
        </span>
      </div>

      {state.answered && state.justHitMilestone && (
        <div className="milestone-banner">🎉 {state.streak} op een rij! Knap gedaan!</div>
      )}

      <div className="trail-wrap">
        <div className="trail">{trail}</div>
        <div className="trail-meta">
          <span>
            {state.mastered.size} / {pack.questions.length} onder de knie
          </span>
          <span>{state.mistakes} foutjes tot nu toe</span>
        </div>
      </div>

      <div className="quiz-columns">
        <div className="map-card">
          <img src={pack.image} alt={pack.title} width={pack.imageWidth} height={pack.imageHeight} />
        </div>

        <div className="quiz-card">
          <div className={`prompt-card ${typed ? 'prompt-card-toets' : ''}`}>
            <div className="prompt-label">{promptLabel(direction)}</div>
            <div className="prompt-word">{shownPrompt}</div>
          </div>

          {typed ? (
            <div className="answer-row">
              <input
                ref={inputRef}
                type="text"
                placeholder="typ hier het cijfer of de letter..."
                autoComplete="off"
                autoCapitalize="off"
                spellCheck="false"
                disabled={state.answered}
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                className={state.answered ? (state.lastResult === 'correct' ? 'correct' : 'wrong') : ''}
              />
              <button className="check-btn" disabled={state.answered || !typedValue.trim()} onClick={submitTyped}>
                Controleer
              </button>
            </div>
          ) : (
            <div className="options-grid">
              {options.map((opt, i) => {
                let cls = 'option-btn'
                if (state.answered) {
                  if (opt === correctAnswer) cls += ' correct'
                  else if (opt === state.selectedValue) cls += ' wrong'
                  else cls += ' disabled'
                }
                return (
                  <button
                    key={opt}
                    className={cls}
                    disabled={state.answered}
                    onClick={() => selectOption(opt)}
                  >
                    <span className="option-key" aria-hidden="true">
                      {OPTION_KEYS[i]}
                    </span>
                    <span className="option-label">{opt}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div
            className={`msg ${state.lastResult === 'correct' ? 'good' : state.lastResult === 'wrong' ? 'bad' : ''}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {state.lastResult === 'correct' && state.message}
            {state.lastResult === 'wrong' && (
              <>
                Bijna! Het juiste antwoord is: <u>{correctAnswer}</u>. Komt later terug.
              </>
            )}
          </div>

          <div className="footer">
            <div className="score">
              <span>Onder de knie</span>{' '}
              <b>
                {state.mastered.size} / {pack.questions.length}
              </b>
            </div>
            <button
              className="next-btn"
              disabled={!state.answered}
              onClick={() => dispatch({ type: 'ADVANCE' })}
            >
              {state.queue.length === 1 ? 'Nu naar score ➜' : 'Volgende ➜'}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <Modal
          title="Terug naar het hoofdmenu?"
          onClose={() => setShowConfirm(false)}
          secondaryAction={{ label: 'Ja, stoppen', onClick: confirmBackToMenu }}
          primaryAction={{ label: 'Blijf oefenen', onClick: () => setShowConfirm(false) }}
        >
          Je voortgang gaat verloren
        </Modal>
      )}
    </>
  )
}

export default QuizScreen
