import { describe, it, expect } from 'vitest'
import { TOPO_PACKS, GROUPS } from './index.js'

describe('TOPO_PACKS', () => {
  it('has exactly 5 map packs', () => {
    expect(TOPO_PACKS).toHaveLength(5)
  })

  it('every pack belongs to a known group', () => {
    for (const pack of TOPO_PACKS) {
      expect(GROUPS).toContain(pack.group)
    }
  })

  it('all current packs are Groep 7 — Groep 8 is still empty and waiting to be filled in', () => {
    expect(TOPO_PACKS.every((p) => p.group === 'Groep 7')).toBe(true)
  })

  it('has unique ids', () => {
    const ids = TOPO_PACKS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every pack has meta (title, image, description) and a bundled image asset', () => {
    for (const pack of TOPO_PACKS) {
      expect(pack.data.meta.title).toEqual(expect.any(String))
      expect(pack.data.meta.image).toEqual(expect.any(String))
      expect(pack.data.meta.description).toEqual(expect.any(String))
      expect(pack.image).toBeTruthy()
    }
  })

  it('every pack has at least one question with a place and answer', () => {
    for (const pack of TOPO_PACKS) {
      expect(pack.data.questions.length).toBeGreaterThan(0)
      for (const q of pack.data.questions) {
        expect(typeof q.place).toBe('string')
        expect(q.place.length).toBeGreaterThan(0)
        expect(typeof q.answer).toBe('string')
        expect(q.answer.length).toBeGreaterThan(0)
      }
    }
  })

  it('every pack has at least 4 questions (enough for 4 multiple-choice options)', () => {
    for (const pack of TOPO_PACKS) {
      expect(pack.data.questions.length).toBeGreaterThanOrEqual(4)
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
