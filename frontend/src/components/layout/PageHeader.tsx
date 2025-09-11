import { Box, Stack, Typography } from '@mui/material'
import type { PropsWithChildren, ReactNode } from 'react'

export default function PageHeader({ title, subtitle, actions, children }: PropsWithChildren<{ title: string; subtitle?: string; actions?: ReactNode }>) {
  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={2} flexWrap="wrap" useFlexGap>
        <Box>
          <Typography variant="h5" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {actions}
          {children}
        </Stack>
      </Stack>
    </Box>
  )
}

