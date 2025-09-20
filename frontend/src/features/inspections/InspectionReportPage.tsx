import { useParams } from 'react-router-dom'
import { Box, Button, Chip, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography } from '@mui/material'
import PageHeader from '@/components/layout/PageHeader'
import { useGetInspectionQuery } from './inspectionsApi'
import { useToast } from '@/hooks/useToast'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import CloudSyncIcon from '@mui/icons-material/CloudSync'
import RefreshIcon from '@mui/icons-material/Refresh'
import LockIcon from '@mui/icons-material/Lock'
import PdfPreview from '@/features/reports/components/PdfPreview'
import { fetchPdfWithFallback, triggerDownload } from '@/features/reports/utils'

const SCALE_OPTIONS = [
  { value: 'small', label: 'Küçük' },
  { value: 'medium', label: 'Orta' },
  { value: 'large', label: 'Büyük' },
]

const ALLOWED_SCALES = SCALE_OPTIONS.map((opt) => opt.value)

const normalizeScale = (value: unknown) => {
  if (typeof value !== 'string') return undefined
  const lowered = value.toLowerCase()
  return ALLOWED_SCALES.includes(lowered) ? lowered : undefined
}

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
  const [reportScale, setReportScale] = useState<string>('medium')
  const [savingScale, setSavingScale] = useState(false)
  const [viewerLoading, setViewerLoading] = useState(false)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewSigned, setPreviewSigned] = useState<boolean | null>(null)
  const [previewFilename, setPreviewFilename] = useState<string | undefined>()
  const previewBlobRef = useRef<Blob | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const buildPrivatePdfRequest = useCallback(async () => {
    if (!reportId) return null
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    if (!baseUrl) return null
    const headers: HeadersInit = {}
    const token = localStorage.getItem('token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    const urls = [
      `${baseUrl}/reports/${reportId}/download?signed=true`,
      `${baseUrl}/reports/${reportId}/download?signed=false`,
    ]
    return fetchPdfWithFallback(urls, { headers })
  }, [reportId])

  const loadPreview = useCallback(async () => {
    if (!reportId) return
    setViewerLoading(true)
    setViewerError(null)
    try {
      const result = await buildPrivatePdfRequest()
      if (!result) {
        setViewerError('PDF bulunamadı. Raporu hazırlamayı deneyin.')
        setPreviewUrl(null)
        setPreviewSigned(null)
        previewBlobRef.current = null
        return
      }
      previewBlobRef.current = result.blob
      setPreviewFilename(result.filename || undefined)
      const previousUrl = previewUrlRef.current
      const url = URL.createObjectURL(result.blob)
      previewUrlRef.current = url
      setPreviewUrl(url)
      setPreviewSigned(result.usedIndex === 0)
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF alınırken bir hata oluştu'
      setViewerError(message)
      setPreviewUrl(null)
      setPreviewSigned(null)
      previewBlobRef.current = null
    } finally {
      setViewerLoading(false)
    }
  }, [buildPrivatePdfRequest, reportId])

  const resolvedScale = useMemo(() => {
    const candidates = [
      ins?.report_style?.scale,
      ins?.report_style?.fontScale,
      ins?.report_style_scale,
      ins?.layout_scale,
      ins?.template?.settings?.reportStyle?.scale,
    ]
    for (const candidate of candidates) {
      const normalized = normalizeScale(candidate)
      if (normalized) return normalized
    }
    return 'medium'
  }, [ins])

  useEffect(() => {
    setReportScale(resolvedScale)
  }, [resolvedScale])

  useEffect(() => {
    if (!reportId) return () => {}
    loadPreview()
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      previewBlobRef.current = null
    }
  }, [loadPreview, reportId])

  const updateReportScale = async (nextScale: string) => {
    if (!reportId) return
    setSavingScale(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/style`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ scale: nextScale })
      })
      if (!res.ok) throw new Error('scale update failed')
      success('Rapor görünümü güncellendi')
      refetch()
      await loadPreview()
    } catch (err) {
      error('Rapor görünümü güncellenemedi')
      setReportScale(resolvedScale)
    } finally {
      setSavingScale(false)
    }
  }

  const handleScaleChange = async (value: string) => {
    const normalized = normalizeScale(value) || 'medium'
    if (normalized === reportScale) return
    setReportScale(normalized)
    if (!reportId) return
    await updateReportScale(normalized)
  }

  const prepareSync = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/reports/${reportId}/prepare`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      success('Rapor hazırlandı')
      refetch()
      await loadPreview()
    } catch {
      error('Hazırlama başarısız')
    }
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
          if (st === 'completed') {
            success('Rapor hazır')
            refetch()
            await loadPreview()
          } else if (st === 'failed') {
            error('Rapor hazırlama başarısız')
          }
        }
      } catch (e) {
        clearInterval(timer)
        setPolling(false)
        error('Job sorgulama hatası')
      }
    }, interval)
  }
  const downloadReport = async () => {
    try {
      let blob = previewBlobRef.current
      let filename = previewFilename || `report_${reportId}.pdf`
      if (!blob) {
        const result = await buildPrivatePdfRequest()
        if (!result) {
          throw new Error('PDF bulunamadı')
        }
        blob = result.blob
        filename = result.filename || filename
      }
      triggerDownload(blob, filename)
    } catch (err) {
      error(err instanceof Error ? err.message : 'İndirme başarısız')
    }
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
      await loadPreview()
    } catch (e: any) { error('İmzalama başarısız') }
  }

  if (!ins) return null

  return (
    <Box>
      <PageHeader title={`Rapor ${ins.inspection_number || ''}`} subtitle={`${ins.equipment_name}`} />
      <Stack spacing={2}>
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} alignItems={{ xs: 'stretch', lg: 'center' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
                <Button variant="contained" color="primary" startIcon={<PictureAsPdfIcon />} onClick={prepareSync} disabled={!reportId}>
                  PDF'yi Hazırla
                </Button>
                <Button variant="outlined" startIcon={<CloudSyncIcon />} onClick={prepareAsync} disabled={!reportId}>
                  Arka Planda Hazırla
                </Button>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadReport} disabled={!reportId}>
                  PDF'yi İndir
                </Button>
                <Button variant="text" startIcon={<RefreshIcon />} onClick={loadPreview} disabled={!reportId || viewerLoading}>
                  Önizlemeyi Yenile
                </Button>
              </Stack>
              <Box sx={{ flexGrow: 1 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                {previewSigned !== null && (
                  <Tooltip title={previewSigned ? 'İmzalı PDF görüntüleniyor' : 'İmzasız PDF görüntüleniyor'}>
                    <Chip
                      size="small"
                      label={previewSigned ? 'Önizleme: İmzalı' : 'Önizleme: İmzasız'}
                      color={previewSigned ? 'success' : 'default'}
                    />
                  </Tooltip>
                )}
                <FormControl size="small" sx={{ minWidth: 200 }} disabled={!reportId || savingScale}>
                  <InputLabel>Rapor Ölçeği</InputLabel>
                  <Select
                    label="Rapor Ölçeği"
                    value={reportScale}
                    onChange={(e) => handleScaleChange(String(e.target.value))}
                  >
                    {SCALE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <TextField
                size="small"
                type="password"
                label="E-İmza PIN"
                value={pin}
                onChange={(e)=> setPin(e.target.value)}
                sx={{ maxWidth: 240 }}
              />
              <Button variant="contained" color="secondary" startIcon={<LockIcon />} onClick={sign} disabled={!pin || !reportId}>
                İmzala
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ ml: { sm: 1 } }}>
                İmzalama yerel signer üzerinden yapılır.
              </Typography>
            </Stack>

            {savingScale && (
              <Typography variant="caption" color="text.secondary">Ölçek kaydediliyor...</Typography>
            )}

            {polling && (
              <Box>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary">Durum: {jobStatus || 'hazırlanıyor...'}</Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        <PdfPreview
          src={previewUrl}
          loading={viewerLoading}
          error={viewerError || undefined}
          onRetry={loadPreview}
          signedLabel={previewSigned === null ? undefined : previewSigned ? 'Önizleme imzalı rapordan oluşturuldu.' : 'Önizleme imzasız rapordan oluşturuldu.'}
        />
      </Stack>
    </Box>
  )
}
