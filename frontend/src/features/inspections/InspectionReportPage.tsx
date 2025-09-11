import { useParams } from 'react-router-dom'
import { Box, Button, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import PageHeader from '@/components/layout/PageHeader'
import { useGetInspectionQuery } from './inspectionsApi'
import { useToast } from '@/hooks/useToast'
import { useState } from 'react'

export default function InspectionReportPage() {
  const { id } = useParams()
  const inspectionId = Number(id)
  const { data, refetch } = useGetInspectionQuery(inspectionId)
  const ins = data?.data as any
  const reportId = ins?.report_id
  const { success, error } = useToast()
  const [pin, setPin] = useState('')
  const [jobId, setJobId] = useState<number | null>(null)
  const [jobStatus, setJobStatus] = useState<string>('')
  const [polling, setPolling] = useState(false)

  const prepareSync = async () => {
    try { await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/prepare`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }); success('Rapor hazırlandı'); refetch() } catch { error('Hazırlama başarısız') }
  }
  const prepareAsync = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/prepare-async`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      const js = await res.json();
      const jId = js?.data?.jobId
      if (!jId) throw new Error('jobId yok')
      setJobId(jId)
      setJobStatus(js?.data?.status || 'pending')
      setPolling(true)
      pollJob(jId)
      success('İş kuyruğuna alındı')
    } catch { error('İş başarısız') }
  }

  async function pollJob(jId: number) {
    let attempts = 0
    const maxAttempts = 30
    const interval = 2000
    const timer = setInterval(async () => {
      attempts++
      try {
        const r = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/jobs/${jId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        const jj = await r.json()
        const st = jj?.data?.status || jj?.status
        setJobStatus(st)
        if (st === 'completed' || st === 'failed' || attempts >= maxAttempts) {
          clearInterval(timer)
          setPolling(false)
          if (st === 'completed') success('Rapor hazır')
          else if (st === 'failed') error('Rapor hazırlama başarısız')
          refetch()
        }
      } catch (e) {
        clearInterval(timer)
        setPolling(false)
        error('Job sorgulama hatası')
      }
    }, interval)
  }
  const download = async (signed: boolean) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/download?signed=${signed}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `report_${reportId}${signed? '_signed': ''}.pdf`; a.click(); URL.revokeObjectURL(url)
    } catch { error('İndirme başarısız') }
  }

  const sign = async () => {
    try {
      // 1) Get PDF base64
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/signing-data`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      const js = await res.json(); const pdfBase64 = js?.data?.pdfBase64
      if (!pdfBase64) throw new Error('signing data yok')
      // 2) Local signer ile imzala (signer.md)
      const sRes = await fetch('http://localhost:61812/api/Sign/Sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ PIN: pin, CallbackUrl: '', Base64ContentList: [pdfBase64] })
      })
      const sJson = await sRes.json(); const signedBase64 = (sJson?.SignedBase64 || sJson?.Base64ContentList?.[0] || sJson?.signedBase64)
      if (!signedBase64) throw new Error('local signer hata')
      // 3) Backend'e gönder
      const post = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/sign`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ pin, signedPdfBase64: signedBase64 })
      })
      if (!post.ok) throw new Error('sign post fail')
      success('İmzalandı')
      refetch()
    } catch (e: any) { error('İmzalama başarısız') }
  }

  if (!ins) return null

  return (
    <Box>
      <PageHeader title={`Rapor ${ins.inspection_number || ''}`} subtitle={`${ins.equipment_name}`} />
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Button variant="outlined" onClick={prepareSync}>Prepare</Button>
          <Button variant="outlined" onClick={prepareAsync}>Prepare Async</Button>
          <Button variant="outlined" onClick={() => download(false)}>İndir (İmzasız)</Button>
          <Button variant="outlined" onClick={() => download(true)}>İndir (İmzalı)</Button>
          <TextField size="small" type="password" label="PIN" value={pin} onChange={(e)=> setPin(e.target.value)} />
          <Button variant="contained" onClick={sign}>İmzala</Button>
        </Stack>
        {polling && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary">Durum: {jobStatus || 'hazırlanıyor...'}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
