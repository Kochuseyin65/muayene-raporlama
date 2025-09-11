import { Navigate, Outlet } from 'react-router-dom'
import { usePermission } from '@/hooks/usePermission'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'

export default function PermissionRoute({ permission, anyOf, allOf }: { permission?: string; anyOf?: string[]; allOf?: string[] }) {
  const { has, hasAny, hasAll } = usePermission()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const userLoaded = useSelector((s: RootState) => !!s.auth.user)
  let allowed = false
  if (permission) allowed = has(permission)
  if (anyOf && anyOf.length) allowed = hasAny(anyOf)
  if (allOf && allOf.length) allowed = hasAll(allOf)
  // Avoid redirect flicker before profile is hydrated
  if (isAuthenticated && !userLoaded) return null
  return allowed ? <Outlet /> : <Navigate to="/dashboard" replace />
}
