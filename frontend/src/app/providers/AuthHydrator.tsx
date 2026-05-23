import { useEffect } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import { ensureValidAccessToken } from "@/shared/api/client"

/** После восстановления сессии подтягивает профиль с сервера */
export const AuthHydrator = () => {
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    void (async () => {
      const ok = await ensureValidAccessToken()
      if (!ok) {
        useAuthStore.getState().logout()
        return
      }
      try {
        await refreshUser()
      } catch {
        useAuthStore.getState().logout()
      }
    })()
  }, [hasHydrated, isAuthenticated, refreshUser])

  return null
}
