import type { Procurement } from "@/shared/api/api-types"
import { PWA_DRIVER_POLL_MS, PWA_RESIDENT_POLL_MS } from "@/shared/config/live-sync"

const MS_MINUTE = 60_000

type DeadlineProcurement = Pick<
  Procurement,
  "emergencyCloseAt" | "closesAt" | "status"
>

export const isOpenProcurementStatus = (status: Procurement["status"]) =>
  status === "open" || status === "closing"

/** Ближайший дедлайн закрытия: экстренный таймер или плановое closesAt */
export const getProcurementCloseDeadline = (
  procurement: DeadlineProcurement,
): string | null => {
  if (!isOpenProcurementStatus(procurement.status)) return null
  if (procurement.emergencyCloseAt) return procurement.emergencyCloseAt
  if (procurement.closesAt) return procurement.closesAt
  return null
}

export const procurementRefetchIntervalMs = (
  procurement: DeadlineProcurement | null | undefined,
): number | false => {
  if (!procurement || !isOpenProcurementStatus(procurement.status)) return false

  if (procurement.status === "closing" || procurement.emergencyCloseAt) {
    return 3000
  }

  const deadline = getProcurementCloseDeadline(procurement)
  if (!deadline) return 30_000

  const remaining = new Date(deadline).getTime() - Date.now()
  if (remaining <= 0) return 3000
  if (remaining <= 5 * MS_MINUTE) return 5000
  if (remaining <= 60 * MS_MINUTE) return 15_000
  return 30_000
}

export const activeProcurementsRefetchIntervalMs = (
  list: DeadlineProcurement[] | undefined,
): number | false => {
  if (!list?.length) return false
  const open = list.filter((p) => isOpenProcurementStatus(p.status))
  if (!open.length) return false

  const intervals = open
    .map((p) => procurementRefetchIntervalMs(p))
    .filter((v): v is number => v !== false)

  return intervals.length ? Math.min(...intervals) : false
}

/** Не реже базового интервала PWA, чаще — при закрытии/дедлайне */
export const resolveDriverProcurementPollMs = (
  procurement: DeadlineProcurement | null | undefined,
): number => {
  const fast = procurementRefetchIntervalMs(procurement)
  if (fast === false) return PWA_DRIVER_POLL_MS
  return Math.min(fast, PWA_DRIVER_POLL_MS)
}

export const resolveResidentProcurementsPollMs = (
  list: DeadlineProcurement[] | undefined,
): number => {
  const fast = activeProcurementsRefetchIntervalMs(list)
  if (fast === false) return PWA_RESIDENT_POLL_MS
  return Math.min(fast, PWA_RESIDENT_POLL_MS)
}
