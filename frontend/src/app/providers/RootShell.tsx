import { Navigate, Outlet, useLocation } from "react-router-dom"
import { homeRouteForRole, useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"

export const RootShell = () => {
  const location = useLocation()
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (!hasHydrated) return null

  if (!isAuthenticated || !user) {
    return <Outlet />
  }

  const path = location.pathname
  const isUserPath = path === routes.user.root || path.startsWith(`${routes.user.root}/`)
  const isDriverPath = path === routes.driver.root || path.startsWith(`${routes.driver.root}/`)
  const isEmployeePath =
    path === routes.employee.root || path.startsWith(`${routes.employee.root}/`)
  const isAdminPath = path === routes.admin.root || path.startsWith(`${routes.admin.root}/`)

  const roleRoot = homeRouteForRole(user.role)

  if (user.role === "client" && (isDriverPath || isEmployeePath || isAdminPath)) {
    return <Navigate to={roleRoot} replace />
  }
  if (user.role === "driver" && (isUserPath || isEmployeePath || isAdminPath)) {
    return <Navigate to={roleRoot} replace />
  }
  if (user.role === "employee" && (isUserPath || isDriverPath || isAdminPath)) {
    return <Navigate to={roleRoot} replace />
  }
  if (user.role === "admin" && (isUserPath || isDriverPath || isEmployeePath)) {
    return <Navigate to={roleRoot} replace />
  }

  return <Outlet />
}
