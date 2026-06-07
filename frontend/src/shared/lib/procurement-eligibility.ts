import type { Procurement, User } from "@/shared/api/api-types"

export const getUserDeliveryLocationId = (
  user?: Pick<User, "pickupPointId" | "settlementId"> | null,
): string | undefined => {
  const id = user?.pickupPointId ?? user?.settlementId
  return id || undefined
}

/** Точки маршрута сбора (round waypoints), не шаблон Route */
export const isUserInProcurementWaypoints = (
  waypoints: Procurement["waypoints"],
  userLocationId: string | undefined,
): boolean => {
  if (!waypoints?.length) return true
  if (!userLocationId) return false
  return waypoints.some(
    (w) =>
      w.pickupPointId === userLocationId ||
      (w.settlementId != null && w.settlementId === userLocationId),
  )
}

export const isProcurementEligibleForUser = (
  procurement: Pick<Procurement, "waypoints">,
  user?: Pick<User, "pickupPointId" | "settlementId"> | null,
): boolean => {
  const locationId = getUserDeliveryLocationId(user)
  if (!locationId) return false
  return isUserInProcurementWaypoints(procurement.waypoints, locationId)
}
