import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { refetchProcurementState } from "@/shared/lib/invalidate-procurement-state"

/** Рефреш данных после закрытия сбора (таймер или ручное действие) */
export const useProcurementCloseRefresh = () => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)

  return useCallback(() => {
    const driverId = user?.role === "driver" ? user.id : undefined
    return refetchProcurementState(qc, { driverId, userId: user?.id })
  }, [qc, user])
}
