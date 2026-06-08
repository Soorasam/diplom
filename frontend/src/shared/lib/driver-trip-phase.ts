import type { Order, Procurement } from "@/shared/api/api-types"
import {
  ordersAtPickupPoint,
  residentDeliveryStats,
} from "@/shared/lib/driver-orders"
import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"
import type { DriverPhaseHero } from "@/shared/lib/driver-phase-hero"
import { areAllDriverStopsCompleted } from "@/shared/lib/driver-route-stops"
import { buildRouteChain } from "@/shared/lib/driver-phase-hero"

export type DriverTripContentPhase =
  | "accept_orders"
  | "waiting_close"
  | "procurement"
  | "depart"
  | "handout"
  | "close_settlement"
  | "transit"
  | "done"
  | "idle"

export type DriverTripView = {
  contentPhase: DriverTripContentPhase
  hero: DriverPhaseHero
  roundId?: string
  currentStop?: RouteDeliveryStop
  nextStop?: RouteDeliveryStop
  canCompleteStop: boolean
  pendingConfirm: boolean
}

const countTripAccepted = (orders: Order[]) =>
  orders.filter(
    (o) =>
      o.status !== "cancelled" &&
      (o.status === "confirmed" ||
        o.status === "in_transit" ||
        o.status === "at_pickup" ||
        o.status === "delivered"),
  ).length

