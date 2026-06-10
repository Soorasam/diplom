import { useEffect, useMemo, useRef } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurements,
  useDriverActiveProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useCountdownTo } from "@/shared/hooks/useCountdownTo"
import { useProcurementCloseRefresh } from "@/shared/hooks/useProcurementCloseRefresh"
import { useRefetchOnVisible } from "@/shared/hooks/useRefetchOnVisible"
import { isOpenCollectionRound } from "@/shared/lib/driver-round-workload"
import {
  getProcurementCloseDeadline,
  isOpenProcurementStatus,
} from "@/shared/lib/procurement-poll-interval"

/** Фоновая синхронизация при закрытии сбора по расписанию или таймеру (PWA) */
export const ProcurementLiveSync = () => {
  const user = useAuthStore((s) => s.user)
  const refresh = useProcurementCloseRefresh()
  const isDriver = user?.role === "driver"
  const isResident = user?.role === "client"

  const { data: driverActive } = useDriverActiveProcurement(
    isDriver ? user?.id : undefined,
  )
  const { data: activeList } = useActiveProcurements({ enabled: isResident })

  const nearestDeadline = useMemo(() => {
    const deadlines: string[] = []

    if (driverActive && isOpenCollectionRound(driverActive)) {
      const deadline = getProcurementCloseDeadline(driverActive)
      if (deadline) deadlines.push(deadline)
    }

    if (isResident && activeList) {
      for (const procurement of activeList) {
        if (!isOpenProcurementStatus(procurement.status)) continue
        const deadline = getProcurementCloseDeadline(procurement)
        if (deadline) deadlines.push(deadline)
      }
    }

    if (!deadlines.length) return null
    return deadlines.reduce((earliest, current) =>
      new Date(current).getTime() < new Date(earliest).getTime() ? current : earliest,
    )
  }, [driverActive, activeList, isDriver, isResident])

  const { isExpired } = useCountdownTo(nearestDeadline)
  const expiredHandled = useRef(false)

  useEffect(() => {
    expiredHandled.current = false
  }, [nearestDeadline])

  useEffect(() => {
    if (!isExpired || !nearestDeadline || expiredHandled.current) return
    expiredHandled.current = true
    void refresh()
  }, [isExpired, nearestDeadline, refresh])

  const stillOpen = isDriver
    ? isOpenCollectionRound(driverActive)
    : activeList?.some((p) => isOpenProcurementStatus(p.status))

  useEffect(() => {
    if (!isExpired || !stillOpen) return
    const id = window.setInterval(() => void refresh(), 5000)
    return () => window.clearInterval(id)
  }, [isExpired, stillOpen, refresh])

  useRefetchOnVisible(() => {
    void refresh()
  })

  return null
}
