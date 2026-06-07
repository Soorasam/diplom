import type { Procurement, ProcurementWaypoint, User } from "@/shared/api/api-types"

const normalizeId = (id: string | null | undefined) =>
  id?.trim().toLowerCase() ?? ""

const normalizeName = (name: string | null | undefined) =>
  name?.trim().toLowerCase().replace(/\s+/g, " ") ?? ""

/** Все идентификаторы посёлка жителя из профиля */
export const getUserDeliveryLocationIds = (
  user?: Pick<User, "pickupPointId" | "settlementId"> | null,
): Set<string> => {
  const ids = new Set<string>()
  for (const raw of [user?.pickupPointId, user?.settlementId]) {
    const id = normalizeId(raw)
    if (id) ids.add(id)
  }
  return ids
}

export const getUserDeliveryLocationId = (
  user?: Pick<User, "pickupPointId" | "settlementId"> | null,
): string | undefined => {
  const ids = getUserDeliveryLocationIds(user)
  return ids.size > 0 ? [...ids][0] : undefined
}

const waypointLocationIds = (w: ProcurementWaypoint): string[] => {
  const raw = w as ProcurementWaypoint & { pickupPoint?: { id?: string } }
  return [
    w.pickupPointId,
    w.settlementId,
    raw.pickupPoint?.id,
  ]
    .map(normalizeId)
    .filter(Boolean)
}

const waypointNames = (w: ProcurementWaypoint): string[] => {
  const raw = w as ProcurementWaypoint & { pickupPoint?: { name?: string } }
  return [w.settlementName, raw.pickupPoint?.name]
    .map(normalizeName)
    .filter(Boolean)
}

/** Точки маршрута сбора (round waypoints), не шаблон Route */
export const isUserInProcurementWaypoints = (
  waypoints: Procurement["waypoints"],
  locationIds: Set<string>,
  userSettlementName?: string,
): boolean => {
  if (!waypoints?.length) return true
  if (locationIds.size === 0 && !userSettlementName) return false

  const userName = normalizeName(userSettlementName)

  return waypoints.some((w) => {
    if (locationIds.size > 0) {
      const wpIds = waypointLocationIds(w)
      if (wpIds.some((id) => locationIds.has(id))) return true
    }
    if (userName) {
      return waypointNames(w).some((n) => n === userName)
    }
    return false
  })
}

export const isProcurementEligibleForUser = (
  procurement: Pick<Procurement, "waypoints">,
  user?: Pick<User, "pickupPointId" | "settlementId"> | null,
  userSettlementName?: string,
): boolean => {
  const locationIds = getUserDeliveryLocationIds(user)
  if (locationIds.size === 0 && !userSettlementName) return false
  return isUserInProcurementWaypoints(
    procurement.waypoints,
    locationIds,
    userSettlementName,
  )
}
