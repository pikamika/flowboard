import { useState } from 'react'
import { supabase } from '../supabase'
import { ColumnsIcon } from './icons'

type Mode = 'signin' | 'signup'

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else if (!data.session) setNotice('Check your email to confirm your account, then sign in.')
    }
    setBusy(false)
  }

  const choose = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  return (
    <main className="auth-wrap">
      <div className="auth-intro">
        <span className="logo-tile large" aria-hidden="true">
          <ColumnsIcon size={24} />
        </span>
        <h1>FlowBoard</h1>
        <p>{mode === 'signin' ? 'Sign in to manage your boards' : 'Create an account to get started'}</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2 className="sr-only">{mode === 'signin' ? 'Sign in' : 'Create your account'}</h2>
        <div className="segmented" role="radiogroup" aria-label="Account">
          {(['signin', 'signup'] as const).map((m) => (
            <label key={m} className={mode === m ? 'segment selected' : 'segment'}>
              <input
                type="radio"
                name="mode"
                checked={mode === m}
                onChange={() => choose(m)}
                aria-label={m === 'signin' ? 'Sign in' : 'Sign up'}
              />
              <span aria-hidden="true">{m === 'signin' ? 'Sign in' : 'Sign up'}</span>
            </label>
          ))}
        </div>
        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-notice" role="status">{notice}</p>}
        <button type="submit" className="btn primary block" disabled={busy}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </main>
  )
}
