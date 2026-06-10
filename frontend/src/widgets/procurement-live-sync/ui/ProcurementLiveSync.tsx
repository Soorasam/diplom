import { useEffect, useMemo, useRef } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurements,
  useDriverDeliveryProcurement,
} from "@/entities/procurement/api/useProcurements"
import {
  PWA_DRIVER_BURST_MS,
  PWA_DRIVER_POLL_MS,
  PWA_RESIDENT_POLL_MS,
} from "@/shared/config/live-sync"
import { useCountdownTo } from "@/shared/hooks/useCountdownTo"
import { useDriverEffectiveActiveRound } from "@/shared/hooks/useDriverEffectiveActiveRound"
import { useDriverNavigationRefetch } from "@/shared/hooks/useDriverNavigationRefetch"
import { useDriverPwaInteractRefetch } from "@/shared/hooks/useDriverPwaInteractRefetch"
import { useProcurementCloseRefresh } from "@/shared/hooks/useProcurementCloseRefresh"
import { usePwaResumeRefetch } from "@/shared/hooks/usePwaResumeRefetch"
import { useRecurringTimeout } from "@/shared/hooks/useRecurringTimeout"
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

  const { data: driverActive } = useDriverEffectiveActiveRound(
    isDriver ? user?.id : undefined,
  )
  const { data: driverDelivery } = useDriverDeliveryProcurement(
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

  const driverWorkflowActive = isDriver && Boolean(driverActive || driverDelivery)

  useRecurringTimeout(
    () => void refresh(),
    PWA_DRIVER_BURST_MS,
    isDriver && (isExpired || driverWorkflowActive),
  )

  useRecurringTimeout(
    () => void refresh(),
    isDriver ? PWA_DRIVER_POLL_MS : isResident ? PWA_RESIDENT_POLL_MS : 0,
    Boolean(user),
  )

  usePwaResumeRefetch(() => {
    void refresh()
  })

  useDriverPwaInteractRefetch()
  useDriverNavigationRefetch()

  return null
}
