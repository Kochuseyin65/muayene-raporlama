import { Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

interface PdfPreviewProps {
  src?: string | null
  loading: boolean
  error?: string | null
  height?: string | number
  onRetry?: () => void
  signedLabel?: string
}

export default function PdfPreview({ src, loading, error, height = '70vh', onRetry, signedLabel }: PdfPreviewProps) {
  return (
    <Paper variant="outlined" sx={{ p: 0, height, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
        {loading && <CircularProgress />}
        {!loading && error && (
          <Stack spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" align="center">{error}</Typography>
            {onRetry && (
              <Button size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
                Yeniden Dene
              </Button>
            )}
          </Stack>
        )}
        {!loading && !error && src && (
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <iframe
              title="report-preview"
              src={src}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </Box>
        )}
      </Box>
      {signedLabel && (
        <Box sx={{ p: 1.5, borderTop: theme => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="caption" color="text.secondary">{signedLabel}</Typography>
        </Box>
      )}
    </Paper>
  )
}
