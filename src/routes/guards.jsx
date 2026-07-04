import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader } from '../components/ui'

/** Choriste connecté ET validé. Sinon -> onboarding adapté. */
export function RequireActive({ children }) {
  const { loading, user, profile, isActive } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/" replace />
  if (!profile) return <Loader />
  if (profile.must_change_password) return <Navigate to="/change-password" replace />
  if (!isActive) return <Navigate to="/pending" replace />
  return children
}

/** Réservé à l'administrateur. La vraie barrière reste la RLS côté Supabase. */
export function RequireAdmin({ children }) {
  const { loading, user, profile, isAdmin } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/admin/login" replace />
  if (!profile) return <Loader />
  if (!isAdmin) return <Navigate to="/app" replace />
  return children
}

/** Redirige un utilisateur déjà connecté hors des écrans d'auth. */
export function RedirectIfAuthed({ children }) {
  const { loading, user, profile } = useAuth()
  if (loading) return <Loader />
  if (user && profile) {
    if (profile.must_change_password) return <Navigate to="/change-password" replace />
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    if (profile.status === 'active') return <Navigate to="/app" replace />
    return <Navigate to="/pending" replace />
  }
  return children
}
