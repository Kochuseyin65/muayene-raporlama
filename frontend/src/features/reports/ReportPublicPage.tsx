import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Button, Chip, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import RefreshIcon from '@mui/icons-material/Refresh'
import PdfPreview from '@/features/reports/components/PdfPreview'
import { fetchPdfWithFallback, triggerDownload } from '@/features/reports/utils'

interface PublicReportMetadata {
  company_name?: string
  customer_name?: string
  equipment_name?: string
  work_order_number?: string
  inspection_date?: string
  technician_name?: string
  technician_surname?: string
  is_signed?: boolean
  qr_token?: string
}

export default function ReportPublicPage() {
  const { token } = useParams<{ token: string }>()
  const [metadata, setMetadata] = useState<PublicReportMetadata | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [viewerLoading, setViewerLoading] = useState(false)
  const [viewerError, setViewerError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewSigned, setPreviewSigned] = useState<boolean | null>(null)
  const [previewFilename, setPreviewFilename] = useState<string | undefined>()
  const previewBlobRef = useRef<Blob | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const baseUrl = import.meta.env.VITE_API_BASE_URL

  const fetchMetadata = useCallback(async () => {
    if (!token || !baseUrl) return
    setMetaLoading(true)
    setMetaError(null)
    try {
      const response = await fetch(`${baseUrl}/reports/public/${token}`)
      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || 'Rapor bilgisi alınamadı')
      }
      const json = await response.json()
      setMetadata(json?.data || null)
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : 'Rapor bilgisi alınamadı')
      setMetadata(null)
    } finally {
      setMetaLoading(false)
    }
  }, [baseUrl, token])

  const buildPublicPdfRequest = useCallback(async () => {
    if (!token || !baseUrl) return null
    const urls = [
      `${baseUrl}/reports/public/${token}/download?signed=true`,
      `${baseUrl}/reports/public/${token}/download?signed=false`,
    ]
    return fetchPdfWithFallback(urls)
  }, [baseUrl, token])

  const loadPreview = useCallback(async () => {
    if (!token) return
    setViewerLoading(true)
    setViewerError(null)
    try {
      const result = await buildPublicPdfRequest()
      if (!result) {
        setViewerError('PDF bulunamadı. Daha sonra tekrar deneyin.')
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
      setViewerError(err instanceof Error ? err.message : 'PDF alınırken bir hata oluştu')
      setPreviewUrl(null)
      setPreviewSigned(null)
      previewBlobRef.current = null
    } finally {
      setViewerLoading(false)
    }
  }, [buildPublicPdfRequest, token])

  useEffect(() => {
    if (!token || !baseUrl) return () => {}
    fetchMetadata()
    loadPreview()
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      previewBlobRef.current = null
    }
  }, [baseUrl, fetchMetadata, loadPreview, token])

  const downloadReport = async () => {
    try {
      let blob = previewBlobRef.current
      let filename = previewFilename || 'rapor.pdf'
      if (!blob) {
        const result = await buildPublicPdfRequest()
        if (!result) {
          throw new Error('PDF bulunamadı')
        }
        blob = result.blob
        filename = result.filename || filename
      }
      triggerDownload(blob, filename)
    } catch (err) {
      setViewerError(err instanceof Error ? err.message : 'PDF indirilemedi')
    }
  }

  const headerSubtitle = useMemo(() => {
    if (!metadata) return ''
    const company = metadata.company_name ? `${metadata.company_name}` : ''
    const customer = metadata.customer_name ? ` / ${metadata.customer_name}` : ''
    return `${company}${customer}`
  }, [metadata])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 6 }}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                <Box>
                  <Typography variant="h5">Muayene Raporu</Typography>
                  {headerSubtitle && (
                    <Typography variant="body2" color="text.secondary">{headerSubtitle}</Typography>
                  )}
                  {metadata?.equipment_name && (
                    <Typography variant="subtitle2" sx={{ mt: 1 }}>{metadata.equipment_name}</Typography>
                  )}
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  {metadata && (
                    <Chip
                      size="small"
                      color={metadata.is_signed ? 'success' : 'default'}
                      label={metadata.is_signed ? 'İmzalı Rapor' : 'İmzasız Rapor'}
                    />
                  )}
                  <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadReport} disabled={viewerLoading}>
                    PDF'yi İndir
                  </Button>
                  <Button variant="text" startIcon={<RefreshIcon />} onClick={loadPreview} disabled={viewerLoading}>
                    Yenile
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={1}>
                {metaLoading && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={20} />
                    <Typography variant="caption">Rapor bilgileri yükleniyor...</Typography>
                  </Stack>
                )}
                {metaError && (
                  <Typography variant="caption" color="error">{metaError}</Typography>
                )}
                {metadata?.inspection_date && (
                  <Typography variant="body2" color="text.secondary">
                    Muayene Tarihi: {metadata.inspection_date}
                  </Typography>
                )}
                {metadata?.technician_name && (
                  <Typography variant="body2" color="text.secondary">
                    Teknisyen: {metadata.technician_name} {metadata.technician_surname || ''}
                  </Typography>
                )}
                {metadata?.work_order_number && (
                  <Typography variant="body2" color="text.secondary">
                    İş Emri No: {metadata.work_order_number}
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Paper>

          <PdfPreview
            src={previewUrl}
            loading={viewerLoading}
            error={viewerError || undefined}
            onRetry={loadPreview}
            signedLabel={previewSigned === null ? undefined : previewSigned ? 'Önizleme imzalı rapordan oluşturuldu.' : 'Önizleme imzasız rapordan oluşturuldu.'}
            height="75vh"
          />
        </Stack>
      </Container>
    </Box>
  )
}
