import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import { useLazyProfileQuery } from '@/features/auth/authApi'
import { setUser } from '@/store/slices/authSlice'

export default function AuthInitializer() {
  const dispatch = useDispatch()
  const token = useSelector((s: RootState) => s.auth.token)
  const user = useSelector((s: RootState) => s.auth.user)
  const [fetchProfile] = useLazyProfileQuery()

  useEffect(() => {
    if (token && !user) {
      fetchProfile().unwrap().then((res) => {
        if (res?.success) {
          dispatch(setUser(res.data?.user || res.data))
        }
      }).catch(() => {/* swallow */})
    }
  }, [token, user])

  return null
}

