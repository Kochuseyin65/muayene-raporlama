import { useState } from 'react'
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert } from '@mui/material'
import { useLoginMutation, useLazyProfileQuery } from './authApi'
import { useDispatch } from 'react-redux'
import { setCredentials, setUser } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [login, { isLoading }] = useLoginMutation()
  const [triggerProfile] = useLazyProfileQuery()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const res = await login({ email, password }).unwrap()
      const token = res?.data?.token
      const user = res?.data?.user
      if (!res?.success || !token) throw new Error('Giriş başarısız')
      dispatch(setCredentials({ token, user }))
      const profile = await triggerProfile().unwrap()
      if (profile?.success) {
        dispatch(setUser(profile.data?.user || profile.data))
      }
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Giriş başarısız')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <Container maxWidth="sm">
        <Paper elevation={4} sx={{ p: 5 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={700}>Muayene Sistemi</Typography>
            <Typography variant="body2" color="text.secondary">Lütfen hesabınızla giriş yapın</Typography>
            <Box component="form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="E-posta" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                <TextField label="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <Button type="submit" variant="contained" size="large" disabled={isLoading}>
                  {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
