import type { CoordinatorRoute } from "@/entities/route/api/routesApi"
import type { Order, Procurement } from "@/shared/api/api-types"

export const ordersForRound = (orders: Order[] | undefined, roundId: string) =>
  (orders ?? []).filter(
    (o) => o.procurementId === roundId && o.status !== "cancelled",
  )

/** Сбор закрыт, но рейса по сути нет — нет заказов или все доставлены */
export const isDeliveryRoundInProgress = (
  deliveryRound: Procurement | null | undefined,
  route: CoordinatorRoute | undefined,
  orders: Order[] | undefined,
): boolean => {
  if (!deliveryRound) return false

  const roundOrders = ordersForRound(orders, deliveryRound.id)
  if (roundOrders.length === 0) return false

  const hasOpenOrders = roundOrders.some((o) => o.status !== "delivered")
  if (!hasOpenOrders) return false

  const stops = route?.deliveryStops ?? []
  if (stops.length > 0) {
    const allStopsDone = stops.every((s) => s.status === "completed")
    if (allStopsDone && !hasOpenOrders) return false
  }

  return true
}

export const isOpenCollectionRound = (
  activeRound: Procurement | null | undefined,
): boolean => {
  if (!activeRound) return false
  return activeRound.status === "open" || activeRound.status === "closing"
}

/** Маршрут на карте координатора ещё требует работы */
export const isCoordinatorRouteInProgress = (
  route: CoordinatorRoute | undefined,
  orders: Order[] | undefined,
): boolean => {
  if (!route || route.status !== "active") return false

  const roundId = route.activeRoundId ?? route.id
  const roundOrders = ordersForRound(orders, roundId)
  if (roundOrders.length === 0) return false

  const hasUndelivered = roundOrders.some((o) => o.status !== "delivered")
  if (!hasUndelivered) return false

  const stops = route.deliveryStops ?? []
  if (stops.length > 0 && stops.every((s) => s.status === "completed")) {
    return hasUndelivered
  }

  return true
}
