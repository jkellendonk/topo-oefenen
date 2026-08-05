import { useEffect } from 'react'

function Modal({ title, children, primaryAction, secondaryAction, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <div className="dialog-title">{title}</div>}
        <div className="dialog-message">{children}</div>
        <div className="dialog-actions">
          {secondaryAction && (
            <button className="ghost-btn" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button className="start-btn" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Modal
