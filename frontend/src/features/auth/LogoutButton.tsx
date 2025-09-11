import { Button } from '@mui/material'
import { useDispatch } from 'react-redux'
import { logout } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export default function LogoutButton() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const onClick = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }
  return (
    <Button color="inherit" onClick={onClick}>
      Çıkış
    </Button>
  )
}

