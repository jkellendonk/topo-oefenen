export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Item dat getoond wordt als vraag
export function promptValue(question, direction) {
  return direction === 'code-name' ? question.answer : question.place
}

// Item dat als antwoord gekozen moet worden
export function answerValue(question, direction) {
  return direction === 'code-name' ? question.place : question.answer
}

export function promptLabel(direction) {
  return direction === 'code-name'
    ? 'Welke plaats hoort bij dit cijfer of deze letter?'
    : 'Welk cijfer of welke letter hoort bij'
}

export function directionLabel(direction) {
  return direction === 'code-name' ? 'Cijfer/letter ➜ Naam' : 'Naam ➜ Cijfer/letter'
}

// Bouwt 4 antwoordopties: het juiste antwoord + 3 willekeurige afleiders uit hetzelfde pakket
export function buildOptions(questions, correctQuestion, direction) {
  const correctValue = answerValue(correctQuestion, direction)
  const pool = questions
    .filter((q) => q.id !== correctQuestion.id)
    .map((q) => answerValue(q, direction))
  const distractors = shuffle(pool).slice(0, 3)
  return shuffle([correctValue, ...distractors])
}
