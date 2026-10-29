import type { CardRow } from '../supabase'

type Op = 'select' | 'insert' | 'update' | 'delete'
type Result = { data: unknown; error: { message: string } | null }

export interface FakeUser {
  id: string
  email: string
}

/** In-memory stand-in for the Supabase client. Nothing here touches the network. */
export function createFakeSupabase() {
  let rows: CardRow[] = []
  let seq = 0
  let session: { user: FakeUser } | null = null
  const failures = new Map<Op, string>()
  const changeListeners: Array<() => void> = []
  const authListeners: Array<(event: string, s: typeof session) => void> = []

  const state = {
    calls: [] as { op: Op; payload?: unknown; id?: string }[],
    authCalls: [] as { op: string; payload?: unknown }[],
  }

  const take = (op: Op): { message: string } | null => {
    const message = failures.get(op)
    if (!message) return null
    failures.delete(op)
    return { message }
  }

  const sorted = () => [...rows].sort((a, b) => a.position - b.position)

  function builder(op: Op, payload?: unknown) {
    let id: string | undefined
    const run = (): Result => {
      state.calls.push({ op, payload, id })
      const error = take(op)
      if (error) return { data: null, error }
      if (op === 'select') return { data: sorted(), error: null }
      if (op === 'insert') {
        const p = payload as Partial<CardRow>
        rows.push({
          id: p.id ?? `generated-${++seq}`,
          title: '',
          assignee: '',
          priority: 'Medium',
          due_date: null,
          column_id: 'backlog',
          position: 0,
          created_at: new Date(2026, 0, 1, 0, 0, ++seq).toISOString(),
          ...p,
        } as CardRow)
      } else if (op === 'update') {
        rows = rows.map((r) => (r.id === id ? { ...r, ...(payload as object) } : r))
      } else if (op === 'delete') {
        rows = rows.filter((r) => r.id !== id)
      }
      return { data: null, error: null }
    }
    const q: Record<string, unknown> = {
      eq: (_col: string, value: string) => {
        id = value
        return q
      },
      order: () => q,
      select: () => q,
      then: (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(run()).then(resolve, reject),
    }
    return q
  }

  const client = {
    from: (table: string) => {
      if (table !== 'cards') throw new Error(`Unexpected table in test: ${table}`)
      return {
        select: () => builder('select'),
        insert: (payload: unknown) => builder('insert', payload),
        update: (payload: unknown) => builder('update', payload),
        delete: () => builder('delete'),
      }
    },
    channel: () => {
      const ch = {
        on: (_type: string, _filter: unknown, cb: () => void) => {
          changeListeners.push(cb)
          return ch
        },
        subscribe: () => ch,
      }
      return ch
    },
    removeChannel: () => {
      changeListeners.length = 0
    },
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (cb: (event: string, s: typeof session) => void) => {
        authListeners.push(cb)
        return { data: { subscription: { unsubscribe: () => authListeners.splice(authListeners.indexOf(cb), 1) } } }
      },
      signInWithPassword: async (payload: unknown) => {
        state.authCalls.push({ op: 'signIn', payload })
        if (authFailure) {
          const m = authFailure
          authFailure = null
          return { data: {}, error: { message: m } }
        }
        return { data: {}, error: null }
      },
      signUp: async (payload: unknown) => {
        state.authCalls.push({ op: 'signUp', payload })
        if (authFailure) {
          const m = authFailure
          authFailure = null
          return { data: {}, error: { message: m } }
        }
        return { data: { session: null }, error: null }
      },
      signOut: async () => {
        state.authCalls.push({ op: 'signOut' })
        session = null
        authListeners.forEach((cb) => cb('SIGNED_OUT', null))
        return { error: null }
      },
    },
  }

  let authFailure: string | null = null

  return {
    client,
    state,
    /** Replace all rows and clear recorded calls, failures and session. */
    reset(initial: CardRow[] = []) {
      rows = initial.map((r) => ({ ...r }))
      seq = 0
      session = null
      authFailure = null
      failures.clear()
      state.calls.length = 0
      state.authCalls.length = 0
    },
    rows: () => rows,
    callsOf: (op: Op) => state.calls.filter((c) => c.op === op),
    /** Make the next call of this kind return an error. */
    failNext: (op: Op, message = 'boom') => void failures.set(op, message),
    failNextAuth: (message: string) => void (authFailure = message),
    signInAs(user: FakeUser = { id: 'user-1', email: 'me@example.com' }) {
      session = { user }
    },
    /** Simulate a teammate changing data: mutate rows, then fire the realtime callback. */
    addRemote(row: CardRow) {
      rows.push(row)
      changeListeners.forEach((cb) => cb())
    },
  }
}

export const fake = createFakeSupabase()

export function makeRow(over: Partial<CardRow> = {}): CardRow {
  return {
    id: 'c1',
    title: 'Write docs',
    assignee: 'Mika',
    priority: 'Medium',
    due_date: '2099-01-01',
    column_id: 'backlog',
    position: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}
