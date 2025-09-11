import type { PropsWithChildren, ReactNode } from 'react'
import { usePermission } from '@/hooks/usePermission'

type Props = PropsWithChildren<{
  permission?: string | string[]
  anyOf?: string[]
  allOf?: string[]
  fallback?: ReactNode
}>

export default function PermissionGuard({ permission, anyOf, allOf, fallback = null, children }: Props) {
  const { has, hasAny, hasAll } = usePermission()
  let allowed = false

  if (permission) allowed = has(permission)
  if (anyOf && anyOf.length) allowed = hasAny(anyOf)
  if (allOf && allOf.length) allowed = hasAll(allOf)

  return allowed ? <>{children}</> : <>{fallback}</>
}

