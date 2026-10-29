import { useEffect, useRef, useState } from 'react'

export interface ToastState {
  message: string
  kind: 'info' | 'error'
  actionLabel?: string
  onAction?: () => void
}

interface Props {
  toast: ToastState
  onDismiss: () => void
}

const DURATION_MS = 10000

export default function Toast({ toast, onDismiss }: Props) {
  const [paused, setPaused] = useState(false)
  const actionRef = useRef<HTMLButtonElement>(null)

  // Move keyboard focus to the action (Undo) so it is reachable without tabbing through the page.
  useEffect(() => {
    actionRef.current?.focus()
  }, [toast])

  // The timer pauses while the pointer or focus is inside the toast (WCAG 2.2.1).
  useEffect(() => {
    if (paused) return
    const t = window.setTimeout(onDismiss, DURATION_MS)
    return () => window.clearTimeout(t)
  }, [paused, toast, onDismiss])

  return (
    <div
      className={`toast ${toast.kind}`}
      role={toast.kind === 'error' ? 'alert' : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span>{toast.message}</span>
      {toast.actionLabel && (
        <button
          ref={actionRef}
          className="toast-action"
          onClick={() => {
            toast.onAction?.()
            onDismiss()
          }}
        >
          {toast.actionLabel}
        </button>
      )}
      <button className="toast-close" aria-label="Dismiss notification" onClick={onDismiss}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
