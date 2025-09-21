import { useMemo, useState } from 'react'
import { Box, Button, Chip, MenuItem, Stack, TextField, Tooltip } from '@mui/material'
import CachedIcon from '@mui/icons-material/Cached'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DataTable from '@/components/common/DataTable'
import PageHeader from '@/components/layout/PageHeader'
import { useListWorkOrdersQuery } from './workOrdersApi'
import { formatDate, formatDateTime } from '@/utils/date'
import { useNavigate } from 'react-router-dom'

const statusColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  not_started: 'default',
  in_progress: 'info',
  completed: 'success',
  approved: 'info',
  sent: 'info',
}

export default function MyWorkOrdersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const navigate = useNavigate()

  const { data, isFetching, refetch } = useListWorkOrdersQuery({
    page,
    limit,
    search: search || undefined,
    status: status || undefined,
    mine: true,
  }, { refetchOnMountOrArgChange: true })

  const rows = useMemo(() => (data?.data?.workOrders || []).map((o) => ({ ...o })), [data])
  const total = data?.data?.pagination?.totalCount || 0

  const columns = [
    { id: 'work_order_number', label: 'İş Emri', render: (r: any) => <strong>{r.work_order_number}</strong> },
    { id: 'customer_name', label: 'Müşteri' },
    { id: 'status', label: 'Durum', render: (r: any) => <Chip label={r.status} color={statusColor[r.status] || 'default'} size="small" /> },
    { id: 'inspection_count', label: 'Muayene', render: (r: any) => `${r.completed_inspections || 0}/${r.inspection_count || 0}` },
    { id: 'scheduled_date', label: 'Planlanan Tarih', render: (r: any) => r.scheduled_date ? formatDate(r.scheduled_date) : '-' },
    { id: 'created_at', label: 'Oluşturulma', render: (r: any) => r.created_at ? formatDateTime(r.created_at) : '-' },
  ]

  const withActions = rows.map((row) => ({
    ...row,
    actions: (
      <Tooltip title="Detayı aç">
        <Button
          size="small"
          variant="outlined"
          endIcon={<ArrowForwardIcon fontSize="small" />}
          onClick={() => navigate(`/work-orders/${row.id}`)}
        >
          Görüntüle
        </Button>
      </Tooltip>
    ),
  }))

  return (
    <Box>
      <PageHeader title="Benim İş Emirlerim" subtitle="Atandığınız iş emirlerinin listesi" />
      <DataTable
        columns={columns as any}
        rows={withActions}
        loading={isFetching}
        page={page}
        rowsPerPage={limit}
        totalCount={total}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
        search={search}
        onSearchChange={setSearch}
        actionsHeader={(
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              select
              label="Durum"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="">Tümü</MenuItem>
              {['not_started', 'in_progress', 'completed', 'approved', 'sent'].map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </TextField>
            <Button variant="text" size="small" startIcon={<CachedIcon />} onClick={() => refetch()}>
              Yenile
            </Button>
          </Stack>
        )}
      />
    </Box>
  )
}
