import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal.jsx'

describe('Modal', () => {
  it('renders title and children', () => {
    render(
      <Modal title="Titel" onClose={() => {}}>
        Inhoud
      </Modal>
    )
    expect(screen.getByText('Titel')).toBeInTheDocument()
    expect(screen.getByText('Inhoud')).toBeInTheDocument()
  })

  it('calls the primary and secondary actions', async () => {
    const user = userEvent.setup()
    const primary = vi.fn()
    const secondary = vi.fn()
    render(
      <Modal
        title="Titel"
        onClose={() => {}}
        primaryAction={{ label: 'Ja', onClick: primary }}
        secondaryAction={{ label: 'Nee', onClick: secondary }}
      >
        Inhoud
      </Modal>
    )
    await user.click(screen.getByText('Ja'))
    await user.click(screen.getByText('Nee'))
    expect(primary).toHaveBeenCalledTimes(1)
    expect(secondary).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the overlay', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal title="Titel" onClose={onClose}>
        Inhoud
      </Modal>
    )
    await user.click(screen.getByRole('dialog').parentElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside the dialog card', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal title="Titel" onClose={onClose}>
        Inhoud
      </Modal>
    )
    await user.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on Escape', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal title="Titel" onClose={onClose}>
        Inhoud
      </Modal>
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
