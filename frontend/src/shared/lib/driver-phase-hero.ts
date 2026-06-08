import type { Order, Procurement } from "@/shared/api/api-types"
import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"
import { routes } from "@/shared/config/routes"
import {
  isDelivered,
  ordersAtPickupPoint,
  residentDeliveryStats,
} from "@/shared/lib/driver-orders"

export type DriverPhaseId =
  | "idle"
  | "collection_open"
  | "collection_closing"
  | "procurement"
  | "delivery_stop"
  | "delivery_transit"
  | "pre_delivery"
  | "orders"
  | "route"

export type DriverPhaseHero = {
  phase: DriverPhaseId
  phaseLabel: string
  title: string
  subtitle?: string
  stats: { label: string; value: string }[]
  nextLabel?: string
  ctaLabel?: string
  ctaTo?: string
}

/** @deprecated use DriverPhaseHero */
export type DriverDashboardHero = DriverPhaseHero

const countActiveLineItems = (orders: Order[]) =>
  orders
    .filter((o) => !isDelivered(o) && o.status !== "cancelled")
    .reduce((sum, o) => sum + o.items.length, 0)

const countActiveOrders = (orders: Order[]) =>
  orders.filter((o) => !isDelivered(o) && o.status !== "cancelled").length

const countTripAcceptedOrders = (orders: Order[]) =>
  orders.filter(
    (o) =>
      o.status !== "cancelled" &&
      (o.status === "confirmed" ||
        o.status === "in_transit" ||
        o.status === "at_pickup" ||
        o.status === "delivered"),
  ).length

export const buildRouteChain = (stops?: RouteDeliveryStop[]) =>
  stops?.map((s) => s.label).join(" → ") ?? ""

export const buildDriverDashboardHero = (input: {
  orders: Order[]
  activeRound?: Procurement
  deliveryRound?: Procurement
  hasOpenCollection: boolean
  activeRoute?: { deliveryStops?: RouteDeliveryStop[]; name?: string }
  currentStop?: RouteDeliveryStop
  checklistItemCount?: number
  checklistPurchasedCount?: number
}): DriverPhaseHero => {
  const {
    orders,
    activeRound,
    deliveryRound,
    hasOpenCollection,
    activeRoute,
    currentStop,
    checklistItemCount = 0,
    checklistPurchasedCount = 0,
  } = input

  const stops = activeRoute?.deliveryStops ?? []
  const currentIndex = currentStop
    ? stops.findIndex((s) => s.pickupPointId === currentStop.pickupPointId)
    : -1
  const nextStop =
    currentIndex >= 0 && currentIndex < stops.length - 1
      ? stops[currentIndex + 1]
      : undefined

  if (currentStop?.isProcurementStop && !currentStop.procurementCompleted) {
    const orderCount = countActiveOrders(orders)
    const itemTotal = checklistItemCount || countActiveLineItems(orders)
    return {
      phase: "procurement",
      phaseLabel: "Закупка",
      title: currentStop.label,
      stats: [
        { label: "заказов", value: String(orderCount) },
        { label: "позиций", value: String(itemTotal) },
        { label: "куплено", value: `${checklistPurchasedCount}/${itemTotal}` },
      ],
      nextLabel: nextStop ? `Далее ${nextStop.label}…` : undefined,
      ctaLabel: "Чек-лист",
      ctaTo: routes.driver.route,
    }
  }

  if (currentStop?.expectsOrders) {
    const { total: residents, delivered } = residentDeliveryStats(
      ordersAtPickupPoint(orders, currentStop.pickupPointId),
    )
    const inSettlement = currentStop.status === "in_progress"
    return {
      phase: inSettlement ? "delivery_stop" : "delivery_transit",
      phaseLabel: inSettlement ? "В посёлке" : "В пути",
      title: currentStop.label,
      subtitle: inSettlement ? "Обход жителей по адресам" : undefined,
      stats: [
        { label: "адресов", value: String(residents) },
        { label: "доставлено", value: `${delivered}/${residents}` },
      ],
      nextLabel: nextStop ? `Далее ${nextStop.label}…` : undefined,
      ctaLabel: "Адреса",
      ctaTo: routes.driver.route,
    }
  }

  if (hasOpenCollection && activeRound) {
    const closing = activeRound.status === "closing"
    return {
      phase: closing ? "collection_closing" : "collection_open",
      phaseLabel: closing ? "Сбор закрывается" : "Сбор открыт",
      title: activeRound.title,
      stats: [
        { label: "участников", value: String(activeRound.participantsCount) },
        {
          label: "вес",
          value: `${activeRound.currentWeightKg.toFixed(0)}/${activeRound.targetWeightKg.toFixed(0)} кг`,
        },
        {
          label: "подтверждено",
          value: String(countTripAcceptedOrders(orders)),
        },
      ],
      ctaLabel: "Текущий сбор",
      ctaTo: routes.driver.procurements,
    }
  }

  if (deliveryRound && !activeRoute) {
    return {
      phase: "pre_delivery",
      phaseLabel: "После закрытия",
      title: deliveryRound.title,
      subtitle:
        deliveryRound.routeTitle?.trim() || "Закупка и доставка по маршруту",
      stats: [
        { label: "заказов", value: String(countActiveOrders(orders)) },
        { label: "позиций", value: String(countActiveLineItems(orders)) },
      ],
      ctaLabel: "Заказы по НП",
      ctaTo: routes.driver.route,
    }
  }

  return {
    phase: "idle",
    phaseLabel: "Нет активного сбора",
    title: "Создайте сбор",
    subtitle: "Укажите маршрут и откройте приём заказов",
    stats: [],
    ctaLabel: "Перейти к сборам",
    ctaTo: routes.driver.procurements,
  }
}

