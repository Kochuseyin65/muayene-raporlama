import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SendIcon from '@mui/icons-material/Send'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WorkIcon from '@mui/icons-material/Work'
import DataTable from '@/components/common/DataTable'
import PageHeader from '@/components/layout/PageHeader'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import { formatDateTime } from '@/utils/date'
import { formatCurrencyTRY } from '@/utils/format'
import { useListOffersQuery, useCreateOfferMutation, useUpdateOfferMutation, useDeleteOfferMutation, useApproveOfferMutation, useSendOfferMutation, useConvertToWorkOrderMutation, type Offer, type OfferItem } from './offersApi'
import { useListCustomersQuery } from '@/features/customers/customersApi'
import { useListEquipmentQuery } from '@/features/equipment/equipmentApi'
import { useNavigate } from 'react-router-dom'

const statusColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  pending: 'default',
  approved: 'success',
  sent: 'info',
  viewed: 'info',
  rejected: 'error',
}

export default function OffersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isFetching, refetch } = useListOffersQuery({ page, limit, search, status: status || undefined }, { refetchOnMountOrArgChange: true })
  const rows = useMemo(() => (data?.data?.offers || []).map((o) => ({ ...o })), [data])
  const total = data?.data?.pagination?.totalCount || 0
  const { success, error } = useToast()
  const navigate = useNavigate()

  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<null | Offer>(null)
  const [convertDialog, setConvertDialog] = useState<null | Offer>(null)

  const [createOffer, createState] = useCreateOfferMutation()
  const [updateOffer, updateState] = useUpdateOfferMutation()
  const [deleteOffer, deleteState] = useDeleteOfferMutation()
  const [approveOffer, approveState] = useApproveOfferMutation()
  const [sendOffer, sendState] = useSendOfferMutation()
  const [convertToWO, convertState] = useConvertToWorkOrderMutation()

  useEffect(() => {
    if (createState.isSuccess) { success('Teklif oluşturuldu'); setCreateDialog(false); refetch() }
    if (updateState.isSuccess) { success('Teklif güncellendi'); setEditDialog(null); refetch() }
    if (deleteState.isSuccess) { success('Teklif silindi'); refetch() }
    if (approveState.isSuccess) { success('Teklif onaylandı'); refetch() }
    if (sendState.isSuccess) { success('Teklif gönderildi'); refetch() }
    if (convertState.isSuccess) { success('İş emri oluşturuldu'); setConvertDialog(null); navigate(`/work-orders/${convertState.data.data.id}`) }
    const err = (createState.error as any) || (updateState.error as any) || (deleteState.error as any) || (approveState.error as any) || (sendState.error as any) || (convertState.error as any)
    if (err) error(err?.data?.error?.message || 'İşlem başarısız')
  }, [createState, updateState, deleteState, approveState, sendState, convertState])

  const columns = [
    { id: 'offer_number', label: 'Teklif No', render: (r: any) => <Button size="small" onClick={() => navigate(`/offers/${r.id}`)}>{r.offer_number}</Button> },
    { id: 'customer_name', label: 'Müşteri' },
    { id: 'status', label: 'Durum', render: (r: any) => <Chip label={r.status} color={statusColor[r.status] || 'default'} size="small" /> },
    { id: 'total_amount', label: 'Tutar', render: (r: any) => formatCurrencyTRY(r.total_amount) },
    { id: 'created_at', label: 'Oluşturulma', render: (r: any) => formatDateTime(r.created_at) },
  ]

  const withActions = rows.map((r) => ({
    ...r,
    actions: (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <PermissionGuard anyOf={['editOffer', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setEditDialog(r)}><EditIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['approveOffer', 'companyAdmin']}>
          <IconButton size="small" onClick={() => approveOffer(r.id)} disabled={r.status !== 'pending'}><CheckCircleIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['sendOffer', 'companyAdmin']}>
          <IconButton size="small" onClick={() => sendOffer(r.id)} disabled={r.status === 'sent'}><SendIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['createWorkOrder', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setConvertDialog(r)} disabled={!['approved','viewed'].includes(r.status)}><WorkIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['editOffer', 'companyAdmin']}>
          <IconButton size="small" color="error" onClick={() => onDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
        </PermissionGuard>
      </Stack>
    )
  }))

  const onDelete = async (r: Offer) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try { await deleteOffer(r.id).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Silme başarısız') }
  }

  return (
    <Box>
      <PageHeader
        title="Teklifler"
        actions={
          <PermissionGuard anyOf={['createOffer', 'companyAdmin']}>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateDialog(true)}>Yeni</Button>
          </PermissionGuard>
        }
      >
        <TextField size="small" placeholder="Durum" select value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="">Tümü</MenuItem>
          {['pending','approved','sent','viewed','rejected'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
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
        <OfferDialog open={createDialog} onClose={() => setCreateDialog(false)} onSave={async (values) => {
          try { await createOffer(values).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Oluşturma başarısız') }
        }} />
      )}
      {editDialog && (
        <OfferDialog open={!!editDialog} offer={editDialog} onClose={() => setEditDialog(null)} onSave={async (values) => {
          try { await updateOffer({ id: editDialog!.id, body: values }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Güncelleme başarısız') }
        }} />
      )}
      {convertDialog && (
        <ConvertDialog open={!!convertDialog} offer={convertDialog} onClose={() => setConvertDialog(null)} onSave={async (payload) => {
          try { await convertToWO({ id: convertDialog!.id, ...payload }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Dönüştürme başarısız') }
        }} />
      )}
    </Box>
  )
}

function OfferDialog({ open, onClose, onSave, offer }: { open: boolean; onClose: () => void; onSave: (values: { customerCompanyId: number; items: OfferItem[]; notes?: string }) => void; offer?: Offer }) {
  const { data: customersData } = useListCustomersQuery({ page: 1, limit: 1000 }, { refetchOnMountOrArgChange: false })
  const { data: equipmentData } = useListEquipmentQuery({ page: 1, limit: 1000 }, { refetchOnMountOrArgChange: false })
  const customers = customersData?.data?.customers || []
  const equipment = equipmentData?.data?.equipment || []

  const [customerCompanyId, setCustomerCompanyId] = useState<number>(offer?.customer_company_id || (customers[0]?.id || 0))
  const [items, setItems] = useState<OfferItem[]>(offer?.items || [])
  const [notes, setNotes] = useState<string>(offer?.notes || '')

  const addRow = () => setItems((arr) => [...arr, { equipmentId: equipment[0]?.id || 0, quantity: 1, unitPrice: 0 }])
  const updateRow = (idx: number, patch: Partial<OfferItem>) => setItems((arr) => arr.map((it, i) => i === idx ? { ...it, ...patch } : it))
  const removeRow = (idx: number) => setItems((arr) => arr.filter((_it, i) => i !== idx))
  const total = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)

  const submit = () => {
    if (!customerCompanyId || items.length === 0) return
    onSave({ customerCompanyId, items, notes: notes || undefined })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{offer ? 'Teklif Düzenle' : 'Yeni Teklif'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label="Müşteri" value={customerCompanyId} onChange={(e) => setCustomerCompanyId(Number(e.target.value))}>
            {customers.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <Stack spacing={1}>
            {items.map((it, idx) => (
              <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <TextField select fullWidth label="Ekipman" value={it.equipmentId} onChange={(e) => updateRow(idx, { equipmentId: Number(e.target.value) })}>
                  {equipment.map((e: any) => <MenuItem key={e.id} value={e.id}>{e.name} ({e.type})</MenuItem>)}
                </TextField>
                <TextField type="number" label="Adet" value={it.quantity} onChange={(e) => updateRow(idx, { quantity: Number(e.target.value) })} sx={{ width: 120 }} />
                <TextField type="number" label="Birim Fiyat (₺)" value={it.unitPrice} onChange={(e) => updateRow(idx, { unitPrice: Number(e.target.value) })} sx={{ width: 180 }} />
                <Button color="error" onClick={() => removeRow(idx)}>Sil</Button>
              </Stack>
            ))}
            <Button onClick={addRow}>Kalem Ekle</Button>
          </Stack>
          <TextField label="Notlar" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={3} />
          <Box textAlign="right">Toplam: <strong>{formatCurrencyTRY(total)}</strong></Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={submit}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}

function ConvertDialog({ open, onClose, onSave, offer }: { open: boolean; onClose: () => void; onSave: (payload: { scheduledDate?: string; notes?: string }) => void; offer: Offer }) {
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const submit = () => onSave({ scheduledDate: scheduledDate || undefined, notes: notes || undefined })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>İş Emrine Dönüştür</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField type="date" label="Planlanan Tarih" InputLabelProps={{ shrink: true }} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          <TextField label="Notlar" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={3} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={submit}>Dönüştür</Button>
      </DialogActions>
    </Dialog>
  )
}
