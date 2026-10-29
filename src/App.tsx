import { lazy, Suspense, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import AuthForm from './components/AuthForm'

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Flowboard</h1>
        <div className="user-menu">
          <span>{session.user.email}</span>
          <button className="btn small" onClick={() => supabase.auth.signOut()}>
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
