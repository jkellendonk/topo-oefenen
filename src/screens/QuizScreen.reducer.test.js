import { describe, it, expect } from 'vitest'
import { initialQuizState, hydrateQuizState, reducer } from './QuizScreen.jsx'

const pack = {
  id: 'test_pack',
  title: 'Test',
  image: 'test.jpeg',
  questions: [
    { id: 0, place: 'Kat', answer: '1' },
    { id: 1, place: 'Hond', answer: '2' },
    { id: 2, place: 'Vogel', answer: '3' },
  ],
}

describe('initialQuizState', () => {
  it('queues every question id exactly once', () => {
    const state = initialQuizState(pack)
    expect([...state.queue].sort()).toEqual([0, 1, 2])
    expect(state.mastered.size).toBe(0)
    expect(state.struggling.size).toBe(0)
    expect(state.missed.size).toBe(0)
    expect(state.finished).toBe(false)
  })
})

describe('hydrateQuizState', () => {
  it('rebuilds a reducer state from a plain (JSON-serializable) snapshot', () => {
    const snapshot = {
      queue: [1, 2],
      activeIndex: 1,
      mastered: [0],
      struggling: [1],
      missed: [1],
      mistakes: 2,
      firstTryCorrect: 1,
      attemptedFirstTime: [0, 1],
      streak: 0,
      bestStreak: 3,
    }
    const state = hydrateQuizState(snapshot)
    expect(state.queue).toEqual([1, 2])
    expect(state.activeIndex).toBe(1)
    expect(state.mastered).toBeInstanceOf(Set)
    expect(state.mastered.has(0)).toBe(true)
    expect(state.struggling.has(1)).toBe(true)
    expect(state.missed.has(1)).toBe(true)
    expect(state.mistakes).toBe(2)
    expect(state.bestStreak).toBe(3)
    // A resumed round should never re-show stale answer feedback.
    expect(state.answered).toBe(false)
    expect(state.lastResult).toBeNull()
    expect(state.finished).toBe(false)
  })
})

describe('reducer: SUBMIT', () => {
  it('a correct answer masters the item and grows the streak', () => {
    const state = initialQuizState(pack)
    const idx = state.activeIndex
    const next = reducer(state, { type: 'SUBMIT', isCorrect: true, idx, selectedValue: 'x' })
    expect(next.answered).toBe(true)
    expect(next.lastResult).toBe('correct')
    expect(next.selectedValue).toBe('x')
    expect(next.mastered.has(idx)).toBe(true)
    expect(next.streak).toBe(1)
    expect(next.firstTryCorrect).toBe(1)
  })

  it('a wrong answer marks it struggling and resets the streak', () => {
    let state = initialQuizState(pack)
    state = reducer(state, { type: 'SUBMIT', isCorrect: true, idx: state.activeIndex, selectedValue: 'x' })
    state = reducer(state, { type: 'ADVANCE' })
    const idx = state.activeIndex
    const next = reducer(state, { type: 'SUBMIT', isCorrect: false, idx, selectedValue: 'wrong' })
    expect(next.lastResult).toBe('wrong')
    expect(next.struggling.has(idx)).toBe(true)
    expect(next.missed.has(idx)).toBe(true)
    expect(next.streak).toBe(0)
    expect(next.mistakes).toBe(1)
  })

  it('keeps an item in "missed" permanently, even once it is later mastered', () => {
    let state = initialQuizState(pack)
    const idx = state.activeIndex
    state = reducer(state, { type: 'SUBMIT', isCorrect: false, idx, selectedValue: 'wrong' })
    state = reducer(state, { type: 'ADVANCE' })
    while (state.activeIndex !== idx) {
      state = reducer(state, { type: 'SUBMIT', isCorrect: true, idx: state.activeIndex, selectedValue: 'x' })
      state = reducer(state, { type: 'ADVANCE' })
    }
    const next = reducer(state, { type: 'SUBMIT', isCorrect: true, idx, selectedValue: 'x' })
    expect(next.mastered.has(idx)).toBe(true)
    expect(next.struggling.has(idx)).toBe(false)
    expect(next.missed.has(idx)).toBe(true)
  })

  it('only counts firstTryCorrect once per item, even after a retry', () => {
    let state = initialQuizState(pack)
    const idx = state.activeIndex
    state = reducer(state, { type: 'SUBMIT', isCorrect: false, idx, selectedValue: 'wrong' })
    state = reducer(state, { type: 'ADVANCE' }) // wrong answer requeues idx at the back
    while (state.activeIndex !== idx) {
      state = reducer(state, { type: 'SUBMIT', isCorrect: true, idx: state.activeIndex, selectedValue: 'x' })
      state = reducer(state, { type: 'ADVANCE' })
    }
    const beforeRetry = state.firstTryCorrect
    const next = reducer(state, { type: 'SUBMIT', isCorrect: true, idx, selectedValue: 'x' })
    expect(next.firstTryCorrect).toBe(beforeRetry)
    expect(next.mastered.has(idx)).toBe(true)
  })

  it('flags a milestone every 5th consecutive correct answer', () => {
    const bigPack = {
      ...pack,
      questions: Array.from({ length: 5 }, (_, i) => ({ id: i, place: `p${i}`, answer: `${i}` })),
    }
    let state = initialQuizState(bigPack)
    for (let i = 0; i < 4; i++) {
      state = reducer(state, { type: 'SUBMIT', isCorrect: true, idx: state.activeIndex, selectedValue: 'x' })
      expect(state.justHitMilestone).toBe(false)
      state = reducer(state, { type: 'ADVANCE' })
    }
    state = reducer(state, { type: 'SUBMIT', isCorrect: true, idx: state.activeIndex, selectedValue: 'x' })
    expect(state.streak).toBe(5)
    expect(state.justHitMilestone).toBe(true)
  })
})

describe('reducer: ADVANCE', () => {
  it('removes the item from the queue after a correct answer', () => {
    let state = initialQuizState(pack)
    const queueLenBefore = state.queue.length
    state = reducer(state, { type: 'SUBMIT', isCorrect: true, idx: state.activeIndex, selectedValue: 'x' })
    state = reducer(state, { type: 'ADVANCE' })
    expect(state.queue).toHaveLength(queueLenBefore - 1)
    expect(state.answered).toBe(false)
    expect(state.selectedValue).toBeNull()
  })

  it('requeues the item at the back after a wrong answer', () => {
    let state = initialQuizState(pack)
    const queueLenBefore = state.queue.length
    const idx = state.activeIndex
    state = reducer(state, { type: 'SUBMIT', isCorrect: false, idx, selectedValue: 'wrong' })
    state = reducer(state, { type: 'ADVANCE' })
    expect(state.queue).toHaveLength(queueLenBefore)
    expect(state.queue[state.queue.length - 1]).toBe(idx)
  })

  it('marks the round finished once the queue is empty', () => {
    let state = initialQuizState({ ...pack, questions: [pack.questions[0]] })
    state = reducer(state, { type: 'SUBMIT', isCorrect: true, idx: state.activeIndex, selectedValue: 'x' })
    state = reducer(state, { type: 'ADVANCE' })
    expect(state.finished).toBe(true)
  })
})
