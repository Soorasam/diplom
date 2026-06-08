import type { CoordinatorRoute } from "@/entities/route/api/routesApi"
import type { Order, Procurement } from "@/shared/api/api-types"

export const isOpenCollectionRound = (
  activeRound: Procurement | null | undefined,
): boolean => {
  if (!activeRound) return false
  return activeRound.status === "open" || activeRound.status === "closing"
}

/** Текущий маршрут: сначала рейс закрытого сбора, затем открытый сбор, иначе первый active */
export const resolveDriverActiveRoute = (
  routes: CoordinatorRoute[] | undefined,
  deliveryRound?: Procurement | null,
  activeRound?: Procurement | null,
): CoordinatorRoute | undefined => {
  if (!routes?.length) return undefined

  const byRoundId = (roundId?: string | null) => {
    if (!roundId) return undefined
    return routes.find(
      (r) => r.id === roundId || r.activeRoundId === roundId,
    )
  }

  if (deliveryRound) {
    const matched = byRoundId(deliveryRound.id)
    if (matched && matched.status !== "completed") return matched
    return undefined
  }

  if (activeRound && isOpenCollectionRound(activeRound)) {
    const matched = byRoundId(activeRound.id)
    if (matched && matched.status !== "completed") return matched
    return undefined
  }

  return undefined
}

export const ordersForRound = (orders: Order[] | undefined, roundId: string) =>
  (orders ?? []).filter(
    (o) => o.procurementId === roundId && o.status !== "cancelled",
  )

/** Сбор закрыт, рейс ещё идёт — пока не закрыты все точки маршрута */
export const isDeliveryRoundInProgress = (
  deliveryRound: Procurement | null | undefined,
  route: CoordinatorRoute | undefined,
  orders: Order[] | undefined,
): boolean => {
  if (!deliveryRound) return false

  const stops = route?.deliveryStops ?? []
  if (stops.length > 0) {
    return stops.some((s) => s.status !== "completed")
  }

  if (route?.status === "active") return true

  const roundOrders = ordersForRound(orders, deliveryRound.id)
  if (roundOrders.length === 0) return false

  return roundOrders.some((o) => o.status !== "delivered")
}

/** Маршрут водителя ещё требует работы (не смотрим только на незавершённые заказы в workbench) */
export const isCoordinatorRouteInProgress = (
  route: CoordinatorRoute | undefined,
  orders: Order[] | undefined,
): boolean => {
  if (!route || route.status !== "active") return false

  const stops = route.deliveryStops ?? []
  if (stops.length > 0) {
    return stops.some((s) => s.status !== "completed")
  }

  const roundId = route.activeRoundId ?? route.id
  const roundOrders = ordersForRound(orders, roundId)
  if (roundOrders.length === 0) return true

  return roundOrders.some((o) => o.status !== "delivered")
}
