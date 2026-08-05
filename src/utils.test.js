import { describe, it, expect } from 'vitest'
import {
  shuffle,
  fmtTime,
  promptValue,
  answerValue,
  promptLabel,
  directionLabel,
  buildOptions,
} from './utils.js'

describe('shuffle', () => {
  it('keeps the same elements (multiset) and length', () => {
    const input = [0, 1, 2, 3, 4, 5, 6, 7]
    const result = shuffle(input)
    expect(result).toHaveLength(input.length)
    expect([...result].sort()).toEqual([...input].sort())
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3]
    const copy = [...input]
    shuffle(input)
    expect(input).toEqual(copy)
  })
})

describe('fmtTime', () => {
  it('formats zero seconds', () => {
    expect(fmtTime(0)).toBe('0:00')
  })

  it('pads single-digit seconds', () => {
    expect(fmtTime(65)).toBe('1:05')
  })

  it('formats multiple minutes', () => {
    expect(fmtTime(125)).toBe('2:05')
  })
})

const question = { id: 0, place: 'Nederland', answer: '15' }

describe('promptValue / answerValue', () => {
  it('code-name shows the code and expects the place name', () => {
    expect(promptValue(question, 'code-name')).toBe('15')
    expect(answerValue(question, 'code-name')).toBe('Nederland')
  })

  it('name-code shows the place name and expects the code', () => {
    expect(promptValue(question, 'name-code')).toBe('Nederland')
    expect(answerValue(question, 'name-code')).toBe('15')
  })
})

describe('promptLabel', () => {
  it('has a distinct label per direction', () => {
    expect(promptLabel('code-name')).not.toBe(promptLabel('name-code'))
  })
})

describe('directionLabel', () => {
  it('describes code-name', () => {
    expect(directionLabel('code-name')).toBe('Cijfer/letter ➜ Naam')
  })

  it('describes name-code', () => {
    expect(directionLabel('name-code')).toBe('Naam ➜ Cijfer/letter')
  })
})

describe('buildOptions', () => {
  const questions = [
    { id: 0, place: 'IJsland', answer: '1' },
    { id: 1, place: 'Noorwegen', answer: '2' },
    { id: 2, place: 'Zweden', answer: '3' },
    { id: 3, place: 'Finland', answer: '4' },
    { id: 4, place: 'Ierland', answer: '5' },
  ]

  it('returns exactly 4 unique options including the correct answer', () => {
    const options = buildOptions(questions, questions[0], 'code-name')
    expect(options).toHaveLength(4)
    expect(new Set(options).size).toBe(4)
    expect(options).toContain('IJsland')
  })

  it('works in the name-code direction too', () => {
    const options = buildOptions(questions, questions[2], 'name-code')
    expect(options).toHaveLength(4)
    expect(options).toContain('3')
  })

  it('never includes the same question twice as a distractor', () => {
    for (let i = 0; i < 20; i++) {
      const options = buildOptions(questions, questions[1], 'code-name')
      expect(options.filter((o) => o === 'Noorwegen')).toHaveLength(1)
    }
  })
})
