// ============================================================
// ProtectedRoute — guards routes by auth + role
// ============================================================
import { Navigate } from 'react-router'
import { useAuthStore } from '@/auth/store'
import type { Role } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  roles?: Role[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, token } = useAuthStore()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (roles && roles.length > 0 && !roles.includes(user.roleName)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

