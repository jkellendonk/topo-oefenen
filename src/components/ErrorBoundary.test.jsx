import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary.jsx'
import { saveQuizSession, loadQuizSession } from '../sessionStore.js'

function Bomb() {
  throw new Error('boom')
}

beforeEach(() => {
  sessionStorage.clear()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>Alles goed</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Alles goed')).toBeInTheDocument()
  })

  it('shows a friendly fallback instead of a blank page when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByText('😵 Er ging iets mis')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Opnieuw proberen' })).toBeInTheDocument()
  })

  it('clears a saved quiz session on reset, in case that caused the crash', () => {
    saveQuizSession({ packId: 'x', direction: 'code-name', playerName: 'Sam', quizState: {} })
    expect(loadQuizSession()).not.toBeNull()

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Opnieuw proberen' }))
    expect(loadQuizSession()).toBeNull()
  })
})
