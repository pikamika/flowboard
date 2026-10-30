import { useId, useState } from 'react'
import type { Card as CardType, ColumnId } from '../types'
import Card from './Card'
import { PlusIcon, UploadIcon } from './icons'

interface Props {
  id: ColumnId
  label: string
  cards: CardType[]
  loading: boolean
  onDropCard: (cardId: string, column: ColumnId, beforeId: string | null) => void
  onMove: (cardId: string, column: ColumnId) => void
  onAdd: (column: ColumnId) => void
  onEdit: (card: CardType) => void
  onDelete: (id: string) => void
}

export default function Column({
  id,
  label,
  cards,
  loading,
  onDropCard,
  onMove,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [over, setOver] = useState(false)
  const headingId = useId()

  // Find the card the dragged card should be placed before (null = end of column).
  const dropTarget = (e: React.DragEvent): string | null => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-card-id]')
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const targetId = el.dataset.cardId!
    if (e.clientY < rect.top + rect.height / 2) return targetId
    const i = cards.findIndex((c) => c.id === targetId)
    return cards[i + 1]?.id ?? null
  }

  return (
    <section
      className={`column${over ? ' drag-over' : ''}`}
      data-testid={`column-${id}`}
      aria-labelledby={headingId}
      aria-busy={loading}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const cardId = e.dataTransfer.getData('text/plain')
        if (cardId) onDropCard(cardId, id, dropTarget(e))
      }}
    >
      <h2 className="column-header" id={headingId}>
        {label}{' '}
        <span className="count">
          {cards.length}{' '}
          <span className="sr-only">{cards.length === 1 ? 'card' : 'cards'}</span>
        </span>
      </h2>
      {loading ? (
        <div className="column-cards" aria-hidden="true">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      ) : cards.length === 0 ? (
        <div className="empty">
          <UploadIcon />
          <p>Drop a card here or add one below</p>
        </div>
      ) : (
        <ul className="column-cards">
          {cards.map((card) => (
            <li key={card.id}>
              <Card card={card} onEdit={onEdit} onDelete={onDelete} onMove={onMove} />
            </li>
          ))}
        </ul>
      )}
      <button className="add-card" onClick={() => onAdd(id)}>
        <PlusIcon />
        <span>
          Add card<span className="sr-only"> to {label}</span>
        </span>
      </button>
    </section>
  )
}
