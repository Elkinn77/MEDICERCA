import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CenteredLoader } from './ui'

export function RutaProtegida() {
  const { autenticado, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <CenteredLoader label="Verificando sesión…" />
  if (!autenticado) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function RutaRegente() {
  const { autenticado, cargando, esRegente } = useAuth()
  const location = useLocation()

  if (cargando) return <CenteredLoader label="Verificando sesión…" />
  if (!autenticado) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!esRegente) return <Navigate to="/" replace />
  return <Outlet />
}
