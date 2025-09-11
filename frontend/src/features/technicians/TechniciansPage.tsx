import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Stack, TextField } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SecurityIcon from '@mui/icons-material/Security'
import LockResetIcon from '@mui/icons-material/LockReset'
import DataTable from '@/components/common/DataTable'
import { useListTechniciansQuery, useCreateTechnicianMutation, useUpdateTechnicianMutation, useUpdatePermissionsMutation, useUpdatePasswordMutation, useDeleteTechnicianMutation, type Technician } from './techniciansApi'
import { PERMISSIONS } from '@/constants/permissions'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useToast } from '@/hooks/useToast'
import PageHeader from '@/components/layout/PageHeader'

export default function TechniciansPage() {
  const { data, isFetching, refetch } = useListTechniciansQuery()
  const rows = useMemo(() => (data?.data || []).map((t) => ({ ...t })), [data])
  const { success, error } = useToast()
  const total = rows.length

  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<null | Technician>(null)
  const [permDialog, setPermDialog] = useState<null | Technician>(null)
  const [passDialog, setPassDialog] = useState<null | Technician>(null)

  const [createTech, createState] = useCreateTechnicianMutation()
  const [updateTech, updateState] = useUpdateTechnicianMutation()
  const [updatePerms, updatePermsState] = useUpdatePermissionsMutation()
  const [updatePassword, updatePasswordState] = useUpdatePasswordMutation()
  const [deleteTech, deleteState] = useDeleteTechnicianMutation()

  useEffect(() => {
    if (createState.isSuccess) { success('Teknisyen oluşturuldu'); setCreateDialog(false); refetch() }
    if (updateState.isSuccess) { success('Teknisyen güncellendi'); setEditDialog(null); refetch() }
    if (updatePermsState.isSuccess) { success('Yetkiler güncellendi'); setPermDialog(null); refetch() }
    if (deleteState.isSuccess) { success('Teknisyen silindi/devre dışı'); refetch() }
    if (updatePasswordState.isSuccess) { success('Şifre güncellendi'); setPassDialog(null) }
    const err = (createState.error as any) || (updateState.error as any) || (updatePermsState.error as any) || (deleteState.error as any) || (updatePasswordState.error as any)
    if (err) error(err?.data?.error?.message || 'İşlem başarısız')
  }, [createState, updateState, updatePermsState, deleteState, updatePasswordState])

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const filtered = rows.filter((r) => `${r.name} ${r.surname} ${r.email}`.toLowerCase().includes(search.toLowerCase()))
  const sliced = filtered.slice((page - 1) * limit, (page - 1) * limit + limit)

  const columns = [
    { id: 'name', label: 'Ad', render: (r: any) => `${r.name} ${r.surname}` },
    { id: 'email', label: 'E-posta' },
    { id: 'phone', label: 'Telefon' },
    { id: 'is_active', label: 'Aktif', render: (r: any) => (r.is_active ? 'Evet' : 'Hayır') },
  ]

  const withActions = sliced.map((r) => ({
    ...r,
    actions: (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <PermissionGuard anyOf={['editTechnician', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setEditDialog(r)}><EditIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['editTechnician', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setPermDialog(r)}><SecurityIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['editTechnician', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setPassDialog(r)}><LockResetIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['deleteTechnician', 'companyAdmin']}>
          <IconButton size="small" color="error" onClick={() => onDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
        </PermissionGuard>
      </Stack>
    )
  }))

  const onDelete = async (r: Technician) => {
    if (!confirm('Silmek/devre dışı bırakmak istediğinize emin misiniz?')) return
    try { await deleteTech(r.id).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Silme başarısız') }
  }

  return (
    <Box>
      <PageHeader
        title="Teknisyenler"
        actions={
          <PermissionGuard anyOf={['createTechnician', 'companyAdmin']}>
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setCreateDialog(true)}>Yeni</Button>
          </PermissionGuard>
        }
      />
      <DataTable
        columns={columns as any}
        rows={withActions}
        loading={isFetching}
        page={page}
        rowsPerPage={limit}
        totalCount={filtered.length}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
        search={search}
        onSearchChange={setSearch}
      />

      {createDialog && (
        <TechnicianDialog open={createDialog} onClose={() => setCreateDialog(false)} onSave={async (values) => {
          try { await createTech(values).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Oluşturma başarısız') }
        }} />
      )}
      {editDialog && (
        <TechnicianDialog open={!!editDialog} technician={editDialog} onClose={() => setEditDialog(null)} onSave={async (values) => {
          try { await updateTech({ id: editDialog!.id, body: values as any }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Güncelleme başarısız') }
        }} />
      )}
      {permDialog && (
        <PermissionDialog open={!!permDialog} technician={permDialog} onClose={() => setPermDialog(null)} onSave={async (perms) => {
          try { await updatePerms({ id: permDialog!.id, permissions: perms }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Yetki güncelleme başarısız') }
        }} />
      )}
      {passDialog && (
        <PasswordDialog open={!!passDialog} technician={passDialog} onClose={() => setPassDialog(null)} onSave={async (newPassword) => {
          try { await updatePassword({ id: passDialog!.id, newPassword }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Şifre güncelleme başarısız') }
        }} />
      )}
    </Box>
  )
}

function TechnicianDialog({ open, onClose, onSave, technician }: { open: boolean; onClose: () => void; onSave: (values: any) => void; technician?: Technician }) {
  const [name, setName] = useState(technician?.name || '')
  const [surname, setSurname] = useState(technician?.surname || '')
  const [email, setEmail] = useState(technician?.email || '')
  const [phone, setPhone] = useState(technician?.phone || '')
  const [password, setPassword] = useState('')
  const [eSignaturePin, setPin] = useState('')

  const submit = () => {
    if (!name || !surname || !email) return
    if (technician) onSave({ name, surname, email, phone, eSignaturePin })
    else onSave({ name, surname, email, phone, password: password || 'password', eSignaturePin, permissions: [] })
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{technician ? 'Teknisyen Düzenle' : 'Yeni Teknisyen'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Ad" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Soyad" value={surname} onChange={(e) => setSurname(e.target.value)} required />
          <TextField label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <TextField label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {!technician && <TextField label="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          <TextField label="E-imza PIN" value={eSignaturePin} onChange={(e) => setPin(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={submit} variant="contained">Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}

function PermissionDialog({ open, onClose, onSave, technician }: { open: boolean; onClose: () => void; onSave: (perms: string[]) => void; technician: Technician }) {
  const [selected, setSelected] = useState<string[]>(technician.permissions || [])
  const toggle = (p: string) => setSelected((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]))

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Yetkiler</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={4} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
          {PERMISSIONS.map((p) => (
            <FormControlLabel key={p} control={<Checkbox checked={selected.includes(p)} onChange={() => toggle(p)} />} label={p} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={() => onSave(selected)}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}

function PasswordDialog({ open, onClose, onSave, technician }: { open: boolean; onClose: () => void; onSave: (newPassword: string) => void; technician: Technician }) {
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const valid = p1.length >= 6 && p1 === p2
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Şifre Değiştir</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Yeni Şifre" type="password" value={p1} onChange={(e) => setP1(e.target.value)} helperText="En az 6 karakter" />
          <TextField label="Yeni Şifre (Tekrar)" type="password" value={p2} onChange={(e) => setP2(e.target.value)} error={p2.length > 0 && p1 !== p2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" disabled={!valid} onClick={() => onSave(p1)}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}
