import { Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, TablePagination, CircularProgress, Box, TextField, Stack } from '@mui/material'
import type { ReactNode } from 'react'

export interface Column<T> {
  id: keyof T | string
  label: string
  minWidth?: number
  render?: (row: T) => ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  page: number
  rowsPerPage: number
  totalCount: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (rowsPerPage: number) => void
  search?: string
  onSearchChange?: (value: string) => void
  actionsHeader?: ReactNode
}

export default function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  loading,
  page,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  search,
  onSearchChange,
  actionsHeader,
}: Props<T>) {
  return (
    <Paper>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        {onSearchChange && (
          <TextField
            size="small"
            placeholder="Ara..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ width: 300 }}
          />
        )}
        <Box>{actionsHeader}</Box>
      </Stack>
      <TableContainer>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={String(c.id)} style={{ minWidth: c.minWidth }}>{c.label}</TableCell>
              ))}
              <TableCell align="right">Aksiyonlar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>
                  <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>Kayıt bulunamadı</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow hover key={String(row.id)}>
                  {columns.map((c) => (
                    <TableCell key={String(c.id)}>
                      {c.render ? c.render(row) : (row as any)[c.id as any]}
                    </TableCell>
                  ))}
                  <TableCell align="right">{(row as any).actions}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page - 1}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </Paper>
  )
}

