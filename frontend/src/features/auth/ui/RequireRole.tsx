import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"
import type { UserRole } from "@/shared/types"

export const RequireRole = ({
  roles,
  children,
}: {
  roles: UserRole[]
  children: ReactNode
}) => {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (!isAuthenticated || !user) {
    return <Navigate to={routes.auth} replace state={{ from: location }} />
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={routes.home} replace />
  }

  return children
}

