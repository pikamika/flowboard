import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Card, CardInput, ColumnId } from '../types'
import { COLUMNS } from '../types'
import { supabase, fromRow, toRow, type CardRow } from '../supabase'
import Column from './Column'
import Toast, { type ToastState } from './Toast'

const CardModal = lazy(() => import('./CardModal'))

type ModalState = { card: Card | null; column: ColumnId } | null

const byPosition = (a: Card, b: Card) => a.position - b.position

export default function Board() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [modal, setModal] = useState<ModalState>(null)
  const [announcement, setAnnouncement] = useState('')
  const pendingFocus = useRef<string | null>(null)
  const toastFallback = useRef<string | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  // Text for the always-present live region, read aloud by screen readers.
  const announce = useCallback((message: string) => setAnnouncement(message), [])

  const showToast = useCallback((t: ToastState, focusFallback?: string) => {
    toastFallback.current = focusFallback ?? null
    setToast(t)
  }, [])

  // Closing a toast must not strand keyboard focus, so hand it back to a sensible control.
  const dismissToast = useCallback(() => {
    const el = document.querySelector('.toast')
    if (el?.contains(document.activeElement) && toastFallback.current) {
      document.querySelector<HTMLElement>(toastFallback.current)?.focus()
    }
    setToast(null)
  }, [])

  const showError = useCallback(
    (message: string) => showToast({ message, kind: 'error' }),
    [showToast],
  )

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('position', { ascending: true })
    if (error) showError(error.message)
    else setCards((data as CardRow[]).map(fromRow))
    setLoading(false)
  }, [showError])

  // Remember what opened the dialog, then return focus to it once the dialog closes (WCAG 2.4.3).
  // Done here, after commit, because the board is inert while the dialog is open.
  const openModal = (state: NonNullable<ModalState>) => {
    openerRef.current = document.activeElement as HTMLElement | null
    setModal(state)
  }

  useEffect(() => {
    if (modal || !openerRef.current) return
    if (openerRef.current.isConnected) openerRef.current.focus()
    openerRef.current = null
  }, [modal])

  // After a card moves to another column its element is recreated; restore focus to it.
  useEffect(() => {
    if (!pendingFocus.current) return
    document.querySelector<HTMLElement>(pendingFocus.current)?.focus()
    pendingFocus.current = null
  }, [cards])

  useEffect(() => {
    load()
    // Keep the board in sync with changes made by teammates or other tabs.
    const channel = supabase
      .channel('cards-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, load)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  // Distinct assignee names already used on the board (case-insensitive).
  const assignees = useMemo(() => {
    const seen = new Map<string, string>()
    for (const c of cards) {
      const name = c.assignee.trim().replace(/\s+/g, ' ')
      if (name && !seen.has(name.toLocaleLowerCase())) seen.set(name.toLocaleLowerCase(), name)
    }
    return [...seen.values()]
  }, [cards])

  const columnCards = (column: ColumnId, exclude?: string) =>
    cards.filter((c) => c.column === column && c.id !== exclude).sort(byPosition)

  // Position that places a card before `beforeId` (or at the end) in a column.
  const positionFor = (column: ColumnId, cardId: string, beforeId: string | null): number => {
    const list = columnCards(column, cardId)
    if (list.length === 0) return 1
    const i = beforeId ? list.findIndex((c) => c.id === beforeId) : -1
    if (i === -1) return list[list.length - 1].position + 1
    if (i === 0) return list[0].position - 1
    return (list[i - 1].position + list[i].position) / 2
  }

  const handleSave = async (input: CardInput) => {
    const current = modal
    setModal(null)
    if (!current) return
    const editing = current.card
    if (editing) {
      setCards((prev) => prev.map((c) => (c.id === editing.id ? { ...c, ...input } : c)))
      const { error } = await supabase.from('cards').update(toRow(input)).eq('id', editing.id)
      if (error) showError(error.message)
      else announce(`Saved "${input.title}".`)
    } else {
      const { error } = await supabase.from('cards').insert({
        ...toRow(input),
        column_id: current.column,
        position: positionFor(current.column, '', null),
      })
      if (error) showError(error.message)
    }
    load()
  }

  const handleDelete = async (id: string) => {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    setCards((prev) => prev.filter((c) => c.id !== id))
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) {
      showError(error.message)
      load()
      return
    }
    announce(`Deleted "${card.title}". Undo is available.`)
    showToast(
      {
        message: `Deleted "${card.title}"`,
        kind: 'info',
        actionLabel: 'Undo',
        onAction: async () => {
          pendingFocus.current = `[data-card-id="${card.id}"]`
          announce(`Restored "${card.title}" to ${COLUMNS.find((c) => c.id === card.column)?.label}.`)
          setCards((prev) => [...prev, card])
          const { error } = await supabase.from('cards').insert({
            id: card.id,
            ...toRow(card),
            column_id: card.column,
            position: card.position,
          })
          if (error) showError(error.message)
          load()
        },
      },
      `[data-testid="column-${card.column}"] .add-card`,
    )
  }

  const handleMoveFromMenu = (id: string, column: ColumnId) => {
    const card = cards.find((c) => c.id === id)
    pendingFocus.current = `[data-card-id="${id}"]`
    announce(`Moved "${card?.title ?? 'card'}" to ${COLUMNS.find((c) => c.id === column)?.label}.`)
    handleDrop(id, column, null)
  }

  const handleDrop = async (cardId: string, column: ColumnId, beforeId: string | null) => {
    if (beforeId === cardId) return
    const position = positionFor(column, cardId, beforeId)
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, column, position } : c)))
    const { error } = await supabase
      .from('cards')
      .update({ column_id: column, position })
      .eq('id', cardId)
    if (error) {
      showError(error.message)
      load()
    }
  }

  return (
    <main className="board-wrap">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div inert={modal ? true : undefined}>
      <div className="board-toolbar">
        <button className="btn primary" onClick={() => openModal({ card: null, column: 'backlog' })}>
          + Add card
        </button>
      </div>
      <div className="board">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            id={col.id}
            label={col.label}
            cards={columnCards(col.id)}
            loading={loading}
            onDropCard={handleDrop}
            onMove={handleMoveFromMenu}
            onAdd={(column) => openModal({ card: null, column })}
            onEdit={(card) => openModal({ card, column: card.column })}
            onDelete={handleDelete}
          />
        ))}
      </div>
      </div>
      {modal && (
        <Suspense fallback={null}>
          <CardModal
            card={modal.card}
            assignees={assignees}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />
        </Suspense>
      )}
      {toast && <Toast toast={toast} onDismiss={dismissToast} />}
    </main>
  )
}
