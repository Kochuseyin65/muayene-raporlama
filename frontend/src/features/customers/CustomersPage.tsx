import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DataTable from '@/components/common/DataTable'
import { useListCustomersQuery, useCreateCustomerMutation, useUpdateCustomerMutation, useDeleteCustomerMutation, type CustomerCompany } from './customersApi'
import { useToast } from '@/hooks/useToast'
import PermissionGuard from '@/components/auth/PermissionGuard'
import PageHeader from '@/components/layout/PageHeader'
import { formatDateTime } from '@/utils/date'

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const { data, isFetching, refetch } = useListCustomersQuery({ page, limit, search }, { refetchOnMountOrArgChange: true })
  const rows = useMemo(() => (data?.data?.customers || []).map((c) => ({ ...c })), [data])
  const total = data?.data?.pagination?.totalCount || 0
  const { success, error } = useToast()

  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState<null | CustomerCompany>(null)

  const [createCustomer, createState] = useCreateCustomerMutation()
  const [updateCustomer, updateState] = useUpdateCustomerMutation()
  const [deleteCustomer, deleteState] = useDeleteCustomerMutation()

  useEffect(() => {
    if (createState.isSuccess) { success('Müşteri oluşturuldu'); setCreateDialog(false); refetch() }
    if (updateState.isSuccess) { success('Müşteri güncellendi'); setEditDialog(null); refetch() }
    if (deleteState.isSuccess) { success('Müşteri silindi'); refetch() }
    const err = (createState.error as any) || (updateState.error as any) || (deleteState.error as any)
    if (err) error(err?.data?.error?.message || 'İşlem başarısız')
  }, [createState, updateState, deleteState])

  const columns = [
    { id: 'name', label: 'Ad' },
    { id: 'tax_number', label: 'Vergi No' },
    { id: 'email', label: 'E-posta' },
    { id: 'authorized_person', label: 'Yetkili' },
    { id: 'created_at', label: 'Oluşturulma', render: (r: any) => formatDateTime(r.created_at) },
  ]

  const withActions = rows.map((r) => ({
    ...r,
    actions: (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <PermissionGuard anyOf={['editCustomer', 'companyAdmin']}>
          <IconButton size="small" onClick={() => setEditDialog(r)}><EditIcon fontSize="small" /></IconButton>
        </PermissionGuard>
        <PermissionGuard anyOf={['companyAdmin', 'editCustomer']}>
          <IconButton size="small" color="error" onClick={() => onDelete(r)}><DeleteIcon fontSize="small" /></IconButton>
        </PermissionGuard>
      </Stack>
    )
  }))

  const onDelete = async (r: CustomerCompany) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return
    try {
      await deleteCustomer(r.id).unwrap()
    } catch (e: any) {
      error(e?.data?.error?.message || 'Silme başarısız')
    }
  }

  return (
    <Box>
      <PageHeader
        title="Müşteri Firmalar"
        actions={
          <PermissionGuard anyOf={['createCustomer', 'companyAdmin']}>
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
        totalCount={total}
        onPageChange={setPage}
        onRowsPerPageChange={setLimit}
        search={search}
        onSearchChange={setSearch}
      />

      {createDialog && (
        <CustomerDialog open={createDialog} onClose={() => setCreateDialog(false)} onSave={async (values) => {
          try { await createCustomer(values as any).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Oluşturma başarısız') }
        }} />
      )}
      {editDialog && (
        <CustomerDialog open={!!editDialog} customer={editDialog} onClose={() => setEditDialog(null)} onSave={async (values) => {
          try { await updateCustomer({ id: editDialog!.id, body: values }).unwrap() } catch (e: any) { error(e?.data?.error?.message || 'Güncelleme başarısız') }
        }} />
      )}
    </Box>
  )
}

function CustomerDialog({ open, onClose, onSave, customer }: { open: boolean; onClose: () => void; onSave: (values: Partial<CustomerCompany> & { taxNumber?: string; authorizedPerson?: string }) => void; customer?: CustomerCompany }) {
  const [name, setName] = useState(customer?.name || '')
  const [taxNumber, setTaxNumber] = useState(customer?.tax_number || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [address, setAddress] = useState(customer?.address || '')
  const [contact, setContact] = useState(customer?.contact || '')
  const [authorizedPerson, setAuthorizedPerson] = useState(customer?.authorized_person || '')

  const submit = () => {
    if (!name || !email) return
    onSave({ name, email, taxNumber: taxNumber || undefined, address: address || undefined, contact: contact || undefined, authorizedPerson: authorizedPerson || undefined })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{customer ? 'Müşteri Düzenle' : 'Yeni Müşteri'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Ad" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Vergi No" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} />
          <TextField label="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <TextField label="Adres" value={address} onChange={(e) => setAddress(e.target.value)} multiline />
          <TextField label="İletişim" value={contact} onChange={(e) => setContact(e.target.value)} />
          <TextField label="Yetkili" value={authorizedPerson} onChange={(e) => setAuthorizedPerson(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={submit} variant="contained">Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}
