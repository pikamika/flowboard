import { createClient } from '@supabase/supabase-js'
import type { Card, CardInput, ColumnId, Priority } from './types'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export interface CardRow {
  id: string
  title: string
  assignee: string
  priority: Priority
  due_date: string | null
  column_id: ColumnId
  position: number
  created_at: string
}

export const fromRow = (r: CardRow): Card => ({
  id: r.id,
  title: r.title,
  assignee: r.assignee,
  priority: r.priority,
  dueDate: r.due_date ?? '',
  column: r.column_id,
  position: r.position,
})

export const toRow = (c: CardInput) => ({
  title: c.title,
  assignee: c.assignee,
  priority: c.priority,
  due_date: c.dueDate || null,
})
