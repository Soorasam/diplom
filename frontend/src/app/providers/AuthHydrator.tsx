import { useEffect } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import { getRefreshToken } from "@/shared/api/auth-storage"
import { ApiError, waitForAuthReady } from "@/shared/api/client"


export const AuthHydrator = () => {
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const refreshUser = useAuthStore((s) => s.refreshUser)

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    void (async () => {
      const ok = await waitForAuthReady()
      if (!ok) {
        if (!getRefreshToken()) {
          useAuthStore.getState().logout()
        }
        return
      }
      try {
        await refreshUser()
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          useAuthStore.getState().logout()
        }
      }
    })()
  }, [hasHydrated, isAuthenticated, refreshUser])

  return null
}
