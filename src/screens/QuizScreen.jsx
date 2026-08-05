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

const PRAISE = ['Goed zo!', 'Top!', 'Knap gedaan!', 'Yes!']

export function initialQuizState(pack) {
  const queue = shuffle(pack.questions.map((q) => q.id))
  return {
    queue,
    activeIndex: queue[0],
    mastered: new Set(),
    struggling: new Set(),
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

function QuizScreen({ pack, direction, playerName, sound, onFinish, onBackToMenu }) {
  const [state, dispatch] = useReducer(reducer, pack, initialQuizState)
  const [elapsed, setElapsed] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [typedValue, setTypedValue] = useState('')
  const startedAtRef = useRef(Date.now())
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
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.finished])

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Enter') return
      if (showConfirm) return
      if (state.answered) dispatch({ type: 'ADVANCE' })
      else if (typed) submitTyped()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answered, showConfirm, typed, typedValue, correctAnswer])

  const requestBackToMenu = () => setShowConfirm(true)

  const trail = pack.questions.map((q) => {
    let cls = 'step'
    if (state.mastered.has(q.id)) cls += ' mastered'
    else if (q.id === state.activeIndex && !state.answered) cls += ' current'
    else if (state.struggling.has(q.id)) cls += ' struggling'
    return <div key={q.id} className={cls}></div>
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
          <img src={pack.image} alt={pack.title} />
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
              {options.map((opt) => {
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
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          <div
            className={`msg ${state.lastResult === 'correct' ? 'good' : state.lastResult === 'wrong' ? 'bad' : ''}`}
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
          secondaryAction={{ label: 'Ja, stoppen', onClick: onBackToMenu }}
          primaryAction={{ label: 'Blijf oefenen', onClick: () => setShowConfirm(false) }}
        >
          Je voortgang gaat verloren
        </Modal>
      )}
    </>
  )
}

export default QuizScreen
