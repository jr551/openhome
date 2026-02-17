import { Navigate, Outlet } from 'react-router-dom'
import { useStore } from '../store'

export const ProtectedRoute = () => {
  const token = useStore(state => state.token)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
