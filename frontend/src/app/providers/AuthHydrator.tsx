import { useEffect } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import { getAccessToken } from "@/shared/api/auth-storage"

/** После восстановления сессии подтягивает профиль с сервера */
export const AuthHydrator = () => {
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    if (!getAccessToken()) return
    void refreshUser().catch(() => {
      useAuthStore.getState().logout()
    })
  }, [hasHydrated, isAuthenticated, refreshUser])

  return null
}
