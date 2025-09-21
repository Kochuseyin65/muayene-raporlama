import type { PropsWithChildren } from 'react'
import { AppBar, Avatar, Box, CssBaseline, IconButton, Toolbar, Typography, Stack, Container, useMediaQuery } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar, toggleSidebarCollapsed, toggleTheme } from '@/store/slices/uiSlice'
import type { RootState } from '@/store/store'
import LogoutButton from '@/features/auth/LogoutButton'
import Sidebar, { SidebarPermanent, drawerWidth, drawerCollapsedWidth } from './Sidebar'
import { useGetMyCompanyProfileQuery } from '@/features/companies/companiesApi'

export default function AppLayout({ children }: PropsWithChildren) {
  const dispatch = useDispatch()
  const themeMode = useSelector((s: RootState) => s.ui.theme)
  const isDesktop = useMediaQuery('(min-width:900px)')
  const user = useSelector((s: RootState) => s.auth.user)

  const { data: companyRes } = useGetMyCompanyProfileQuery(undefined, { skip: !useSelector((s: RootState) => s.auth.isAuthenticated) })
  const company = companyRes?.data

  const logoSrc = (() => {
    const url = company?.logo_url
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/api')) return url
    if (url.startsWith('/uploads')) return `${import.meta.env.VITE_API_BASE_URL}${url}`
    return url
  })()

  return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <CssBaseline />
        <AppBar position="fixed" color="default" enableColorOnDark sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => {
            if (isDesktop) dispatch(toggleSidebarCollapsed())
            else dispatch(toggleSidebar())
          }}>
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1, ml: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {logoSrc && <Box component="img" src={logoSrc} alt="Logo" sx={{ width: 28, height: 28, borderRadius: '6px' }} />}
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
                {company?.name || 'Muayene Sistemi'}
              </Typography>
            </Stack>
            <Box sx={{ flexGrow: 1 }} />
            {user && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 32, height: 32 }}>{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</Avatar>
                <Stack spacing={0}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name || user.email}</Typography>
                  <Typography variant="caption" color="text.secondary">Teknisyen</Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
          <IconButton color="inherit" onClick={() => dispatch(toggleTheme())}>
            {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
          <LogoutButton />
        </Toolbar>
        </AppBar>

        <Sidebar />
        <SidebarPermanent />

        <Box component="main" sx={{ flexGrow: 1, pl: { md: `${useSelector((s: RootState) => s.ui.sidebarCollapsed) ? drawerCollapsedWidth : drawerWidth}px` } }}>
          <Toolbar />
          <Container maxWidth="xl" sx={{ py: 3 }}>
            {children}
          </Container>
        </Box>
      </Box>
  )
}
