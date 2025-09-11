import { useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import type { Permission } from '@/constants/permissions'

type InputPerm = Permission | string

export function usePermission(required?: InputPerm | InputPerm[]) {
  const user = useSelector((s: RootState) => s.auth.user)
  const userPerms = (user?.permissions || []) as string[]
  const isSuper = userPerms.includes('superAdmin')

  const has = (perm?: InputPerm | InputPerm[]) => {
    if (!perm) return false
    if (isSuper) return true
    if (Array.isArray(perm)) return perm.every((p) => userPerms.includes(p))
    return userPerms.includes(perm)
  }

  const hasAny = (perms: InputPerm[]) => isSuper || perms.some((p) => userPerms.includes(p))
  const hasAll = (perms: InputPerm[]) => isSuper || perms.every((p) => userPerms.includes(p))

  return {
    userPermissions: userPerms,
    isSuper,
    allowed: required ? (Array.isArray(required) ? hasAll(required) : has(required)) : false,
    has,
    hasAny,
    hasAll,
  }
}
