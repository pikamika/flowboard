import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import AssigneeSelect, { normalizeName } from './AssigneeSelect'

function Harness({ options = ['Mika', 'sam'], initial = '' }: { options?: string[]; initial?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <label htmlFor="a">Assignee</label>
      <AssigneeSelect id="a" options={options} value={value} onChange={setValue} />
      <output data-testid="value">{value}</output>
    </>
  )
}

const setup = () => ({ user: userEvent.setup() })
const box = () => screen.getByRole('combobox', { name: 'Assignee' })

describe('normalizeName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeName('  Mika   Isayama ')).toBe('Mika Isayama')
  })
})

describe('AssigneeSelect', () => {
  it('lists existing names alphabetically', async () => {
    const { user } = setup()
    render(<Harness />)
    await user.click(box())
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Mika', 'sam'])
  })

  it('selects an existing name', async () => {
    const { user } = setup()
    render(<Harness />)
    await user.click(box())
    await user.click(screen.getByRole('option', { name: 'sam' }))
    expect(screen.getByTestId('value')).toHaveTextContent('sam')
  })

  it('offers to add a new name and keeps it for later in the session', async () => {
    const { user } = setup()
    render(<Harness />)
    await user.click(box())
    await user.type(box(), 'Jordan')
    await user.click(screen.getByRole('option', { name: 'Add "Jordan"' }))
    expect(screen.getByTestId('value')).toHaveTextContent('Jordan')

    await user.click(box())
    expect(screen.getByRole('option', { name: 'Jordan' })).toBeInTheDocument()
  })

  it('rejects a duplicate name regardless of case or spacing', async () => {
    const { user } = setup()
    render(<Harness />)
    await user.click(box())
    await user.type(box(), '  MIKA ')

    expect(screen.getByRole('alert')).toHaveTextContent('"Mika" already exists')
    expect(screen.queryByRole('option', { name: /^Add/ })).toBeNull()
  })

  it('selects the highlighted existing name with Enter instead of adding a duplicate', async () => {
    const { user } = setup()
    render(<Harness />)
    await user.click(box())
    await user.type(box(), 'mika{Enter}')
    expect(screen.getByTestId('value')).toHaveTextContent('Mika')
  })

  it('closes on Escape without changing the value', async () => {
    const { user } = setup()
    render(<Harness initial="Mika" />)
    await user.click(box())
    await user.type(box(), 'zzz{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.getByTestId('value')).toHaveTextContent('Mika')
  })
})
