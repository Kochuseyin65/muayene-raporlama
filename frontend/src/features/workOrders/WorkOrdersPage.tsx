import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import CachedIcon from '@mui/icons-material/Cached'
import DataTable from '@/components/common/DataTable'
import PageHeader from '@/components/layout/PageHeader'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { formatDate, formatDateTime } from '@/utils/date'
import { useListWorkOrdersQuery, useCreateWorkOrderMutation, useUpdateWorkOrderMutation, useAssignTechniciansMutation, useUpdateStatusMutation, useDeleteWorkOrderMutation, type WorkOrder } from './workOrdersApi'
import { useListCustomersQuery } from '@/features/customers/customersApi'
import { useListEquipmentQuery } from '@/features/equipment/equipmentApi'
import { useListTechniciansQuery } from '@/features/technicians/techniciansApi'
import { useNavigate } from 'react-router-dom'

const statusColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  not_started: 'default',
  in_progress: 'info',
  completed: 'success',
  approved: 'info',
  sent: 'info',
}

export default function WorkOrdersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isFetching, refetch } = useListWorkOrdersQuery({ page, limit, search, status: status || undefined }, { refetchOnMountOrArgChange: true })
  const rows = useMemo(() => (data?.data?.workOrders || []).map((o) => ({ ...o })), [data])
  const total = data?.data?.pagination?.totalCount || 0
  const { success, error } = useToast()
  const navigate = useNavigate()

  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<null | WorkOrder>(null)
  const [assignDialog, setAssignDialog] = useState<null | WorkOrder>(null)

  const [createWO, createState] = useCreateWorkOrderMutation()
  const [updateWO, updateState] = useUpdateWorkOrderMutation()
  const [assignTechs, assignState] = useAssignTechniciansMutation()
  const [updateStatus, statusState] = useUpdateStatusMutation()
  const [deleteWO, deleteState] = useDeleteWorkOrderMutation()

  useEffect(() => {
    if (createState.isSuccess) { success('İş emri oluşturuldu'); setCreateDialog(false); refetch() }
    if (updateState.isSuccess) { success('İş emri güncellendi'); setEditDialog(null); refetch() }
    if (assignState.isSuccess) { success('Teknisyen(ler) atandı'); setAssignDialog(null); refetch() }
    if (statusState.isSuccess) { success('Durum güncellendi'); refetch() }
    if (deleteState.isSuccess) { success('İş emri silindi'); refetch() }
    const err = (createState.error as any) || (updateState.error as any) || (assignState.error as any) || (statusState.error as any) || (deleteState.error as any)
    if (err) error(err?.data?.error?.message || 'İşlem başarısız')
  }, [createState, updateState, assignState, statusState, deleteState])

  const columns = [
    { id: 'work_order_number', label: 'İş Emri No', render: (r: any) => <Button size="small" onClick={() => navigate(`/work-orders/${r.id}`)}>{r.work_order_number}</Button> },
    { id: 'customer_name', label: 'Müşteri' },
    { id: 'status', label: 'Durum', render: (r: any) => <Chip label={r.status} color={statusColor[r.status] || 'default'} size="small" /> },
    { id: 'inspection_count', label: 'Muayene', render: (r: any) => `${r.completed_inspections || 0}/${r.inspection_count || 0}` },
    { id: 'scheduled_date', label: 'Plan', render: (r: any) => r.scheduled_date ? formatDate(r.scheduled_date) : '-' },
    { id: 'created_at', label: 'Oluşturulma', render: (r: any) => formatDateTime(r.created_at) },
  ]

  const withActions = rows.map((r) => ({
    ...r,
    actions: (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <PermissionGuard anyOf={['editWorkOrder', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setEditDialog(r)}><EditIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['assignWorkOrder', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setAssignDialog(r)}><GroupAddIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['updateWorkOrderStatus', 'companyAdmin']}>
          <StatusSwitcher wo={r} onChange={(st) => updateStatus({ id: r.id, status: st })} />
        </PermissionGuard>
        <PermissionGuard anyOf={['editWorkOrder', 'companyAdmin']}>
          <IconButton size="small" color="error" onClick={() => onDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
        </PermissionGuard>
      </Stack>
    )
  }))

  const onDelete = async (r: WorkOrder) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await deleteWO(r.id).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Silme başarısız') }
  }

  return (
    <Box>
      <PageHeader
        title="İş Emirleri"
        actions={
          <PermissionGuard anyOf={['createWorkOrder', 'companyAdmin']}>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateDialog(true)}>Yeni</Button>
          </PermissionGuard>
        }
      >
        <TextField size="small" placeholder="Durum" select value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="">Tümü</MenuItem>
          {['not_started','in_progress','completed','approved','sent'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </PageHeader>
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
      />

      {createDialog && (
        <WorkOrderDialog open={createDialog} onClose={() => setCreateDialog(false)} onSave={async (values) => {
          try { await createWO(values).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Oluşturma başarısız') }
        }} />
      )}
      {editDialog && (
        <WorkOrderDialog open={!!editDialog} workOrder={editDialog} onClose={() => setEditDialog(null)} onSave={async (values) => {
          try { await updateWO({ id: editDialog!.id, body: values }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Güncelleme başarısız') }
        }} />
      )}
      {assignDialog && (
        <AssignDialog open={!!assignDialog} workOrder={assignDialog} onClose={() => setAssignDialog(null)} onSave={async (technicianIds) => {
          try { await assignTechs({ id: assignDialog!.id, technicianIds }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Atama başarısız') }
        }} />
      )}
    </Box>
  )
}

function WorkOrderDialog({ open, onClose, onSave, workOrder }: { open: boolean; onClose: () => void; onSave: (values: { customerCompanyId: number; assignedTechnicians?: number[]; scheduledDate?: string; equipmentIds?: number[]; notes?: string }) => void; workOrder?: WorkOrder }) {
  const { data: customersData } = useListCustomersQuery({ page: 1, limit: 1000 }, { refetchOnMountOrArgChange: false })
  const { data: equipmentData } = useListEquipmentQuery({ page: 1, limit: 1000 }, { refetchOnMountOrArgChange: false })
  const { data: techData } = useListTechniciansQuery()
  const customers = customersData?.data?.customers || []
  const equipment = equipmentData?.data?.equipment || []
  const techs = techData?.data || []

  const [customerCompanyId, setCustomerCompanyId] = useState<number>(workOrder?.customer_company_id || (customers[0]?.id || 0))
  const [assignedTechnicians, setAssignedTechnicians] = useState<number[]>(workOrder?.assignedTechnicians?.map(t => t.id) || [])
  const [equipmentIds, setEquipmentIds] = useState<number[]>([])
  const [scheduledDate, setScheduledDate] = useState<string>(workOrder?.scheduled_date?.slice(0,10) || '')
  const [notes, setNotes] = useState<string>(workOrder?.notes || '')

  const submit = () => {
    if (!customerCompanyId) return
    onSave({ customerCompanyId, assignedTechnicians: assignedTechnicians.length? assignedTechnicians: undefined, scheduledDate: scheduledDate || undefined, equipmentIds: equipmentIds.length? equipmentIds: undefined, notes: notes || undefined })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{workOrder ? 'İş Emri Düzenle' : 'Yeni İş Emri'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label="Müşteri" value={customerCompanyId} onChange={(e) => setCustomerCompanyId(Number(e.target.value))}>
            {customers.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select SelectProps={{ multiple: true }} label="Teknisyenler" value={assignedTechnicians} onChange={(e) => setAssignedTechnicians((e.target.value as unknown as number[]))}>
            {techs.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name} {t.surname}</MenuItem>)}
          </TextField>
          <TextField select SelectProps={{ multiple: true }} label="Ekipmanlar (Muayene oluşturur)" value={equipmentIds} onChange={(e) => setEquipmentIds((e.target.value as unknown as number[]))}>
            {equipment.map((eq: any) => <MenuItem key={eq.id} value={eq.id}>{eq.name} ({eq.type})</MenuItem>)}
          </TextField>
          <TextField type="date" label="Planlanan Tarih" InputLabelProps={{ shrink: true }} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          <TextField label="Notlar" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={3} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={submit}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}

function AssignDialog({ open, onClose, onSave, workOrder }: { open: boolean; onClose: () => void; onSave: (technicianIds: number[]) => void; workOrder: WorkOrder }) {
  const { data: techData } = useListTechniciansQuery()
  const techs = techData?.data || []
  const [techIds, setTechIds] = useState<number[]>(workOrder.assignedTechnicians?.map(t => t.id) || [])
  const submit = () => onSave(techIds)
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Teknisyen Ata</DialogTitle>
      <DialogContent>
        <TextField select SelectProps={{ multiple: true }} fullWidth label="Teknisyenler" value={techIds} onChange={(e) => setTechIds((e.target.value as unknown as number[]))} sx={{ mt: 1 }}>
          {techs.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name} {t.surname}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={submit}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}

function StatusSwitcher({ wo, onChange }: { wo: WorkOrder; onChange: (status: WorkOrder['status']) => void }) {
  const [value, setValue] = useState<WorkOrder['status']>(wo.status)
  useEffect(() => { setValue(wo.status) }, [wo.status])
  return (
    <TextField size="small" select value={value} onChange={(e) => { const v = e.target.value as WorkOrder['status']; setValue(v); onChange(v) }} sx={{ width: 140 }}>
      {['not_started','in_progress','completed','approved','sent'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
    </TextField>
  )
}
