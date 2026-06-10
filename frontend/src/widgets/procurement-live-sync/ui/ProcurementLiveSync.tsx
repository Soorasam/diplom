import { useEffect, useMemo, useRef } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurements,
  useDriverActiveProcurement,
} from "@/entities/procurement/api/useProcurements"
import { PWA_DRIVER_POLL_MS, PWA_RESIDENT_POLL_MS } from "@/shared/config/live-sync"
import { useCountdownTo } from "@/shared/hooks/useCountdownTo"
import { useProcurementCloseRefresh } from "@/shared/hooks/useProcurementCloseRefresh"
import { usePwaResumeRefetch } from "@/shared/hooks/usePwaResumeRefetch"
import { isOpenCollectionRound } from "@/shared/lib/driver-round-workload"
import {
  getProcurementCloseDeadline,
  isOpenProcurementStatus,
} from "@/shared/lib/procurement-poll-interval"

/** Фоновая синхронизация при закрытии сбора и смене этапов рейса (PWA / iOS) */
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

  useEffect(() => {
    if (!user) return
    const intervalMs = isDriver
      ? PWA_DRIVER_POLL_MS
      : isResident
        ? PWA_RESIDENT_POLL_MS
        : 0
    if (!intervalMs) return

    const id = window.setInterval(() => void refresh(), intervalMs)
    return () => window.clearInterval(id)
  }, [user, isDriver, isResident, refresh])

  usePwaResumeRefetch(() => {
    void refresh()
  })

  return null
}
