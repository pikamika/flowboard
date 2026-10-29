import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { fake } from './fakeSupabase'

// Every test talks to the in-memory fake, never to Supabase.
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => fake.client,
}))

// Safety net: any attempt to reach the network fails loudly.
const blocked = () => {
  throw new Error('Network access is blocked in tests')
}
vi.stubGlobal('fetch', blocked)
vi.stubGlobal('WebSocket', blocked)

beforeEach(() => {
  expect(import.meta.env.VITE_SUPABASE_URL).toBe('http://localhost:54321')
  fake.reset()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
