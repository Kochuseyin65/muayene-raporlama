import { Drawer, Toolbar, Box, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Stack, Typography } from '@mui/material'
import { NAV_ITEMS } from '@/constants/nav'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/store/store'
import { usePermission } from '@/hooks/usePermission'
import { setSidebarOpen } from '@/store/slices/uiSlice'
import { useGetMyCompanyProfileQuery } from '@/features/companies/companiesApi'

const drawerWidth = 240
const drawerCollapsedWidth = 72

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const open = useSelector((s: RootState) => s.ui.sidebarOpen)
  const { has, hasAny, hasAll } = usePermission()
  const { data: companyRes } = useGetMyCompanyProfileQuery(undefined, { skip: !useSelector((s: RootState) => s.auth.isAuthenticated) })
  const company = companyRes?.data

  const canSee = (perm?: string | string[]) => {
    if (!perm) return true
    if (Array.isArray(perm)) return hasAll(perm)
    return has(perm)
  }

  const content = (
    <Box sx={{ width: drawerWidth }} role="presentation">
      <Toolbar />
      {company && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 1 }}>
          {company.logo_url && (
            <Box component="img" src={company.logo_url.startsWith('http') ? company.logo_url : `${import.meta.env.VITE_API_BASE_URL}${company.logo_url}`}
                 alt="Logo" sx={{ width: 28, height: 28, borderRadius: '6px' }} />
          )}
          <Typography variant="subtitle2" fontWeight={700} noWrap>{company.name}</Typography>
        </Stack>
      )}
      <List>
        {NAV_ITEMS.filter((n) => canSee(n.permission)).map((n) => {
          const active = location.pathname === n.path
          return (
            <ListItemButton key={n.path} selected={active} onClick={() => { navigate(n.path); dispatch(setSidebarOpen(false)) }}>
              <ListItemIcon>{n.icon}</ListItemIcon>
              <ListItemText primary={n.label} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={() => dispatch(setSidebarOpen(false))}
      ModalProps={{ keepMounted: true }}
      sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
    >
      {content}
    </Drawer>
  )
}

export function SidebarPermanent() {
  const location = useLocation()
  const navigate = useNavigate()
  const { has, hasAll } = usePermission()
  const collapsed = useSelector((s: RootState) => s.ui.sidebarCollapsed)
  const { data: companyRes2 } = useGetMyCompanyProfileQuery(undefined, { skip: !useSelector((s: RootState) => s.auth.isAuthenticated) })
  const company2 = companyRes2?.data
  const canSee = (perm?: string | string[]) => {
    if (!perm) return true
    if (Array.isArray(perm)) return hasAll(perm)
    return has(perm)
  }

  return (
    <Drawer
      variant="permanent"
      sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: collapsed ? drawerCollapsedWidth : drawerWidth, boxSizing: 'border-box', overflowX: 'hidden' } }}
      open
    >
      <Toolbar />
      {company2 && !collapsed && (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 1 }}>
          {company2.logo_url && (
            <Box component="img" src={company2.logo_url.startsWith('http') ? company2.logo_url : `${import.meta.env.VITE_API_BASE_URL}${company2.logo_url}`}
                 alt="Logo" sx={{ width: 28, height: 28, borderRadius: '6px' }} />
          )}
          <Typography variant="subtitle2" fontWeight={700} noWrap>{company2.name}</Typography>
        </Stack>
      )}
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {NAV_ITEMS.filter((n) => canSee(n.permission)).map((n) => {
            const active = location.pathname === n.path
            return (
              <Tooltip key={n.path} title={collapsed ? n.label : ''} placement="right">
                <ListItemButton selected={active} onClick={() => navigate(n.path)} sx={{ px: collapsed ? 1.5 : 2 }}>
                  <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center' }}>{n.icon}</ListItemIcon>
                  {!collapsed && <ListItemText primary={n.label} />}
                </ListItemButton>
              </Tooltip>
            )
          })}
        </List>
      </Box>
    </Drawer>
  )
}

export { drawerWidth, drawerCollapsedWidth }
