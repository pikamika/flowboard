import { describe, it } from 'vitest'

// The security hardening migration (board_members + stricter RLS, grants, input limits) and the
// matching front-end changes have NOT been applied yet, so there is nothing to lock in.
// These are placeholders so the pending work stays visible in every test run.
// RLS itself lives in Postgres: test it with SQL role simulation in Supabase, not in Vitest.
describe('security hardening (pending: not applied yet)', () => {
  it.todo('non-members see an "ask an admin" screen instead of the board')
  it.todo('Delete is hidden on cards the user did not create (unless admin)')
  it.todo('sign-in failures show a generic "Invalid email or password" message')
  it.todo('sign-up requires a password of at least 8 characters')
  it.todo('production build includes a Content-Security-Policy meta tag')
})
