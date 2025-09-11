import { useParams } from 'react-router-dom'
import { Box, Chip, Paper, Stack, Typography, Button } from '@mui/material'
import PageHeader from '@/components/layout/PageHeader'
import { useGetInspectionQuery } from './inspectionsApi'
import { formatDate, formatDateTime } from '@/utils/date'

const statusColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  not_started: 'default', in_progress: 'info', completed: 'success', approved: 'info'
}

export default function InspectionDetailPage() {
  const { id } = useParams()
  const inspectionId = Number(id)
  const { data } = useGetInspectionQuery(inspectionId)
  const ins = data?.data as any

  return (
    <Box>
      <PageHeader
        title={`Muayene ${ins?.inspection_number || ''}`}
        subtitle={ins && `${ins.equipment_name} (${ins.equipment_type}) • ${ins.technician_name} ${ins.technician_surname}`}
        actions={<>
          <Chip label={ins?.status} color={ins? (statusColor[ins.status]||'default') : 'default'} size="small" />
          {ins && (
            <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
              <Button size="small" variant="outlined" onClick={()=> (window.location.href = `/inspections/${ins.id}/form`)}>Form</Button>
              <Button size="small" variant="outlined" onClick={()=> (window.location.href = `/inspections/${ins.id}/photos`)}>Fotoğraflar</Button>
              <Button size="small" variant="contained" onClick={()=> (window.location.href = `/inspections/${ins.id}/report`)}>Rapor</Button>
            </Stack>
          )}
        </>}
      />
      {ins && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Bilgiler</Typography>
              <InfoRow label="İş Emri" value={ins.work_order_number} />
              <InfoRow label="Müşteri" value={ins.customer_name} />
              <InfoRow label="Tarih" value={ins.inspection_date ? formatDate(ins.inspection_date) : '-'} />
              <InfoRow label="Saat" value={ins.start_time ? `${ins.start_time}${ins.end_time? ' - '+ins.end_time: ''}` : '-'} />
              <InfoRow label="Oluşturulma" value={ins.created_at ? formatDateTime(ins.created_at) : '-'} />
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 360 } }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Rapor</Typography>
              <InfoRow label="Rapor" value={ins.report_id ? (ins.is_signed ? 'İmzalı' : 'İmzasız') : '-'} />
              {ins.qr_token && <InfoRow label="QR" value={ins.qr_token} />}
            </Paper>
          </Box>
        </Stack>
      )}
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Typography variant="body2" sx={{ ml: 2 }}>{value as any}</Typography>
      ) : value}
    </Stack>
  )
}
