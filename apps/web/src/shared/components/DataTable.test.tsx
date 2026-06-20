import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable, type Column } from './DataTable'
import { renderWithProviders } from '../../test/renderWithProviders'

interface TestRow {
  id: string
  name: string
  value: number
}

const columns: Column<TestRow>[] = [
  { id: 'name', label: 'Name', render: (row) => row.name, sortable: true },
  { id: 'value', label: 'Value', render: (row) => row.value },
]

const testData: TestRow[] = [
  { id: '1', name: 'Item 1', value: 100 },
  { id: '2', name: 'Item 2', value: 200 },
]

describe('DataTable', () => {
  it('should render data rows', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        data={testData}
        totalCount={2}
        page={0}
        rowsPerPage={10}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('should render column headers', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        data={testData}
        totalCount={2}
        page={0}
        rowsPerPage={10}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('should show loading skeleton when isLoading is true', () => {
    const { container } = renderWithProviders(
      <DataTable
        columns={columns}
        data={[]}
        totalCount={0}
        page={0}
        rowsPerPage={10}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
        isLoading
      />,
    )

    // Skeleton renders MUI Skeleton components
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0)
  })

  it('should show empty state when no data', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        data={[]}
        totalCount={0}
        page={0}
        rowsPerPage={10}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
        emptyMessage="No items found"
      />,
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('should call onPageChange when pagination changes', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    renderWithProviders(
      <DataTable
        columns={columns}
        data={testData}
        totalCount={50}
        page={0}
        rowsPerPage={10}
        onPageChange={onPageChange}
        onRowsPerPageChange={vi.fn()}
      />,
    )

    // Click next page button
    const nextButton = screen.getByTitle('Go to next page')
    await user.click(nextButton)

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('should render actions column when renderActions is provided', () => {
    renderWithProviders(
      <DataTable
        columns={columns}
        data={testData}
        totalCount={2}
        page={0}
        rowsPerPage={10}
        onPageChange={vi.fn()}
        onRowsPerPageChange={vi.fn()}
        renderActions={(row) => <button data-testid={`edit-${row.id}`}>Edit</button>}
      />,
    )

    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByTestId('edit-1')).toBeInTheDocument()
    expect(screen.getByTestId('edit-2')).toBeInTheDocument()
  })
})
