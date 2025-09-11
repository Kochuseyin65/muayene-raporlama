import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, Chip, Divider, Paper, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, IconButton } from '@mui/material'
import PageHeader from '@/components/layout/PageHeader'
import { useApproveOfferMutation, useConvertToWorkOrderMutation, useGetOfferQuery, useSendOfferMutation } from './offersApi'
import { formatCurrencyTRY } from '@/utils/format'
import { formatDateTime } from '@/utils/date'
import { useToast } from '@/hooks/useToast'
import PermissionGuard from '@/components/auth/PermissionGuard'
import { useState } from 'react'
import ConvertDialog from './components/ConvertDialogInline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

const statusColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  pending: 'default', approved: 'success', sent: 'info', viewed: 'info', rejected: 'error',
}

export default function OfferDetailPage() {
  const { id } = useParams()
  const offerId = Number(id)
  const { data, refetch, isFetching } = useGetOfferQuery(offerId)
  const offer = data?.data as any
  const { success, error } = useToast()
  const navigate = useNavigate()

  const [approveOffer, approveState] = useApproveOfferMutation()
  const [sendOffer, sendState] = useSendOfferMutation()
  const [convertToWO, convertState] = useConvertToWorkOrderMutation()
  const [convertDialog, setConvertDialog] = useState(false)

  const total = offer?.total_amount || 0
  const trackingUrl = offer?.tracking_token ? `${window.location.origin}/api/offers/track/${offer.tracking_token}` : ''

  return (
    <Box>
      <PageHeader
        title={`Teklif ${offer?.offer_number || ''}`}
        subtitle={offer && `${offer.customer_name} • ${formatDateTime(offer.created_at)}`}
        actions={
          <Stack direction="row" spacing={1}>
            <Chip label={offer?.status} color={offer ? (statusColor[offer.status] || 'default') : 'default'} size="small" />
            <PermissionGuard anyOf={['approveOffer','companyAdmin']}>
              <Button variant="outlined" disabled={!offer || offer.status !== 'pending'} onClick={async ()=>{ try{await approveOffer(offerId).unwrap(); success('Onaylandı'); refetch()}catch(e: any){ error(e?.data?.error?.message || 'Onay başarısız') }}}>Onayla</Button>
            </PermissionGuard>
            <PermissionGuard anyOf={['sendOffer','companyAdmin']}>
              <Button variant="outlined" disabled={!offer || offer.status==='sent'} onClick={async ()=>{ try{await sendOffer(offerId).unwrap(); success('Gönderildi'); refetch()}catch(e:any){ error(e?.data?.error?.message||'Gönderim başarısız') }}}>Gönder</Button>
            </PermissionGuard>
            <PermissionGuard anyOf={['createWorkOrder','companyAdmin']}>
              <Button variant="contained" disabled={!offer || !['approved','viewed'].includes(offer.status)} onClick={()=> setConvertDialog(true)}>İş Emrine Dönüştür</Button>
            </PermissionGuard>
          </Stack>
        }
      />

      {offer && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Kalemler</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Kalem / Ekipman</TableCell>
                    <TableCell width={100}>Adet</TableCell>
                    <TableCell width={160}>Birim Fiyat</TableCell>
                    <TableCell width={160} align="right">Tutar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {offer.items?.map((it: any, idx: number) => {
                    const line = (Number(it.quantity)||0)*(Number(it.unitPrice)||0)
                    return (
                      <TableRow key={idx} hover>
                        <TableCell>{it.equipmentName || it.equipmentId}</TableCell>
                        <TableCell>{it.quantity}</TableCell>
                        <TableCell>{formatCurrencyTRY(Number(it.unitPrice)||0)}</TableCell>
                        <TableCell align="right">{formatCurrencyTRY(line)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography>Toplam</Typography>
                <Typography fontWeight={700}>{formatCurrencyTRY(total)}</Typography>
              </Stack>
            </Paper>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 360 } }}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Müşteri</Typography>
              <Typography>{offer.customer_name}</Typography>
              <Typography variant="body2" color="text.secondary">{offer.customer_email}</Typography>
              {offer.notes && (<>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Notlar</Typography>
                <Typography variant="body2" color="text.secondary">{offer.notes}</Typography>
              </>)}
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Özet</Typography>
              <Stack spacing={1}>
                <InfoRow label="Teklif No" value={offer.offer_number} />
                <InfoRow label="Durum" value={<Chip label={offer.status} color={statusColor[offer.status]||'default'} size="small" />} />
                {offer.created_by_name && <InfoRow label="Oluşturan" value={`${offer.created_by_name} ${offer.created_by_surname||''}`} />}
                {offer.approved_by_name && <InfoRow label="Onaylayan" value={`${offer.approved_by_name} ${offer.approved_by_surname||''}`} />}
                <InfoRow label="Oluşturulma" value={formatDateTime(offer.created_at)} />
                {offer.approved_at && <InfoRow label="Onay" value={formatDateTime(offer.approved_at)} />}
                {offer.sent_at && <InfoRow label="Gönderim" value={formatDateTime(offer.sent_at)} />}
                {offer.viewed_at && <InfoRow label="Görüntülenme" value={formatDateTime(offer.viewed_at)} />}
                {offer.tracking_token && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{trackingUrl}</Typography>
                    <IconButton size="small" onClick={async ()=>{ try{ await navigator.clipboard.writeText(trackingUrl); }catch{} }}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            </Paper>
          </Box>
        </Stack>
      )}

      {convertDialog && (
        <ConvertDialog open={convertDialog} onClose={()=> setConvertDialog(false)} onSave={async (payload)=>{
          try { const res = await convertToWO({ id: offerId, ...payload }).unwrap(); success('İş emri oluşturuldu'); navigate(`/work-orders/${res.data.id}`) } catch(e:any){ error(e?.data?.error?.message||'Dönüştürme başarısız') }
        }} />
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
