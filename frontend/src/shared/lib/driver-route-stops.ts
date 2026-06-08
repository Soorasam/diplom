import type { CoordinatorRoute, RouteDeliveryStop } from "@/entities/route/api/routesApi"

import { buildRouteChain } from "@/shared/lib/driver-phase-hero"

/** Убирает пустую «домашнюю» точку водителя в хвосте маршрута */
export const filterDriverRouteStops = (
  stops: RouteDeliveryStop[],
  driverPickupPointId?: string,
): RouteDeliveryStop[] =>
  stops.filter((ds, index, arr) => {
    const isLast = index === arr.length - 1
    const isDriverOwnTailStop =
      Boolean(driverPickupPointId) &&
      ds.pickupPointId === driverPickupPointId &&
      isLast &&
      (ds.totalOrders ?? 0) === 0 &&
      (ds.receivedOrders ?? 0) === 0 &&
      !ds.expectsOrders
    return !isDriverOwnTailStop
  })

/** Единая цепочка маршрута: план из waypoints (name), не разъезжается между экранами */
export const resolveDriverRouteChain = (
  route?: Pick<CoordinatorRoute, "name" | "deliveryStops"> | null,
  driverPickupPointId?: string,
): string => {
  if (!route) return ""
  const stops = filterDriverRouteStops(route.deliveryStops ?? [], driverPickupPointId)
  if (stops.length > 0) return buildRouteChain(stops)
  return route.name?.trim() ?? ""
}

export const pickCurrentDriverStop = (
  stops: RouteDeliveryStop[],
): RouteDeliveryStop | undefined => stops.find((s) => s.status !== "completed")

export const areAllDriverStopsCompleted = (stops: RouteDeliveryStop[]) =>
  stops.length > 0 && stops.every((s) => s.status === "completed")

export const isDriverProcurementStop = (stop?: RouteDeliveryStop) =>
  Boolean(stop?.isProcurementStop && !stop.procurementCompleted)
