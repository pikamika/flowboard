import { expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CardRow } from '../supabase'
import Board from '../components/Board'
import { fake, makeRow } from './fakeSupabase'

export { makeRow }

/** Render the board against the fake database and wait until the first load finishes. */
export async function renderBoard(rows: CardRow[] = []) {
  fake.reset(rows)
  fake.signInAs()
  const user = userEvent.setup()
  const utils = render(<Board />)
  await waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeNull())
  return { user, ...utils }
}

/** A DataTransfer stand-in for jsdom drag events. */
export function makeDataTransfer() {
  const store = new Map<string, string>()
  return {
    setData: (k: string, v: string) => void store.set(k, v),
    getData: (k: string) => store.get(k) ?? '',
    effectAllowed: 'move',
    dropEffect: 'move',
  }
}
