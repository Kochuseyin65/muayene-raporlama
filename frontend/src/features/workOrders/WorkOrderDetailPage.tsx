import { useParams } from 'react-router-dom'
import { Box, Button, Chip, Divider, Paper, Stack, Typography, MenuItem, TextField, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import PageHeader from '@/components/layout/PageHeader'
import { useAssignTechniciansMutation, useGetWorkOrderQuery, useUpdateStatusMutation, useUpdateWorkOrderMutation } from './workOrdersApi'
import { useToast } from '@/hooks/useToast'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useListTechniciansQuery } from '@/features/technicians/techniciansApi'
import { formatDate, formatDateTime } from '@/utils/date'
import { useEffect, useState } from 'react'

const statusColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  not_started: 'default', in_progress: 'info', completed: 'success', approved: 'info', sent: 'info'
}

export default function WorkOrderDetailPage() {
  const { id } = useParams()
  const workOrderId = Number(id)
  const { data, refetch } = useGetWorkOrderQuery(workOrderId)
  const wo = data?.data as any
  const { success, error } = useToast()
  const [updateWO] = useUpdateWorkOrderMutation()
  const [updateStatus] = useUpdateStatusMutation()
  const [assignTechs] = useAssignTechniciansMutation()
  const { data: techData } = useListTechniciansQuery()
  const techs = techData?.data || []

  const [assignIds, setAssignIds] = useState<number[]>([])
  useEffect(()=>{ if (wo) setAssignIds(wo.assignedTechnicians?.map((t:any)=>t.id) || []) }, [wo])

  return (
    <Box>
      <PageHeader
        title={`İş Emri ${wo?.work_order_number || ''}`}
        subtitle={wo && `${wo.customer_name} • ${wo.scheduled_date? formatDate(wo.scheduled_date): 'Planlanmamış'} • ${formatDateTime(wo.created_at)}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Chip label={wo?.status} color={wo? (statusColor[wo.status] || 'default') : 'default'} size="small" />
            <PermissionGuard anyOf={['updateWorkOrderStatus','companyAdmin']}>
              <TextField size="small" select value={wo?.status || 'not_started'} onChange={async (e)=>{ try{ await updateStatus({ id: workOrderId, status: e.target.value as any }).unwrap(); success('Durum güncellendi'); refetch()}catch(err:any){ error(err?.data?.error?.message||'Durum güncellenemedi') }}} sx={{ width: 160 }}>
                {['not_started','in_progress','completed','approved','sent'].map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </PermissionGuard>
          </Stack>
        }
      />

      {wo && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Muayeneler</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Muayene No</TableCell>
                    <TableCell>Ekipman</TableCell>
                    <TableCell>Teknisyen</TableCell>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Saat</TableCell>
                    <TableCell>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wo.inspections?.map((ins: any) => (
                    <TableRow key={ins.id} hover>
                      <TableCell>
                        <Button size="small" onClick={()=> { window.location.href = `/inspections/${ins.id}` }}>{ins.inspection_number || '-'}</Button>
                      </TableCell>
                      <TableCell>{ins.equipment_name}</TableCell>
                      <TableCell>{ins.technician_name} {ins.technician_surname}</TableCell>
                      <TableCell>{ins.inspection_date ? formatDate(ins.inspection_date) : '-'}</TableCell>
                      <TableCell>{(ins.start_time || '')}{ins.end_time ? `-${ins.end_time}` : ''}</TableCell>
                      <TableCell><Chip size="small" label={ins.status} color={ins.status==='completed' ? 'success' : ins.status==='in_progress' ? 'info' : 'default'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 360 } }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Atamalar</Typography>
              <PermissionGuard anyOf={['assignWorkOrder','companyAdmin']}>
                <TextField select SelectProps={{ multiple: true }} fullWidth value={assignIds} onChange={(e)=> setAssignIds((e.target.value as unknown as number[]))}>
                  {techs.map((t:any)=> <MenuItem key={t.id} value={t.id}>{t.name} {t.surname}</MenuItem>)}
                </TextField>
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button variant="contained" onClick={async ()=>{ try{ await assignTechs({ id: workOrderId, technicianIds: assignIds }).unwrap(); success('Teknisyen(ler) atandı'); refetch()}catch(err:any){ error(err?.data?.error?.message||'Atama başarısız') }}}>Kaydet</Button>
                </Stack>
              </PermissionGuard>
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Plan / Notlar</Typography>
              <Typography variant="body2" color="text.secondary">Planlanan Tarih: {wo.scheduled_date ? formatDate(wo.scheduled_date) : '-'}</Typography>
              {wo.notes && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{wo.notes}</Typography>}
            </Paper>
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Özet</Typography>
              <InfoRow label="İş Emri No" value={wo.work_order_number} />
              {wo.offer_number && <InfoRow label="Teklif No" value={wo.offer_number} />}
              <InfoRow label="Oluşturan" value={`${wo.created_by_name||''} ${wo.created_by_surname||''}`} />
              <InfoRow label="Oluşturulma" value={formatDateTime(wo.created_at)} />
              <InfoRow label="Muayene" value={`${wo.completed_inspections||0}/${wo.inspection_count||0}`} />
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
        <Typography variant="body2">{value as any}</Typography>
      ) : value}
    </Stack>
  )
}
