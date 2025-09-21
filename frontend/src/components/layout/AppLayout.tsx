import { useState, type PropsWithChildren, type MouseEvent } from 'react'
import { AppBar, Avatar, Box, CssBaseline, IconButton, Toolbar, Typography, Stack, Container, useMediaQuery, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar, toggleSidebarCollapsed, toggleTheme } from '@/store/slices/uiSlice'
import type { RootState } from '@/store/store'
import { logout } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import Sidebar, { SidebarPermanent, drawerWidth, drawerCollapsedWidth } from './Sidebar'
import { useGetMyCompanyProfileQuery } from '@/features/companies/companiesApi'

export default function AppLayout({ children }: PropsWithChildren) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const themeMode = useSelector((s: RootState) => s.ui.theme)
  const isDesktop = useMediaQuery('(min-width:900px)')
  const authState = useSelector((s: RootState) => s.auth)
  const user = authState.user
  const displayName = user ? [user.name, user.surname].filter(Boolean).join(' ').trim() || user.email || '' : ''
  const avatarInitial = displayName ? displayName.charAt(0).toUpperCase() : '?'
  const roleLabel = 'Teknisyen'

  const { data: companyRes } = useGetMyCompanyProfileQuery(undefined, { skip: !authState.isAuthenticated })
  const company = companyRes?.data

  const logoSrc = (() => {
    const url = company?.logo_url
    if (!url) return null
    if (url.startsWith('http')) return url
    if (url.startsWith('/api')) return url
    if (url.startsWith('/uploads')) return `${import.meta.env.VITE_API_BASE_URL}${url}`
    return url
  })()

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(menuAnchor)

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleMenuClose = () => setMenuAnchor(null)

  const handleSettings = () => {
    setMenuAnchor(null)
    navigate('/settings')
  }

  const handleLogout = () => {
    setMenuAnchor(null)
    dispatch(logout())
    navigate('/login', { replace: true })
  }

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
                <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>{avatarInitial}</Avatar>
                </IconButton>
                <Stack spacing={0}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">{roleLabel}</Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
          <IconButton color="inherit" onClick={() => dispatch(toggleTheme())}>
            {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleSettings}>
              <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Ayarlar" />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Çıkış" />
            </MenuItem>
          </Menu>
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
