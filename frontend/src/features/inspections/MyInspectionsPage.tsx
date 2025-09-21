import { useMemo, useState } from 'react'
import { Box, Button, Chip, MenuItem, Stack, TextField, Tooltip } from '@mui/material'
import CachedIcon from '@mui/icons-material/Cached'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DataTable from '@/components/common/DataTable'
import PageHeader from '@/components/layout/PageHeader'
import { useListInspectionsQuery } from './inspectionsApi'
import { formatDate } from '@/utils/date'

const statusColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  not_started: 'default',
  in_progress: 'info',
  completed: 'success',
  approved: 'info',
}

export default function MyInspectionsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isFetching, refetch } = useListInspectionsQuery({
    page,
    limit,
    status: status || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    mine: true,
  }, { refetchOnMountOrArgChange: true })

  const rows = useMemo(() => (data?.data?.inspections || []).map((r) => ({ ...r })), [data])
  const total = data?.data?.pagination?.totalCount || 0

  const columns = [
    { id: 'inspection_number', label: 'Muayene No', render: (r: any) => <strong>{r.inspection_number || '-'}</strong> },
    { id: 'work_order_number', label: 'İş Emri' },
    { id: 'customer_name', label: 'Müşteri' },
    { id: 'equipment_name', label: 'Ekipman' },
    { id: 'inspection_date', label: 'Tarih', render: (r: any) => r.inspection_date ? formatDate(r.inspection_date) : '-' },
    { id: 'start_time', label: 'Saat', render: (r: any) => r.start_time ? `${r.start_time}${r.end_time ? ' - ' + r.end_time : ''}` : '-' },
    { id: 'status', label: 'Durum', render: (r: any) => <Chip size="small" label={r.status} color={statusColor[r.status] || 'default'} /> },
    { id: 'report_state', label: 'Rapor', render: (r: any) => r.report_id ? (r.is_signed ? 'İmzalı' : 'İmzasız') : '-' },
  ]

  const withActions = rows.map((row) => ({
    ...row,
    actions: (
      <Tooltip title="Detayı aç">
        <Button
          size="small"
          variant="outlined"
          endIcon={<ArrowForwardIcon fontSize="small" />}
          onClick={() => (window.location.href = `/inspections/${row.id}`)}
        >
          Görüntüle
        </Button>
      </Tooltip>
    ),
  }))

  return (
    <Box>
      <PageHeader title="Benim Muayenelerim" subtitle="Atandığınız muayeneler" />
      <DataTable
        columns={columns as any}
        rows={withActions}
        loading={isFetching}
        page={page}
        rowsPerPage={limit}
        totalCount={total}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
        actionsHeader={(
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              select
              label="Durum"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              {['not_started', 'in_progress', 'completed', 'approved'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="date"
              label="Başlangıç"
              InputLabelProps={{ shrink: true }}
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            />
            <TextField
              size="small"
              type="date"
              label="Bitiş"
              InputLabelProps={{ shrink: true }}
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            />
            <Button variant="text" size="small" startIcon={<CachedIcon />} onClick={() => refetch()}>
              Yenile
            </Button>
          </Stack>
        )}
      />
    </Box>
  )
}
