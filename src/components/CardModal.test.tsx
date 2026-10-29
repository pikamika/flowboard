import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CardModal from './CardModal'

const setup = (over: Partial<React.ComponentProps<typeof CardModal>> = {}) => {
  const props = { card: null, assignees: ['Mika'], onSave: vi.fn(), onClose: vi.fn(), ...over }
  render(<CardModal {...props} />)
  return { props, user: userEvent.setup() }
}

describe('CardModal', () => {
  it('saves trimmed values for a new card', async () => {
    const { props, user } = setup()
    await user.type(screen.getByLabelText('Title'), '  Plan sprint ')
    await user.click(screen.getByRole('combobox', { name: 'Assignee' }))
    await user.click(screen.getByRole('option', { name: 'Mika' }))
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2099-05-05' } })
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    expect(props.onSave).toHaveBeenCalledWith({
      title: 'Plan sprint',
      assignee: 'Mika',
      priority: 'Medium',
      dueDate: '2099-05-05',
    })
  })

  it('requires an assignee', async () => {
    const { props, user } = setup()
    await user.type(screen.getByLabelText('Title'), 'x')
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2099-05-05' } })
    await user.click(screen.getByRole('button', { name: 'Add card' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Select or add an assignee.')
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('closes on Escape and on Cancel', async () => {
    const { props, user } = setup()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(props.onClose).toHaveBeenCalledTimes(2)
  })
})