export const buildDriverTripView = (input: {
  orders: Order[]
  awaitingAcceptCount: number
  hasOpenCollection: boolean
  activeRound?: Procurement
  deliveryRound?: Procurement
  activeRoute?: {
    name?: string
    deliveryStops?: RouteDeliveryStop[]
    activeRoundId?: string | null
  }
  deliveryStops: RouteDeliveryStop[]
  currentStop?: RouteDeliveryStop
  nextStop?: RouteDeliveryStop
  tripCompleted: boolean
  pendingConfirm: boolean
  checklistPositions?: number
  checklistPurchased?: number
}): DriverTripView => {
  const {
    orders,
    awaitingAcceptCount,
    hasOpenCollection,
    activeRound,
    deliveryRound,
    activeRoute,
    deliveryStops,
    currentStop,
    nextStop,
    tripCompleted,
    pendingConfirm,
    checklistPositions = 0,
    checklistPurchased = 0,
  } = input

  const roundId =
    activeRoute?.activeRoundId ?? deliveryRound?.id ?? activeRound?.id ?? undefined
  const routeName =
    (deliveryStops.length > 0 ? buildRouteChain(deliveryStops) : "") ||
    activeRoute?.name ||
    deliveryRound?.routeTitle ||
    deliveryRound?.title ||
    activeRound?.title ||
    "Рейс"
  const stepIndex = currentStop
    ? deliveryStops.findIndex((s) => s.pickupPointId === currentStop.pickupPointId) + 1
    : 0

  const allStopsDone = areAllDriverStopsCompleted(deliveryStops)

  if (tripCompleted || allStopsDone) {
    return {
      contentPhase: "done",
      hero: {
        phase: "route",
        phaseLabel: "Рейс",
        title: "Рейс завершён",
        subtitle: routeName,
        stats: [],
      },
      roundId,
      canCompleteStop: false,
      pendingConfirm: false,
    }
  }

  if (!currentStop && awaitingAcceptCount > 0) {
    const roundOpen = hasOpenCollection
    return {
      contentPhase: "accept_orders",
      hero: {
        phase: "orders",
        phaseLabel: "Приём в рейс",
        title: `${awaitingAcceptCount} к принятию`,
        subtitle: roundOpen
          ? activeRound?.title
          : (deliveryRound?.title ?? "Сбор закрыт — примите оплаченные заказы"),
        stats: [
          { label: "к принятию", value: String(awaitingAcceptCount) },
          { label: "принято", value: String(countTripAccepted(orders)) },
          { label: "всего", value: String(orders.filter((o) => o.status !== "cancelled").length) },
        ],
      },
      roundId,
      canCompleteStop: false,
      pendingConfirm: false,
    }
  }

  if (!currentStop && hasOpenCollection) {
    return {
      contentPhase: "waiting_close",
      hero: {
        phase: "collection_open",
        phaseLabel: activeRound?.status === "closing" ? "Сбор закрывается" : "Сбор открыт",
        title: activeRound?.title ?? "Сбор",
        subtitle: "Все оплаченные заказы приняты — ждём закрытия сбора",
        stats: [
          { label: "принято", value: String(countTripAccepted(orders)) },
          {
            label: "участников",
            value: String(activeRound?.participantsCount ?? 0),
          },
        ],
      },
      roundId,
      canCompleteStop: false,
      pendingConfirm: false,
    }
  }

  if (!currentStop) {
    if (activeRoute && deliveryStops.length > 0) {
      return {
        contentPhase: "idle",
        hero: {
          phase: "route",
          phaseLabel: "Рейс",
          title: "Маршрут готовится",
          subtitle: routeName,
          stats: [{ label: "точек", value: String(deliveryStops.length) }],
        },
        roundId,
        canCompleteStop: false,
        pendingConfirm: false,
      }
    }
    if (
      deliveryRound &&
      (deliveryRound.status === "closed" || deliveryRound.status === "shipped")
    ) {
      return {
        contentPhase: "idle",
        hero: {
          phase: "route",
          phaseLabel: "Рейс",
          title: deliveryRound.title,
          subtitle: "Этапы маршрута подгружаются — подождите несколько секунд",
          stats: [],
        },
        roundId: deliveryRound.id,
        canCompleteStop: false,
        pendingConfirm: false,
      }
    }
    return {
      contentPhase: "idle",
      hero: {
        phase: "idle",
        phaseLabel: "Рейс",
        title: "Нет активного этапа",
        subtitle: "Рейс появится после закрытия сбора",
        stats: [],
      },
      canCompleteStop: false,
      pendingConfirm: false,
    }
  }

  const canCompleteStop = Boolean(currentStop.driverCanComplete) && !pendingConfirm

  if (currentStop.isProcurementStop && !currentStop.procurementCompleted) {
    const total = checklistPositions || checklistPurchased
    return {
      contentPhase: "procurement",
      hero: {
        phase: "procurement",
        phaseLabel: "Закупка",
        title: currentStop.label,
        subtitle: "Отметьте галочкой каждую позицию",
        stats: [
          { label: "позиций", value: String(total) },
          { label: "куплено", value: `${checklistPurchased}/${total || "—"}` },
          { label: "шаг", value: `${stepIndex}/${deliveryStops.length}` },
        ],
        nextLabel: nextStop ? `Далее ${nextStop.label}` : undefined,
      },
      roundId,
      currentStop,
      nextStop,
      canCompleteStop: false,
      pendingConfirm: false,
    }
  }

  if (
    currentStop.isProcurementStop &&
    currentStop.procurementCompleted &&
    currentStop.driverCanComplete
  ) {
    return {
      contentPhase: "depart",
      hero: {
        phase: "delivery_transit",
        phaseLabel: "Готово к выезду",
        title: currentStop.label,
        subtitle: nextStop ? `Следующий пункт: ${nextStop.label}` : undefined,
        stats: [
          { label: "шаг", value: `${stepIndex}/${deliveryStops.length}` },
        ],
        nextLabel: nextStop ? `В пути в ${nextStop.label}` : undefined,
      },
      roundId,
      currentStop,
      nextStop,
      canCompleteStop: true,
      pendingConfirm: false,
    }
  }

  if (currentStop.expectsOrders) {
    const stopOrders = ordersAtPickupPoint(orders, currentStop.pickupPointId)
    const { total: residents, delivered } = residentDeliveryStats(stopOrders)
    const inSettlement = currentStop.status === "in_progress"
    const allConfirmed = residents > 0 && delivered >= residents && !pendingConfirm

    if (allConfirmed && inSettlement) {
      return {
        contentPhase: "close_settlement",
        hero: {
          phase: "delivery_stop",
          phaseLabel: "Посёлок",
          title: "Все заказы выданы",
          subtitle: `Жители ${currentStop.label} подтвердили получение — закройте посёлок`,
          stats: [
            { label: "подтвердили", value: `${delivered}/${residents}` },
            { label: "шаг", value: `${stepIndex}/${deliveryStops.length}` },
          ],
          nextLabel: nextStop
            ? `Далее ${nextStop.label}`
            : "Последняя точка маршрута",
        },
        roundId,
        currentStop,
        nextStop,
        canCompleteStop,
        pendingConfirm: false,
      }
    }

    return {
      contentPhase: inSettlement || pendingConfirm ? "handout" : "transit",
      hero: {
        phase: inSettlement ? "delivery_stop" : "delivery_transit",
        phaseLabel: inSettlement ? "Выдача" : "В пути",
        title: currentStop.label,
        subtitle: inSettlement
          ? "Обходите жителей по адресам"
          : `Едем в ${currentStop.label}`,
        stats: [
          { label: "адресов", value: String(residents) },
          { label: "подтвердили", value: `${delivered}/${residents}` },
          { label: "шаг", value: `${stepIndex}/${deliveryStops.length}` },
        ],
        nextLabel: nextStop ? `Далее ${nextStop.label}` : undefined,
      },
      roundId,
      currentStop,
      nextStop,
      canCompleteStop,
      pendingConfirm,
    }
  }

  return {
    contentPhase: "transit",
    hero: {
      phase: "route",
      phaseLabel: "Маршрут",
      title: currentStop.label,
      subtitle: stepIndex ? `Шаг ${stepIndex} из ${deliveryStops.length}` : undefined,
      stats: [],
      nextLabel: nextStop?.label,
    },
    roundId,
    currentStop,
    nextStop,
    canCompleteStop,
    pendingConfirm: false,
  }
}
