import type { CoordinatorRoute } from "@/entities/route/api/routesApi"
import type { Order } from "@/shared/api/api-types"

import { isCoordinatorRouteInProgress, ordersForRound } from "./driver-round-workload"

type BadgeVariant = "default" | "success" | "warning" | "info" | "danger"

export const getDriverRouteDisplayStatus = (
  route: CoordinatorRoute,
  orders: Order[] | undefined,
): { label: string; variant: BadgeVariant } => {
  const roundId = route.activeRoundId ?? route.id
  const roundOrders = ordersForRound(orders, roundId)

  if (route.status === "planned") {
    return { label: "Запланирован", variant: "warning" }
  }

  if (roundOrders.length === 0) {
    return { label: "Не состоялся", variant: "danger" }
  }

  if (route.status === "active" && isCoordinatorRouteInProgress(route, orders)) {
    return { label: "Активен", variant: "info" }
  }

  if (route.status === "active") {
    return { label: "Закрыт", variant: "info" }
  }

  return { label: "Завершён", variant: "success" }
}
