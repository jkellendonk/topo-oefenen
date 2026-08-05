import { TOPO_PACKS } from './data/topo/index.js'

const SCORES_KEY = 'topo-oefenen-scores-v1'

function findPack(id) {
  const entry = TOPO_PACKS.find((p) => p.id === id)
  if (!entry) return null
  return {
    id: entry.id,
    title: entry.data.meta.title,
    description: entry.data.meta.description,
    image: entry.image,
    questions: entry.data.questions.map((q, i) => ({ id: i, place: q.place, answer: q.answer })),
  }
}

function readScores() {
  try {
    const raw = localStorage.getItem(SCORES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeScores(scores) {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores))
}

export function getPacks() {
  return Promise.resolve(
    TOPO_PACKS.map((p) => ({
      id: p.id,
      title: p.data.meta.title,
      count: p.data.questions.length,
    }))
  )
}

export function getPack(id) {
  return Promise.resolve(findPack(id))
}

export function getScores() {
  const scores = readScores().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return Promise.resolve(scores)
}

export function postScore(score) {
  const pack = findPack(score.packId)
  const record = {
    ...score,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    pack: { title: pack ? pack.title : score.packId },
  }
  const scores = readScores()
  scores.push(record)
  writeScores(scores)
  return Promise.resolve(record)
}
