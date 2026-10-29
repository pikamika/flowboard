import { useEffect, useId, useRef, useState } from 'react'
import type { Card, CardInput, Priority } from '../types'
import { PRIORITIES } from '../types'
import AssigneeSelect, { normalizeName } from './AssigneeSelect'

interface Props {
  card: Card | null
  assignees: string[]
  onSave: (input: CardInput) => void
  onClose: () => void
}

export default function CardModal({ card, assignees, onSave, onClose }: Props) {
  const [title, setTitle] = useState(card?.title ?? '')
  const [assignee, setAssignee] = useState(card?.assignee ?? '')
  const [priority, setPriority] = useState<Priority>(card?.priority ?? 'Medium')
  const [dueDate, setDueDate] = useState(card?.dueDate ?? '')
  const [assigneeError, setAssigneeError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLFormElement>(null)
  const titleId = useId()
  const assigneeId = useId()

  // Keep Tab / Shift+Tab inside the dialog.
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = normalizeName(assignee)
    if (!name) {
      setAssigneeError('Select or add an assignee.')
      return
    }
    onSave({ title: title.trim(), assignee: name, priority, dueDate })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        onKeyDown={trapTab}
      >
        <h2 id={titleId}>{card ? 'Edit card' : 'New card'}</h2>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>
        <div className="field">
          <label className="field-label" htmlFor={assigneeId}>
            Assignee
          </label>
          <AssigneeSelect
            id={assigneeId}
            options={assignees}
            value={assignee}
            error={assigneeError}
            onChange={(v) => {
              setAssignee(v)
              setAssigneeError(null)
            }}
          />
        </div>
        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            {card ? 'Save changes' : 'Add card'}
          </button>
        </div>
      </form>
    </div>
  )
}
