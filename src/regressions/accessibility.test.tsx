import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Toast from '../components/Toast'
import AuthForm from '../components/AuthForm'
import CardModal from '../components/CardModal'
import { makeRow, renderBoard } from '../test/helpers'

// Regression tests for the WCAG 2.2 AA accessibility audit fixes.

afterEach(() => vi.useRealTimers())

describe('names, roles and structure', () => {
  it('gives the assignee combobox an accessible name (1.3.1 / 4.1.2)', () => {
    render(<CardModal card={null} assignees={[]} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('combobox', { name: 'Assignee' })).toBeInTheDocument()
  })

  it('names the dialog via aria-labelledby', () => {
    render(<CardModal card={null} assignees={[]} onSave={vi.fn()} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'New card' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('labels columns as regions with a card count in words', async () => {
    await renderBoard([makeRow(), makeRow({ id: 'c2', title: 'Two', position: 2 })])
    expect(screen.getByRole('region', { name: /^Backlog\s+2 cards$/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /^Done\s+0 cards$/ })).toBeInTheDocument()
  })

  it('renders cards as list items', async () => {
    await renderBoard([makeRow(), makeRow({ id: 'c2', title: 'Two', position: 2 })])
    const list = within(screen.getByRole('region', { name: /^Backlog/ })).getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  })

  it('hides decorative emoji and adds text labels for assignee and due date', async () => {
    await renderBoard([makeRow()])
    const card = screen.getByText('Write docs').closest('article')!
    expect(card).toHaveTextContent('Assignee: Mika')
    expect(card).toHaveTextContent('Due:')
    expect(card.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it('names the icon buttons and the ⋯ menu with the card title', async () => {
    const { user } = await renderBoard([makeRow()])
    expect(screen.getByRole('button', { name: 'Edit Write docs' })).toBeInTheDocument()
    const more = screen.getByRole('button', { name: 'More actions for Write docs' })
    expect(more).toHaveAttribute('aria-haspopup', 'menu')
    expect(more).toHaveAttribute('aria-expanded', 'false')

    await user.click(more)
    expect(more).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menu', { name: 'Actions for Write docs' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Move to' })).toBeInTheDocument()
  })

  it('has an always-present polite live region', async () => {
    await renderBoard()
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('makes the sign-in page a main landmark with h1 then h2 (and autofill hint)', () => {
    render(<AuthForm />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Flowboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email')
  })
})

describe('overdue dates (1.4.1 and local-time logic)', () => {
  const at = (iso: Date) => vi.useFakeTimers({ toFake: ['Date'], now: iso })

  it('runs these tests in a non-UTC timezone so the old UTC bug would show', () => {
    expect(new Date(2026, 9, 29, 23, 30).getTimezoneOffset()).toBe(420) // America/Los_Angeles (PDT)
  })

  it('marks overdue cards with text, not only colour', async () => {
    at(new Date(2026, 9, 29, 12, 0))
    await renderBoard([makeRow({ due_date: '2026-10-01' })])
    expect(screen.getByText('Overdue:')).toBeInTheDocument()
  })

  it("does not call today's local date overdue late in the evening", async () => {
    // 23:30 local on Oct 29 is already Oct 30 in UTC; the old toISOString() logic got this wrong.
    at(new Date(2026, 9, 29, 23, 30))
    await renderBoard([
      makeRow({ id: 'today', title: 'Due today', due_date: '2026-10-29' }),
      makeRow({ id: 'yest', title: 'Due yesterday', due_date: '2026-10-28', position: 2 }),
    ])
    const today = screen.getByText('Due today').closest('article')!
    const yest = screen.getByText('Due yesterday').closest('article')!
    expect(today).not.toHaveTextContent('Overdue')
    expect(yest).toHaveTextContent('Overdue')
  })

  it('never marks cards in Done as overdue', async () => {
    at(new Date(2026, 9, 29, 12, 0))
    await renderBoard([makeRow({ due_date: '2026-10-01', column_id: 'done' })])
    expect(screen.queryByText('Overdue:')).toBeNull()
  })
})

describe('keyboard and focus management', () => {
  it('closes the ⋯ menu with Escape and returns focus to its button (2.4.3)', async () => {
    const { user } = await renderBoard([makeRow()])
    const more = screen.getByRole('button', { name: 'More actions for Write docs' })
    await user.click(more)
    expect(screen.getByRole('menuitem', { name: 'In Progress' })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).toBeNull()
    expect(more).toHaveFocus()
  })

  it('moves focus through menu items with the arrow keys', async () => {
    const { user } = await renderBoard([makeRow()])
    await user.click(screen.getByRole('button', { name: 'More actions for Write docs' }))
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'In Review' })).toHaveFocus()
  })

  it('closes the menu when Tab leaves it', async () => {
    const { user } = await renderBoard([makeRow()])
    await user.click(screen.getByRole('button', { name: 'More actions for Write docs' }))
    await user.keyboard('{Tab}')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('announces a move and puts focus on the moved card', async () => {
    const { user } = await renderBoard([makeRow()])
    await user.click(screen.getByRole('button', { name: 'More actions for Write docs' }))
    await user.click(screen.getByRole('menuitem', { name: 'In Progress' }))

    expect(screen.getByRole('status')).toHaveTextContent('Moved "Write docs" to In Progress.')
    await waitFor(() => expect(document.activeElement).toHaveAttribute('data-card-id', 'c1'))
  })

  it('moves focus to Undo after a delete and announces it', async () => {
    const { user } = await renderBoard([makeRow()])
    await user.click(screen.getByRole('button', { name: 'More actions for Write docs' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(await screen.findByRole('button', { name: 'Undo' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('Deleted "Write docs". Undo is available.')
  })

  it('hands focus back to the opening button when the dialog closes', async () => {
    const { user } = await renderBoard()
    const add = screen.getByRole('button', { name: '+ Add card' })
    await user.click(add)
    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(add).toHaveFocus()
  })

  it('makes the board inert while the dialog is open', async () => {
    const { user, container } = await renderBoard()
    await user.click(screen.getByRole('button', { name: '+ Add card' }))
    await screen.findByRole('dialog')
    expect(container.querySelector('[inert]')).not.toBeNull()
  })

  it('keeps Tab inside the dialog (focus trap)', async () => {
    const user = userEvent.setup()
    render(<CardModal card={null} assignees={[]} onSave={vi.fn()} onClose={vi.fn()} />)
    const title = screen.getByLabelText('Title')
    const submit = screen.getByRole('button', { name: 'Add card' })

    submit.focus()
    await user.tab()
    expect(title).toHaveFocus()
    await user.tab({ shift: true })
    expect(submit).toHaveFocus()
  })
})

describe('notifications (2.2.1)', () => {
  const info = { message: 'Deleted "x"', kind: 'info' as const, actionLabel: 'Undo', onAction: vi.fn() }

  it('stays visible while hovered and only then times out', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast toast={info} onDismiss={onDismiss} />)
    const toast = screen.getByText('Deleted "x"').parentElement!

    act(() => void vi.advanceTimersByTime(9000))
    expect(onDismiss).not.toHaveBeenCalled()

    fireEvent.mouseEnter(toast)
    act(() => void vi.advanceTimersByTime(60000))
    expect(onDismiss).not.toHaveBeenCalled()

    fireEvent.mouseLeave(toast)
    act(() => void vi.advanceTimersByTime(10000))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('announces errors with role="alert" and lets users dismiss', async () => {
    const onDismiss = vi.fn()
    render(<Toast toast={{ message: 'Nope', kind: 'error' }} onDismiss={onDismiss} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Nope')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(onDismiss).toHaveBeenCalled()
  })
})
