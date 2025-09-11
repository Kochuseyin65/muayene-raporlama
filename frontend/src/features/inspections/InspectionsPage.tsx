import { useMemo, useState } from 'react'
import { Box, Button, Chip, MenuItem, Stack, TextField } from '@mui/material'
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

export default function InspectionsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [equipmentType, setEquipmentType] = useState('')

  const { data, isFetching } = useListInspectionsQuery({ page, limit, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, equipmentType: equipmentType || undefined })
  const rows = useMemo(() => (data?.data?.inspections || []).map((r) => ({ ...r })), [data])
  const total = data?.data?.pagination?.totalCount || 0

  const columns = [
    { id: 'inspection_number', label: 'Muayene No', render: (r: any) => <Button size="small" onClick={() => (window.location.href = `/inspections/${r.id}`)}>{r.inspection_number || '-'}</Button> },
    { id: 'work_order_number', label: 'İş Emri' },
    { id: 'customer_name', label: 'Müşteri' },
    { id: 'equipment_name', label: 'Ekipman' },
    { id: 'equipment_type', label: 'Tür' },
    { id: 'technician_name', label: 'Teknisyen', render: (r: any) => `${r.technician_name} ${r.technician_surname}` },
    { id: 'inspection_date', label: 'Tarih', render: (r: any) => r.inspection_date ? formatDate(r.inspection_date) : '-' },
    { id: 'start_time', label: 'Saat', render: (r: any) => r.start_time ? `${r.start_time}${r.end_time ? ' - '+r.end_time : ''}` : '-' },
    { id: 'status', label: 'Durum', render: (r: any) => <Chip size="small" label={r.status} color={statusColor[r.status] || 'default'} /> },
    { id: 'report', label: 'Rapor', render: (r: any) => r.report_id ? (r.is_signed ? 'İmzalı' : 'İmzasız') : '-' },
  ]

  const filtered = search ? rows.filter((r) => `${r.work_order_number} ${r.customer_name} ${r.equipment_name} ${r.technician_name} ${r.technician_surname}`.toLowerCase().includes(search.toLowerCase())) : rows

  return (
    <Box>
      <PageHeader title="Muayeneler">
        <Stack direction="row" spacing={1}>
          <TextField size="small" placeholder="Ara" value={search} onChange={(e)=> setSearch(e.target.value)} />
          <TextField size="small" select placeholder="Durum" value={status} onChange={(e)=> setStatus(e.target.value)}>
            <MenuItem value="">Tümü</MenuItem>
            {['not_started','in_progress','completed','approved'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField size="small" type="date" label="Başlangıç" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e)=> setDateFrom(e.target.value)} />
          <TextField size="small" type="date" label="Bitiş" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e)=> setDateTo(e.target.value)} />
          <TextField size="small" placeholder="Tür" value={equipmentType} onChange={(e)=> setEquipmentType(e.target.value)} />
        </Stack>
      </PageHeader>
      <DataTable
        columns={columns as any}
        rows={filtered}
        loading={isFetching}
        page={page}
        rowsPerPage={limit}
        totalCount={total}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
      />
    </Box>
  )
}
