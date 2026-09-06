import { describe, it, expect } from 'vitest'
import { TOPO_PACKS, GROUPS } from './index.js'

const byId = (id) => TOPO_PACKS.find((p) => p.id === id)
const answersOf = (id) => byId(id).data.questions.map((q) => q.answer)
const placesOf = (id) => byId(id).data.questions.map((q) => q.place)

const GROEP_7 = [
  'landen_europa',
  'hoofdsteden_europa',
  'rivieren_van_europa',
  'gebergten_en_wateren_europa',
  'zeeen_en_meren_europa',
]
const GROEP_8 = [
  'landen_noord_amerika',
  'landen_midden_amerika',
  'landen_zuid_amerika',
  'landen_azie',
  'landen_oceanie',
  'landen_afrika_1',
  'landen_afrika_2',
]

describe('TOPO_PACKS', () => {
  it('has 12 map packs (5 Groep 7 + 7 Groep 8)', () => {
    expect(TOPO_PACKS).toHaveLength(12)
  })

  it('exposes exactly the expected Groep 7 pack ids', () => {
    expect(TOPO_PACKS.filter((p) => p.group === 'Groep 7').map((p) => p.id).sort()).toEqual(
      [...GROEP_7].sort()
    )
  })

  it('exposes exactly the expected Groep 8 pack ids', () => {
    expect(TOPO_PACKS.filter((p) => p.group === 'Groep 8').map((p) => p.id).sort()).toEqual(
      [...GROEP_8].sort()
    )
  })

  it('every pack belongs to a known group', () => {
    for (const pack of TOPO_PACKS) expect(GROUPS).toContain(pack.group)
  })

  it('both groups have at least one pack', () => {
    for (const group of GROUPS) {
      expect(TOPO_PACKS.some((p) => p.group === group)).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = TOPO_PACKS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every pack has meta (title, image, description) and a bundled image asset', () => {
    for (const pack of TOPO_PACKS) {
      expect(pack.data.meta.title).toEqual(expect.any(String))
      expect(pack.data.meta.image).toMatch(/\.webp$/)
      expect(pack.data.meta.description).toEqual(expect.any(String))
      expect(pack.image).toBeTruthy()
    }
  })

  it('every pack carries a positive integer intrinsic image size', () => {
    for (const pack of TOPO_PACKS) {
      expect(Number.isInteger(pack.imageWidth)).toBe(true)
      expect(Number.isInteger(pack.imageHeight)).toBe(true)
      expect(pack.imageWidth).toBeGreaterThan(0)
      expect(pack.imageHeight).toBeGreaterThan(0)
    }
  })

  it('every pack has at least 4 questions, each with a non-empty place and answer', () => {
    for (const pack of TOPO_PACKS) {
      expect(pack.data.questions.length).toBeGreaterThanOrEqual(4)
      for (const q of pack.data.questions) {
        expect(typeof q.place).toBe('string')
        expect(q.place.length).toBeGreaterThan(0)
        expect(typeof q.answer).toBe('string')
        expect(q.answer.length).toBeGreaterThan(0)
      }
    }
  })

  it('every pack has unique answers and unique place names within itself', () => {
    for (const pack of TOPO_PACKS) {
      const answers = pack.data.questions.map((q) => q.answer)
      const places = pack.data.questions.map((q) => q.place)
      expect(new Set(answers).size).toBe(answers.length)
      expect(new Set(places).size).toBe(places.length)
    }
  })
})

describe('Groep 8 werelddeel-kaarten — data matches the printed lists', () => {
  it('Noord-Amerika: 7 items, Alaska and Hawaï use Roman numerals', () => {
    expect(answersOf('landen_noord_amerika')).toEqual(['1', '2', '3', '4', '5', 'I', 'II'])
    const q = byId('landen_noord_amerika').data.questions
    expect(q.find((x) => x.answer === 'I').place).toBe('Alaska')
    expect(q.find((x) => x.answer === 'II').place).toBe('Hawaï')
    expect(q[0].place).toBe('Groenland')
  })

  it('Midden-Amerika: 17 items numbered 1..17, Belize first and Puerto Rico last', () => {
    expect(answersOf('landen_midden_amerika')).toEqual(
      Array.from({ length: 17 }, (_, i) => String(i + 1))
    )
    const q = byId('landen_midden_amerika').data.questions
    expect(q[0]).toEqual({ place: 'Belize', answer: '1' })
    expect(q[16]).toEqual({ place: 'Puerto Rico', answer: '17' })
  })

  it('Zuid-Amerika: 13 numbered countries plus letters a/b for the island groups', () => {
    expect(answersOf('landen_zuid_amerika')).toEqual([
      ...Array.from({ length: 13 }, (_, i) => String(i + 1)),
      'a',
      'b',
    ])
    const q = byId('landen_zuid_amerika').data.questions
    expect(q.find((x) => x.answer === 'a').place).toBe('Galapagoseilanden')
    expect(q.find((x) => x.answer === 'b').place).toBe('Falklandeilanden')
  })

  it('Azië: 25 items numbered 1..25, with key countries on their list number', () => {
    expect(answersOf('landen_azie')).toEqual(Array.from({ length: 25 }, (_, i) => String(i + 1)))
    const q = byId('landen_azie').data.questions
    expect(q.find((x) => x.place === 'Rusland').answer).toBe('1')
    expect(q.find((x) => x.place === 'China').answer).toBe('4')
    expect(q.find((x) => x.place === 'Oost-Timor').answer).toBe('25')
  })

  it('Oceanië: 8 items numbered 1..8', () => {
    expect(answersOf('landen_oceanie')).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
    expect(byId('landen_oceanie').data.questions[0].place).toBe('Australië')
  })

  it('Afrika is split into two toetsen: 1..26 and 27..52', () => {
    expect(answersOf('landen_afrika_1')).toEqual(Array.from({ length: 26 }, (_, i) => String(i + 1)))
    expect(answersOf('landen_afrika_2')).toEqual(
      Array.from({ length: 26 }, (_, i) => String(i + 27))
    )
    expect(byId('landen_afrika_1').data.questions[0].place).toBe('Marokko')
    expect(byId('landen_afrika_2').data.questions.at(-1).place).toBe('Mauritius')
  })

  it('both Afrika toetsen render the same shared map image', () => {
    expect(byId('landen_afrika_1').image).toBe(byId('landen_afrika_2').image)
    expect(byId('landen_afrika_1').imageWidth).toBe(byId('landen_afrika_2').imageWidth)
    expect(byId('landen_afrika_1').imageHeight).toBe(byId('landen_afrika_2').imageHeight)
  })

  it('the two Afrika toetsen together cover every country exactly once', () => {
    const combined = [...placesOf('landen_afrika_1'), ...placesOf('landen_afrika_2')]
    expect(combined).toHaveLength(52)
    expect(new Set(combined).size).toBe(52)
    expect([...answersOf('landen_afrika_1'), ...answersOf('landen_afrika_2')]).toEqual(
      Array.from({ length: 52 }, (_, i) => String(i + 1))
    )
  })
})
