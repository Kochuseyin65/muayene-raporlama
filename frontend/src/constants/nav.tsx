import type { ReactNode } from 'react'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import GroupIcon from '@mui/icons-material/Group'
import RequestQuoteIcon from '@mui/icons-material/RequestQuote'
import AssignmentIcon from '@mui/icons-material/Assignment'
import FactCheckIcon from '@mui/icons-material/FactCheck'

export type NavItem = {
  label: string
  path: string
  icon: ReactNode
  permission?: string | string[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Teklifler', path: '/offers', icon: <RequestQuoteIcon />, permission: 'viewOffers' },
  { label: 'İş Emirleri', path: '/work-orders', icon: <AssignmentIcon />, permission: 'viewWorkOrders' },
  { label: 'Muayeneler', path: '/inspections', icon: <FactCheckIcon />, permission: 'viewInspections' },
  { label: 'Müşteriler', path: '/customers', icon: <PeopleIcon />, permission: 'viewCustomers' },
  { label: 'Ekipmanlar', path: '/equipment', icon: <Inventory2Icon />, permission: 'viewEquipment' },
  { label: 'Teknisyenler', path: '/technicians', icon: <GroupIcon />, permission: 'viewTechnicians' },
]
