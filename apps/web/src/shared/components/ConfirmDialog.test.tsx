import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from './ConfirmDialog'
import { renderWithProviders } from '../../test/renderWithProviders'

describe('ConfirmDialog', () => {
  it('should render title and message when open', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        title="Delete Item"
        message="Are you sure you want to delete this item?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByText('Delete Item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    renderWithProviders(
      <ConfirmDialog
        open={false}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument()
  })

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    renderWithProviders(
      <ConfirmDialog
        open
        title="Delete Item"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        confirmLabel="Delete"
      />,
    )

    await user.click(screen.getByText('Delete'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    renderWithProviders(
      <ConfirmDialog
        open
        title="Delete Item"
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={onCancel}
        cancelLabel="Keep"
      />,
    )

    await user.click(screen.getByText('Keep'))
    expect(onCancel).toHaveBeenCalled()
  })
})
