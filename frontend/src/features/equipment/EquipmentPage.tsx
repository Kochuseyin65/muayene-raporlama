import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Stack, TextField, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DataTable from '@/components/common/DataTable'
import { useListEquipmentQuery, useGetEquipmentTypesQuery, useCreateEquipmentMutation, useUpdateEquipmentMutation, useUpdateTemplateMutation, useDeleteEquipmentMutation, type Equipment } from './equipmentApi'
import TemplateBuilderDialog from './TemplateBuilderDialog'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import PageHeader from '@/components/layout/PageHeader'
import { formatDateTime } from '@/utils/date'

export default function EquipmentPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const { data, isFetching, refetch } = useListEquipmentQuery({ page, limit, search, type: typeFilter || undefined }, { refetchOnMountOrArgChange: true })
  const { data: types } = useGetEquipmentTypesQuery()
  const rows = useMemo(() => (data?.data?.equipment || []).map((e) => ({ ...e })), [data])
  const total = data?.data?.pagination?.totalCount || 0
  const { success, error } = useToast()

  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<null | Equipment>(null)
  const [templateDialog, setTemplateDialog] = useState<null | Equipment>(null)

  const [createEquipment, createState] = useCreateEquipmentMutation()
  const [updateEquipment, updateState] = useUpdateEquipmentMutation()
  const [updateTemplate, updateTemplateState] = useUpdateTemplateMutation()
  const [deleteEquipment, deleteState] = useDeleteEquipmentMutation()

  useEffect(() => {
    if (createState.isSuccess) { success('Ekipman oluşturuldu'); setCreateDialog(false); refetch() }
    if (updateState.isSuccess) { success('Ekipman güncellendi'); setEditDialog(null); refetch() }
    if (updateTemplateState.isSuccess) { success('Şablon güncellendi'); setTemplateDialog(null); refetch() }
    if (deleteState.isSuccess) { success('Ekipman silindi/devre dışı'); refetch() }
    const err = (createState.error as any) || (updateState.error as any) || (updateTemplateState.error as any) || (deleteState.error as any)
    if (err) error(err?.data?.error?.message || 'İşlem başarısız')
  }, [createState, updateState, updateTemplateState, deleteState])

  const columns = [
    { id: 'name', label: 'Ad' },
    { id: 'type', label: 'Tür' },
    { id: 'is_active', label: 'Aktif', render: (r: any) => (r.is_active ? 'Evet' : 'Hayır') },
    { id: 'created_at', label: 'Oluşturulma', render: (r: any) => formatDateTime(r.created_at) },
  ]

  const withActions = rows.map((r) => ({
    ...r,
    actions: (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <PermissionGuard anyOf={['editEquipment', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setEditDialog(r)}><EditIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['editEquipment', 'companyAdmin']}>
          <Button size="small" onClick={() => setTemplateDialog(r)}>Şablon</Button>
        </PermissionGuard>
        <PermissionGuard anyOf={['editEquipment', 'companyAdmin']}>
          <IconButton size="small" color="error" onClick={() => onDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
        </PermissionGuard>
      </Stack>
    )
  }))

  const onDelete = async (r: Equipment) => {
    if (!confirm('Silmek/devre dışı bırakmak istediğinize emin misiniz?')) return
    try { await deleteEquipment(r.id).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Silme başarısız') }
  }

  return (
    <Box>
      <PageHeader
        title="Ekipmanlar"
        actions={
          <PermissionGuard anyOf={['createEquipment', 'companyAdmin']}>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateDialog(true)}>Yeni</Button>
          </PermissionGuard>
        }
      />
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Tür</InputLabel>
          <Select label="Tür" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="">Tümü</MenuItem>
            {(types?.data || []).map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
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
        <EquipmentDialog open={createDialog} onClose={() => setCreateDialog(false)} onSave={async (values) => {
          try { await createEquipment(values).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Oluşturma başarısız') }
        }} />
      )}
      {editDialog && (
        <EquipmentDialog open={!!editDialog} equipment={editDialog} onClose={() => setEditDialog(null)} onSave={async (values) => {
          try { await updateEquipment({ id: editDialog!.id, body: values }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Güncelleme başarısız') }
        }} />
      )}
      {templateDialog && (
        <TemplateBuilderDialog
          open={!!templateDialog}
          equipment={templateDialog}
          onClose={() => setTemplateDialog(null)}
          onSave={async (template) => {
            try { await updateTemplate({ id: templateDialog!.id, template }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Şablon güncelleme başarısız') }
          }}
        />
      )}
    </Box>
  )
}

function EquipmentDialog({ open, onClose, onSave, equipment }: { open: boolean; onClose: () => void; onSave: (values: { name: string; type: string; template: any }) => void; equipment?: Equipment }) {
  const [name, setName] = useState(equipment?.name || '')
  const [type, setType] = useState(equipment?.type || '')
  const [templateText, setTemplateText] = useState(JSON.stringify(equipment?.template || { sections: [] }, null, 2))
  const [builderOpen, setBuilderOpen] = useState(false)

  const submit = () => {
    try {
      const template = JSON.parse(templateText)
      if (!name || !type) return
      onSave({ name, type, template })
    } catch (e) {
      alert('Geçersiz JSON şablon')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{equipment ? 'Ekipman Düzenle' : 'Yeni Ekipman'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Ad" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Tür" value={type} onChange={(e) => setType(e.target.value)} required />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button variant="outlined" onClick={() => setBuilderOpen(true)}>Görsel Şablon Düzenleyici</Button>
            <Box sx={{ flex: 1 }} />
          </Stack>
          <TextField label="Şablon (JSON)" value={templateText} onChange={(e) => setTemplateText(e.target.value)} multiline minRows={10} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={submit} variant="contained">Kaydet</Button>
      </DialogActions>

      {builderOpen && (
        <TemplateBuilderDialog
          open={builderOpen}
          onClose={() => setBuilderOpen(false)}
          equipment={{ id: 0, name: name || 'Yeni', type: type || 'generic', template: (() => { try { return JSON.parse(templateText) } catch { return { sections: [] } } })() }}
          onSave={(tpl) => { setTemplateText(JSON.stringify(tpl, null, 2)); setBuilderOpen(false) }}
        />
      )}
    </Dialog>
  )
}

function TemplateDialog({ open, onClose, onSave, equipment }: { open: boolean; onClose: () => void; onSave: (template: any) => void; equipment: Equipment }) {
  const [templateText, setTemplateText] = useState(JSON.stringify(equipment.template || { sections: [] }, null, 2))
  const submit = () => {
    try {
      const template = JSON.parse(templateText)
      onSave(template)
    } catch (e) {
      alert('Geçersiz JSON şablon')
    }
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Şablon Düzenle</DialogTitle>
      <DialogContent>
        <TextField label="Şablon (JSON)" value={templateText} onChange={(e) => setTemplateText(e.target.value)} multiline minRows={16} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={submit} variant="contained">Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}
