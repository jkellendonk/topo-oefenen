import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Header from './Header.jsx'

describe('Header', () => {
  it('shows the app title and a speaker icon when sound is enabled', () => {
    render(<Header soundEnabled={true} onToggleSound={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Topo Oefenen' })).toBeInTheDocument()
    expect(screen.getByTitle('Geluid aan/uit')).toHaveTextContent('🔊')
  })

  it('shows a muted icon when sound is disabled', () => {
    render(<Header soundEnabled={false} onToggleSound={() => {}} />)
    expect(screen.getByTitle('Geluid aan/uit')).toHaveTextContent('🔇')
  })

  it('calls onToggleSound when the sound button is clicked', async () => {
    const user = userEvent.setup()
    const onToggleSound = vi.fn()
    render(<Header soundEnabled={true} onToggleSound={onToggleSound} />)
    await user.click(screen.getByTitle('Geluid aan/uit'))
    expect(onToggleSound).toHaveBeenCalledTimes(1)
  })

  it('renders the right slot content', () => {
    render(<Header soundEnabled={true} onToggleSound={() => {}} right={<div>Extra</div>} />)
    expect(screen.getByText('Extra')).toBeInTheDocument()
  })
})
