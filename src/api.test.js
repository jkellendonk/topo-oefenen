import { describe, it, expect, beforeEach } from 'vitest'
import { getPacks, getPack, getScores, postScore } from './api.js'
import { TOPO_PACKS } from './data/topo/index.js'

beforeEach(() => {
  localStorage.clear()
})

describe('getPacks', () => {
  it('returns all 5 map packs with a count', async () => {
    const packs = await getPacks()
    expect(packs).toHaveLength(5)
    expect(packs.map((p) => p.id).sort()).toEqual([...TOPO_PACKS.map((p) => p.id)].sort())
    for (const pack of packs) {
      const entry = TOPO_PACKS.find((p) => p.id === pack.id)
      expect(pack.count).toBe(entry.data.questions.length)
      expect(pack.title).toBe(entry.data.meta.title)
    }
  })
})

describe('getPack', () => {
  it('resolves a valid pack id with all its questions', async () => {
    const pack = await getPack('landen_europa')
    expect(pack.title).toBe('Landen van Europa')
    expect(pack.questions.length).toBeGreaterThan(0)
    expect(pack.questions[0]).toEqual(
      expect.objectContaining({ id: 0, place: expect.any(String), answer: expect.any(String) })
    )
    expect(pack.image).toBeTruthy()
  })

  it('returns null for an unknown pack id', async () => {
    const pack = await getPack('does-not-exist')
    expect(pack).toBeNull()
  })
})

describe('scores (localStorage)', () => {
  it('starts empty', async () => {
    expect(await getScores()).toEqual([])
  })

  it('postScore stores a record with a resolved pack title, id and createdAt', async () => {
    const saved = await postScore({
      playerName: 'Sam',
      packId: 'landen_europa',
      direction: 'code-name',
      total: 45,
      firstTryCorrect: 40,
      accuracy: 89,
      mistakes: 5,
      timeSeconds: 120,
      bestStreak: 12,
      stars: 2,
    })

    expect(saved.pack).toEqual({ title: 'Landen van Europa' })
    expect(saved.id).toBeDefined()
    expect(saved.createdAt).toBeDefined()

    const scores = await getScores()
    expect(scores).toHaveLength(1)
    expect(scores[0].playerName).toBe('Sam')
  })

  it('falls back to the raw packId when the pack can no longer be resolved', async () => {
    const saved = await postScore({ playerName: 'Sam', packId: 'ghost-pack', direction: 'code-name' })
    expect(saved.pack).toEqual({ title: 'ghost-pack' })
  })

  it('getScores sorts newest first', async () => {
    localStorage.setItem(
      'topo-oefenen-scores-v1',
      JSON.stringify([
        { id: 1, playerName: 'Oud', createdAt: '2026-01-01T00:00:00.000Z', pack: { title: 'Landen van Europa' } },
        { id: 2, playerName: 'Nieuw', createdAt: '2026-06-01T00:00:00.000Z', pack: { title: 'Landen van Europa' } },
      ])
    )
    const scores = await getScores()
    expect(scores.map((s) => s.playerName)).toEqual(['Nieuw', 'Oud'])
  })
})
