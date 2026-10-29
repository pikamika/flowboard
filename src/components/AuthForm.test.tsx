import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { fake } from '../test/fakeSupabase'
import AuthForm from './AuthForm'

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText('Email'), 'me@example.com')
  await user.type(screen.getByLabelText('Password'), 'hunter22')
}

describe('AuthForm', () => {
  it('signs in with the entered credentials', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(fake.state.authCalls[0]).toEqual({
      op: 'signIn',
      payload: { email: 'me@example.com', password: 'hunter22' },
    })
  })

  it('shows a sign-in error', async () => {
    const user = userEvent.setup()
    fake.failNextAuth('Invalid login credentials')
    render(<AuthForm />)
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
  })

  it('tells new users to confirm their email after signing up', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)
    await user.click(screen.getByRole('button', { name: /Need an account/ }))
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(await screen.findByRole('status')).toHaveTextContent(/Check your email/)
  })
})
