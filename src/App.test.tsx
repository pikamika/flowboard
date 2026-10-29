import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fake } from './test/fakeSupabase'
import App from './App'

describe('App', () => {
  it('shows the sign-in page to signed-out visitors and never loads the board', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /Backlog/ })).toBeNull()
    expect(fake.callsOf('select')).toHaveLength(0)
  })

  it('shows the board to signed-in users and lets them sign out', async () => {
    fake.signInAs({ id: 'u1', email: 'me@example.com' })
    const user = userEvent.setup()
    render(<App />)
    expect(await screen.findByRole('region', { name: /^Backlog/ })).toBeInTheDocument()
    expect(screen.getByText('me@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument())
  })
})