export const buildOrdersPageHero = (input: {
  orders: Order[]
  awaitingAcceptCount: number
  inTransitCount: number
  settlementCount: number
}): DriverPhaseHero => {
  const activeCount = countActiveOrders(input.orders)
  return {
    phase: "orders",
    phaseLabel: "Заказы",
    title:
      input.awaitingAcceptCount > 0
        ? `${input.awaitingAcceptCount} к принятию в рейс`
        : `${activeCount} активных заказов`,
    subtitle: "По посёлкам в порядке маршрута",
    stats: [
      { label: "к принятию", value: String(input.awaitingAcceptCount) },
      { label: "в доставке", value: String(input.inTransitCount) },
      { label: "посёлков", value: String(input.settlementCount) },
    ],
    ctaLabel: "Рейс",
    ctaTo: routes.driver.route,
  }
}

export const buildRoutePageHero = (input: {
  routeName: string
  currentStop?: RouteDeliveryStop
  step?: number
  totalSteps?: number
  nextStopLabel?: string
}): DriverPhaseHero => {
  const { currentStop, step, totalSteps, nextStopLabel, routeName } = input

  if (!currentStop) {
    return {
      phase: "route",
      phaseLabel: "Рейс",
      title: routeName,
      subtitle: "Все этапы пройдены",
      stats: [],
    }
  }

  const inSettlement = currentStop.status === "in_progress"
  const phaseLabel = currentStop.isProcurementStop
    ? "Закупка"
    : inSettlement
      ? "В посёлке"
      : "В пути"

  return {
    phase: "route",
    phaseLabel,
    title: currentStop.label,
    subtitle:
      step && totalSteps ? `Шаг ${step} из ${totalSteps}` : routeName,
    stats: currentStop.expectsOrders
      ? [
          { label: "адресов", value: String(currentStop.totalOrders ?? 0) },
          {
            label: "доставлено",
            value: `${currentStop.receivedOrders ?? 0}/${currentStop.totalOrders ?? 0}`,
          },
        ]
      : [],
    nextLabel: nextStopLabel ? `Далее ${nextStopLabel}…` : undefined,
    ctaLabel: "Заказы",
    ctaTo: routes.driver.route,
  }
}

export const buildProcurementsPageHero = (
  activeRound: Procurement | undefined,
  deliveryRound: Procurement | undefined,
  orderCount: number,
): DriverPhaseHero => {
  if (activeRound) {
    const closing = activeRound.status === "closing"
    return {
      phase: closing ? "collection_closing" : "collection_open",
      phaseLabel: closing ? "Сбор закрывается" : "Текущий сбор",
      title: activeRound.title,
      stats: [
        { label: "участников", value: String(activeRound.participantsCount) },
        {
          label: "вес",
          value: `${activeRound.currentWeightKg.toFixed(0)}/${activeRound.targetWeightKg.toFixed(0)} кг`,
        },
        { label: "заказов", value: String(orderCount) },
      ],
      ctaLabel: "Заказы жителей",
      ctaTo: routes.driver.route,
    }
  }

  if (deliveryRound) {
    return {
      phase: "pre_delivery",
      phaseLabel: "Доставка",
      title: deliveryRound.title,
      subtitle: "Сбор закрыт — завершите выдачу",
      stats: [{ label: "заказов", value: String(orderCount) }],
      ctaLabel: "Рейс",
      ctaTo: routes.driver.route,
    }
  }

  return {
    phase: "idle",
    phaseLabel: "Новый сбор",
    title: "Создайте маршрут",
    subtitle: "Укажите посёлки и откройте приём заказов",
    stats: [],
  }
}
