import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"
import { routes } from "@/shared/config/routes"

export type DriverRouteAction =
  | {
      kind: "complete"
      label: string
      disabled: boolean
      disabledReason?: string
      pickupPointId: string
    }
  | {
      kind: "link"
      label: string
      to: string
    }
  | { kind: "none" }

export const buildDriverRouteAction = (input: {
  currentStop?: RouteDeliveryStop
  roundId?: string
  tripCompleted: boolean
  pendingConfirm: boolean
}): DriverRouteAction => {
  const { currentStop, roundId, tripCompleted, pendingConfirm } = input

  if (!roundId || tripCompleted || !currentStop) {
    return { kind: "none" }
  }

  if (currentStop.isProcurementStop && !currentStop.procurementCompleted) {
    return {
      kind: "link",
      label: "Открыть чек-лист закупки",
      to: routes.driver.orders,
    }
  }

  if (!currentStop.driverCanComplete) {
    if (currentStop.expectsOrders && pendingConfirm) {
      return {
        kind: "complete",
        label: "Дождитесь подтверждений жителей",
        disabled: true,
        disabledReason: "pending_confirm",
        pickupPointId: currentStop.pickupPointId,
      }
    }
    return { kind: "none" }
  }

  if (pendingConfirm) {
    return {
      kind: "complete",
      label: "Дождитесь подтверждений всех жителей",
      disabled: true,
      pickupPointId: currentStop.pickupPointId,
    }
  }

  if (currentStop.expectsOrders) {
    return {
      kind: "complete",
      label: "Посёлок завершён — ехать дальше",
      disabled: false,
      pickupPointId: currentStop.pickupPointId,
    }
  }

  if (currentStop.isProcurementStop) {
    return {
      kind: "complete",
      label: "Закупка завершена — ехать дальше",
      disabled: false,
      pickupPointId: currentStop.pickupPointId,
    }
  }

  return {
    kind: "complete",
    label: "Этап пройден — ехать дальше",
    disabled: false,
    pickupPointId: currentStop.pickupPointId,
  }
}
