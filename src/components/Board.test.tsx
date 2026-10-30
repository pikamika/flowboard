import { act, createEvent, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fake } from '../test/fakeSupabase'
import { makeDataTransfer, makeRow, renderBoard } from '../test/helpers'

const column = (name: RegExp) => screen.getByRole('region', { name })
const openCardMenu = async (user: ReturnType<typeof import('@testing-library/user-event').default.setup>, title: string) =>
  user.click(screen.getByRole('button', { name: `More actions for ${title}` }))

describe('Board: rendering', () => {
  it('renders the four columns with the correct labels', async () => {
    await renderBoard()
    for (const label of ['Backlog', 'In Progress', 'In Review', 'Done']) {
      expect(screen.getByRole('heading', { level: 2, name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }
  })

  it('puts loaded cards in their columns, ordered by position', async () => {
    await renderBoard([
      makeRow({ id: 'b', title: 'Second', position: 2 }),
      makeRow({ id: 'a', title: 'First', position: 1 }),
      makeRow({ id: 'd', title: 'Shipped', column_id: 'done', position: 1 }),
    ])
    const titles = within(column(/^Backlog/)).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(['First', 'Second'])
    expect(within(column(/^Done/)).getByText('Shipped')).toBeInTheDocument()
  })

  it('shows an empty-state hint in empty columns', async () => {
    await renderBoard()
    expect(within(column(/^Backlog/)).getByText(/Drop a card here or add one below/)).toBeInTheDocument()
  })
})

describe('Board: creating cards', () => {
  async function fillAndSubmit(user: Awaited<ReturnType<typeof renderBoard>>['user'], submitName = 'Add card') {
    const dialog = await screen.findByRole('dialog', { name: 'New card' })
    await user.type(within(dialog).getByLabelText('Title'), '  Ship v1  ')
    await user.click(within(dialog).getByRole('combobox', { name: 'Assignee' }))
    await user.type(within(dialog).getByRole('combobox', { name: 'Assignee' }), 'Sam')
    await user.click(within(dialog).getByRole('option', { name: 'Add "Sam"' }))
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'High')
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2099-12-31' } })
    await user.click(within(dialog).getByRole('button', { name: submitName }))
  }

  it('adds a new card to Backlog from the toolbar button', async () => {
    const { user } = await renderBoard()
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    await fillAndSubmit(user)

    expect(await within(column(/^Backlog/)).findByText('Ship v1')).toBeInTheDocument()
    expect(fake.callsOf('insert')[0].payload).toEqual({
      title: 'Ship v1',
      assignee: 'Sam',
      priority: 'High',
      due_date: '2099-12-31',
      column_id: 'backlog',
      position: 1,
    })
  })

  it("adds to a specific column from that column's own button", async () => {
    const { user } = await renderBoard([makeRow({ id: 'x', column_id: 'in-review', position: 4 })])
    await user.click(within(column(/^In Review/)).getByRole('button', { name: /Add card/ }))
    await fillAndSubmit(user)

    expect(await within(column(/^In Review/)).findByText('Ship v1')).toBeInTheDocument()
    expect(fake.callsOf('insert')[0].payload).toMatchObject({ column_id: 'in-review', position: 5 })
  })

  it('does not save when the assignee is missing', async () => {
    const { user } = await renderBoard()
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Title'), 'No owner')
    fireEvent.change(within(dialog).getByLabelText('Due date'), { target: { value: '2099-01-01' } })
    await user.click(within(dialog).getByRole('button', { name: 'Add card' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Select or add an assignee.')
    expect(fake.callsOf('insert')).toHaveLength(0)
  })

  it('shows an error toast when saving fails', async () => {
    const { user } = await renderBoard()
    fake.failNext('insert', 'insert failed')
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    await fillAndSubmit(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('insert failed')
  })
})

describe('Board: editing cards', () => {
  it('prefills the dialog and saves changes', async () => {
    const { user } = await renderBoard([makeRow()])
    await user.click(screen.getByRole('button', { name: 'Edit Write docs' }))

    const dialog = await screen.findByRole('dialog', { name: 'Edit card' })
    const title = within(dialog).getByLabelText('Title')
    expect(title).toHaveValue('Write docs')
    expect(within(dialog).getByRole('combobox', { name: 'Assignee' })).toHaveValue('Mika')
    expect(within(dialog).getByLabelText('Priority')).toHaveValue('Medium')
    expect(within(dialog).getByLabelText('Due date')).toHaveValue('2099-01-01')

    await user.clear(title)
    await user.type(title, 'Write better docs')
    await user.selectOptions(within(dialog).getByLabelText('Priority'), 'Low')
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Write better docs')).toBeInTheDocument()
    expect(fake.callsOf('update')[0]).toMatchObject({
      id: 'c1',
      payload: { title: 'Write better docs', assignee: 'Mika', priority: 'Low', due_date: '2099-01-01' },
    })
  })

  it('shows Delete card only when editing, and deletes with Undo available', async () => {
    const { user } = await renderBoard([makeRow()])
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    expect(within(await screen.findByRole('dialog')).queryByRole('button', { name: 'Delete card' })).toBeNull()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await user.click(screen.getByRole('button', { name: 'Edit Write docs' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete card' }))

    await waitFor(() => expect(fake.callsOf('delete')).toHaveLength(1))
    expect(screen.queryByText('Write docs', { selector: 'h3' })).toBeNull()
    expect(await screen.findByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('discards changes on Escape', async () => {
    const { user } = await renderBoard([makeRow()])
    await user.click(screen.getByRole('button', { name: 'Edit Write docs' }))
    await user.type(await screen.findByLabelText('Title'), ' changed')
    await user.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getByText('Write docs')).toBeInTheDocument()
    expect(fake.callsOf('update')).toHaveLength(0)
  })
})

describe('Board: moving cards', () => {
  it('moves a card to another column from the ⋯ menu', async () => {
    const { user } = await renderBoard([makeRow()])
    await openCardMenu(user, 'Write docs')
    await user.click(screen.getByRole('menuitem', { name: 'In Progress' }))

    expect(await within(column(/^In Progress/)).findByText('Write docs')).toBeInTheDocument()
    expect(within(column(/^Backlog/)).queryByText('Write docs')).toBeNull()
    expect(fake.callsOf('update')[0].payload).toEqual({ column_id: 'in-progress', position: 1 })
  })

  it('moves a card with drag and drop', async () => {
    await renderBoard([makeRow()])
    const dataTransfer = makeDataTransfer()
    fireEvent.dragStart(screen.getByText('Write docs').closest('article')!, { dataTransfer })
    fireEvent.drop(column(/^Done/), { dataTransfer })

    expect(await within(column(/^Done/)).findByText('Write docs')).toBeInTheDocument()
    expect(fake.callsOf('update')[0].payload).toMatchObject({ column_id: 'done' })
  })

  it('reorders within a column by dropping above another card (midpoint position)', async () => {
    await renderBoard([
      makeRow({ id: 'a', title: 'A', position: 1 }),
      makeRow({ id: 'b', title: 'B', position: 2 }),
      makeRow({ id: 'c', title: 'C', position: 3 }),
    ])
    const dataTransfer = makeDataTransfer()
    fireEvent.dragStart(screen.getByText('C').closest('article')!, { dataTransfer })
    const target = screen.getByText('B').closest('article')!
    const drop = createEvent.drop(target, { dataTransfer })
    Object.defineProperty(drop, 'clientY', { value: -1 }) // above the target's midpoint
    fireEvent(target, drop)

    await waitFor(() => {
      const titles = within(column(/^Backlog/)).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
      expect(titles).toEqual(['A', 'C', 'B'])
    })
    expect(fake.callsOf('update')[0].payload).toEqual({ column_id: 'backlog', position: 1.5 })
  })

  it('puts a card at the top when dropped above the first card', async () => {
    await renderBoard([
      makeRow({ id: 'a', title: 'A', position: 1 }),
      makeRow({ id: 'b', title: 'B', position: 2 }),
    ])
    const dataTransfer = makeDataTransfer()
    fireEvent.dragStart(screen.getByText('B').closest('article')!, { dataTransfer })
    const target = screen.getByText('A').closest('article')!
    const drop = createEvent.drop(target, { dataTransfer })
    Object.defineProperty(drop, 'clientY', { value: -1 })
    fireEvent(target, drop)

    await waitFor(() => expect(fake.callsOf('update')[0].payload).toEqual({ column_id: 'backlog', position: 0 }))
  })

  it('reverts the move and shows an error if saving fails', async () => {
    const { user } = await renderBoard([makeRow()])
    fake.failNext('update', 'update failed')
    await openCardMenu(user, 'Write docs')
    await user.click(screen.getByRole('menuitem', { name: 'Done' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('update failed')
    await waitFor(() => expect(within(column(/^Backlog/)).getByText('Write docs')).toBeInTheDocument())
  })
})

describe('Board: deleting cards', () => {
  it('removes the card immediately and deletes it in the database', async () => {
    const { user } = await renderBoard([makeRow()])
    await openCardMenu(user, 'Write docs')
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(screen.queryByText('Write docs', { selector: 'h3' })).toBeNull()
    expect(fake.callsOf('delete')).toHaveLength(1)
    expect(fake.callsOf('delete')[0].id).toBe('c1')
    expect(fake.rows()).toHaveLength(0)
  })

  it('restores the card in the same place with Undo', async () => {
    const { user } = await renderBoard([makeRow({ column_id: 'in-review', position: 7 })])
    await openCardMenu(user, 'Write docs')
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Undo' }))

    expect(await within(column(/^In Review/)).findByText('Write docs')).toBeInTheDocument()
    expect(fake.callsOf('insert')[0].payload).toMatchObject({ id: 'c1', column_id: 'in-review', position: 7 })
  })

  it('brings the card back and shows an error if the delete fails', async () => {
    const { user } = await renderBoard([makeRow()])
    fake.failNext('delete', 'delete failed')
    await openCardMenu(user, 'Write docs')
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('delete failed')
    await waitFor(() => expect(screen.getByText('Write docs', { selector: 'h3' })).toBeInTheDocument())
  })
})

describe('Board: realtime sync', () => {
  it("shows a teammate's new card without a reload", async () => {
    await renderBoard()
    await act(async () => fake.addRemote(makeRow({ id: 'remote', title: 'From a teammate' })))
    expect(await screen.findByText('From a teammate')).toBeInTheDocument()
  })
})
