import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import {
  filterDriverRouteStops,
  pickCurrentDriverStop,
} from "@/shared/lib/driver-route-stops"
import {
  useDriverActiveProcurement,
  useDriverDeliveryProcurement,
} from "@/entities/procurement/api/useProcurements"
import { routesApi } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import { PWA_DRIVER_POLL_MS } from "@/shared/config/live-sync"
import { liveQueryOptions } from "@/shared/lib/query-live-options"
import { buildSettlementBlocks } from "@/shared/lib/driver-settlement-order"
import {
  groupOrdersByResident,
  groupOrdersBySettlement,
  isAwaitingTripAccept,
} from "@/shared/lib/driver-orders"
import {
  isOpenCollectionRound,
  resolveDriverActiveRoute,
} from "@/shared/lib/driver-round-workload"

export const useDriverWorkbench = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : ""
  const driverPickupPointId = user?.pickupPointId

  const { data: driverRoutes, isLoading: loadingRoutes } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
    enabled: Boolean(driverId),
    ...liveQueryOptions,
    refetchInterval: PWA_DRIVER_POLL_MS,
  })

  const { data: driverOrders, isLoading: loadingOrders } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
    enabled: Boolean(driverId),
    ...liveQueryOptions,
    refetchInterval: PWA_DRIVER_POLL_MS,
  })

  const { data: activeRound } = useDriverActiveProcurement(user?.id)
  const { data: deliveryRound } = useDriverDeliveryProcurement(user?.id)

  const activeRoute = useMemo(
    () => resolveDriverActiveRoute(driverRoutes, deliveryRound, activeRound),
    [driverRoutes, deliveryRound, activeRound],
  )

  const orders = driverOrders ?? []
  const ordersBySettlement = useMemo(
    () => groupOrdersBySettlement(orders),
    [orders],
  )
  const awaitingAccept = useMemo(() => orders.filter(isAwaitingTripAccept), [orders])
  const awaitingAcceptCount = useMemo(
    () => groupOrdersByResident(awaitingAccept).length,
    [awaitingAccept],
  )
  const settlementBlocks = useMemo(
    () => buildSettlementBlocks(activeRoute?.deliveryStops, ordersBySettlement),
    [activeRoute?.deliveryStops, ordersBySettlement],
  )

  const routeStops = useMemo(
    () => filterDriverRouteStops(activeRoute?.deliveryStops ?? [], driverPickupPointId),
    [activeRoute?.deliveryStops, driverPickupPointId],
  )
  const currentStop = pickCurrentDriverStop(routeStops)
  const currentStopOrders = currentStop
    ? ordersBySettlement.get(currentStop.pickupPointId) ?? []
    : []
  const pendingConfirmCount = currentStopOrders.filter(
    (o) => o.status === "in_transit" || o.status === "at_pickup",
  ).length

  const workRoundId = activeRoute?.activeRoundId ?? deliveryRound?.id ?? activeRound?.id

  return {
    driverId,
    isLoading: loadingRoutes || loadingOrders,
    driverRoutes,
    activeRoute,
    routeStops,
    activeRound,
    deliveryRound,
    hasOpenCollection: isOpenCollectionRound(activeRound),
    orders,
    ordersBySettlement,
    awaitingAccept,
    awaitingAcceptCount,
    settlementBlocks,
    currentStop,
    currentStopOrders,
    pendingConfirmCount,
    workRoundId,
    ordersBadgeCount: awaitingAcceptCount,
  }
}
