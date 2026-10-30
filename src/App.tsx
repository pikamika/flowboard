import { lazy, Suspense, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import AuthForm from './components/AuthForm'
import { ColumnsIcon } from './components/icons'

const Board = lazy(() => import('./components/Board'))

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!ready) return <div className="auth-wrap muted" role="status">Loading…</div>
  if (!session) return <AuthForm />

  const email = session.user.email ?? ''

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo-tile" aria-hidden="true">
            <ColumnsIcon />
          </span>
          <span className="brand-name">FlowBoard</span>
        </div>
        <div className="user-menu">
          <span className="avatar" aria-hidden="true">
            {(email[0] ?? 'U').toUpperCase()}
          </span>
          <span className="user-email">{email}</span>
          <button className="nav-link" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <Suspense fallback={<p className="muted" role="status">Loading board…</p>}>
        <Board />
      </Suspense>
    </div>
  )
}
