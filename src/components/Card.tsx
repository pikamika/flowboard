import { useEffect, useRef, useState } from 'react'
import type { Card as CardType, ColumnId } from '../types'
import { COLUMNS } from '../types'

interface Props {
  card: CardType
  onEdit: (card: CardType) => void
  onDelete: (id: string) => void
  onMove: (id: string, column: ColumnId) => void
}

function localToday(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDate(iso: string): string {
  if (!iso) return 'No due date'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export default function Card({ card, onEdit, onDelete, onMove }: Props) {
  const [dragging, setDragging] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)
  const menuBtn = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const today = localToday()
  const overdue = !!card.dueDate && card.dueDate < today && card.column !== 'done'
  const open = menuPos !== null

  const close = () => setMenuPos(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menu.current?.contains(t) && !menuBtn.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        menuBtn.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const toggleMenu = () => {
    if (open) return close()
    const r = menuBtn.current!.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
  }

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      close()
      menuBtn.current?.focus()
      return
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = Array.from(menu.current!.querySelectorAll<HTMLElement>('[role="menuitem"]'))
    const i = items.indexOf(document.activeElement as HTMLElement)
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
    items[next].focus()
  }

  return (
    <article
      className={`card${dragging ? ' dragging' : ''}`}
      data-card-id={card.id}
      tabIndex={-1}
      draggable
      onDragStart={(e) => {
        close()
        e.dataTransfer.setData('text/plain', card.id)
        e.dataTransfer.effectAllowed = 'move'
        setDragging(true)
      }}
      onDragEnd={() => setDragging(false)}
    >
      <div className="card-top">
        <h3 className="card-title">{card.title}</h3>
        <span className={`badge priority-${card.priority.toLowerCase()}`}>{card.priority}</span>
      </div>
      <div className="card-meta">
        <span>
          <span aria-hidden="true">👤</span> <span className="sr-only">Assignee: </span>
          {card.assignee || 'Unassigned'}
        </span>
        <span className={overdue ? 'overdue' : ''}>
          <span aria-hidden="true">{overdue ? '⚠️' : '📅'}</span>{' '}
          <span className={overdue ? undefined : 'sr-only'}>{overdue ? 'Overdue: ' : 'Due: '}</span>
          {formatDate(card.dueDate)}
        </span>
      </div>
      <div className="card-actions">
        <button
          className="btn ghost icon"
          aria-label={`Edit ${card.title}`}
          title="Edit"
          onClick={() => onEdit(card)}
        >
          <svg {...svgProps}>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          ref={menuBtn}
          className="btn ghost icon"
          aria-label={`More actions for ${card.title}`}
          aria-haspopup="menu"
          aria-expanded={open}
          title="More actions"
          onClick={toggleMenu}
        >
          <svg {...svgProps} fill="currentColor" stroke="none">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>
      {menuPos && (
        <div
          ref={menu}
          className="menu"
          role="menu"
          aria-label={`Actions for ${card.title}`}
          style={{ top: menuPos.top, right: menuPos.right }}
          onKeyDown={onMenuKey}
        >
          <div role="group" aria-labelledby={`${card.id}-move`}>
            <div className="menu-label" id={`${card.id}-move`}>
              Move to
            </div>
            {COLUMNS.filter((c) => c.id !== card.column).map((c) => (
              <button
                key={c.id}
                role="menuitem"
                className="menu-item"
                onClick={() => {
                  close()
                  onMove(card.id, c.id)
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="menu-sep" role="separator" />
          <button
            role="menuitem"
            className="menu-item danger"
            onClick={() => {
              close()
              onDelete(card.id)
            }}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  )
}
