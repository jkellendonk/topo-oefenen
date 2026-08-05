// Keeps a snapshot of the quiz-in-progress in sessionStorage, so an accidental tab
// refresh doesn't wipe out a round. Cleared on finish, on explicit "stop", or once
// it no longer matches an existing pack.
const SESSION_KEY = 'topo-oefenen-session-v1'

export function saveQuizSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // sessionStorage can be unavailable (e.g. private browsing) — losing resume isn't fatal
  }
}

export function loadQuizSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearQuizSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
