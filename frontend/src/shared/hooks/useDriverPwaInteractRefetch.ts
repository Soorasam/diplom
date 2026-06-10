import { useEffect, useRef } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import { useProcurementCloseRefresh } from "@/shared/hooks/useProcurementCloseRefresh"

const DEBOUNCE_MS = 2_000

/** Любое касание/клик в PWA — повод подтянуть свежие данные (iOS не шлёт focus) */
export const useDriverPwaInteractRefetch = () => {
  const user = useAuthStore((s) => s.user)
  const refresh = useProcurementCloseRefresh()
  const lastRun = useRef(0)

  useEffect(() => {
    if (user?.role !== "driver") return

    const run = () => {
      const now = Date.now()
      if (now - lastRun.current < DEBOUNCE_MS) return
      lastRun.current = now
      void refresh()
    }

    document.addEventListener("touchstart", run, { passive: true })
    document.addEventListener("click", run, { passive: true })

    return () => {
      document.removeEventListener("touchstart", run)
      document.removeEventListener("click", run)
    }
  }, [user?.role, refresh])
}
