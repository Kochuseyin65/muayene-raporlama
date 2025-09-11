import { Table, TableBody, TableCell, TableHead, TableRow, IconButton, TextField, Button, Stack, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'

export interface TableColumnDef {
  name: string
  label?: string
  type?: 'text' | 'number'
}

export default function TableFieldEditor({
  columns,
  value,
  onChange,
}: {
  columns: TableColumnDef[]
  value: any[] | null | undefined
  onChange: (val: any[]) => void
}) {
  const rows = Array.isArray(value) ? value : []

  const addRow = () => {
    const empty: Record<string, any> = {}
    columns.forEach((c) => (empty[c.name] = c.type === 'number' ? 0 : ''))
    onChange([...rows, empty])
  }

  const updateCell = (ri: number, c: TableColumnDef, v: string) => {
    const next = rows.map((row, idx) => {
      if (idx !== ri) return row
      const copy = { ...row }
      copy[c.name] = c.type === 'number' ? (v === '' ? null : Number(v)) : v
      return copy
    })
    onChange(next)
  }

  const removeRow = (ri: number) => {
    const next = rows.filter((_, idx) => idx !== ri)
    onChange(next)
  }

  if (!columns || columns.length === 0) {
    return <Typography variant="body2" color="text.secondary">Bu tabloda kolon tanımı yok.</Typography>
  }

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.name}>{c.label || c.name}</TableCell>
            ))}
            <TableCell align="right" width={56}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1}>
                <Typography variant="body2" color="text.secondary">Satır yok</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, ri) => (
              <TableRow key={ri} hover>
                {columns.map((c) => (
                  <TableCell key={c.name}>
                    <TextField
                      size="small"
                      type={c.type === 'number' ? 'number' : 'text'}
                      value={row?.[c.name] ?? ''}
                      onChange={(e) => updateCell(ri, c, e.target.value)}
                      fullWidth
                    />
                  </TableCell>
                ))}
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => removeRow(ri)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={addRow}>
          Satır Ekle
        </Button>
      </Stack>
    </>
  )
}

