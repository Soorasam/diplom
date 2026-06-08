import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useDriverActiveProcurement,
  useDriverDeliveryProcurement,
} from "@/entities/procurement/api/useProcurements"
import { routesApi } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import { buildSettlementBlocks } from "@/shared/lib/driver-settlement-order"
import {
  groupOrdersBySettlement,
  isAwaitingTripAccept,
} from "@/shared/lib/driver-orders"
import {
  isCoordinatorRouteInProgress,
  isOpenCollectionRound,
} from "@/shared/lib/driver-round-workload"

export const useDriverWorkbench = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : ""

  const { data: driverRoutes, isLoading: loadingRoutes } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
    enabled: Boolean(driverId),
  })

  const { data: driverOrders, isLoading: loadingOrders } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
    enabled: Boolean(driverId),
  })

  const { data: activeRound } = useDriverActiveProcurement(user?.id)
  const { data: deliveryRound } = useDriverDeliveryProcurement(user?.id)

  const rawActiveRoute = driverRoutes?.find((r) => r.status === "active")
  const activeRoute =
    rawActiveRoute && isCoordinatorRouteInProgress(rawActiveRoute, driverOrders)
      ? rawActiveRoute
      : undefined

  const orders = driverOrders ?? []
  const ordersBySettlement = useMemo(
    () => groupOrdersBySettlement(orders),
    [orders],
  )
  const awaitingAccept = useMemo(() => orders.filter(isAwaitingTripAccept), [orders])
  const settlementBlocks = useMemo(
    () => buildSettlementBlocks(activeRoute?.deliveryStops, ordersBySettlement),
    [activeRoute?.deliveryStops, ordersBySettlement],
  )

  const currentStop = activeRoute?.deliveryStops?.find((s) => s.status !== "completed")
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
    activeRound,
    deliveryRound,
    hasOpenCollection: isOpenCollectionRound(activeRound),
    orders,
    ordersBySettlement,
    awaitingAccept,
    awaitingAcceptCount: awaitingAccept.length,
    settlementBlocks,
    currentStop,
    currentStopOrders,
    pendingConfirmCount,
    workRoundId,
    ordersBadgeCount: awaitingAccept.length,
  }
}
