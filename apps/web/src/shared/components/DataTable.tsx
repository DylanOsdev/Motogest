import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Skeleton,
  Typography,
  Box,
} from '@mui/material'

export interface Column<T> {
  id: string
  label: string
  render: (row: T) => React.ReactNode
  sortable?: boolean
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  totalCount: number
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
  isLoading?: boolean
  getRowId?: (row: T) => string | number
  renderActions?: (row: T) => React.ReactNode
  emptyMessage?: string
}

export function DataTable<T>({
  columns,
  data,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  sortBy,
  sortOrder = 'asc',
  onSort,
  isLoading = false,
  getRowId,
  renderActions,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const handleSort = (columnId: string) => {
    onSort?.(columnId)
  }

  if (isLoading) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton width={80} />
                  </TableCell>
                ))}
                {renderActions && <TableCell align="right"><Skeleton width={60} /></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: rowsPerPage }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton />
                    </TableCell>
                  ))}
                  {renderActions && <TableCell align="right"><Skeleton /></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    )
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ width: '100%', p: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id}>
                  {col.sortable && onSort ? (
                    <TableSortLabel
                      active={sortBy === col.id}
                      direction={sortBy === col.id ? sortOrder : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              {renderActions && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={getRowId ? getRowId(row) : index} hover>
                {columns.map((col) => (
                  <TableCell key={col.id}>{col.render(row)}</TableCell>
                ))}
                {renderActions && (
                  <TableCell align="right">{renderActions(row)}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Paper>
  )
}
