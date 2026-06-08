import type { Order, Procurement, ProcurementRouteProgressStop } from "@/shared/api/api-types"

export type ResidentPhaseId =
  | "browse"
  | "collection_open"
  | "collection_closing"
  | "pay_order"
  | "awaiting_accept"
  | "procurement"
  | "in_transit"
  | "soon_delivery"
  | "at_settlement"
  | "delivered"

export type ResidentPhaseStep = {
  id: string
  label: string
  shortLabel: string
  status: "done" | "active" | "pending"
}

const COLLECTION_STEPS: ResidentPhaseStep[] = [
  { id: "collection", label: "Сбор", shortLabel: "Сбор", status: "pending" },
  { id: "pay", label: "Оплата", shortLabel: "Оплата", status: "pending" },
  { id: "procurement", label: "Закупка", shortLabel: "Закупка", status: "pending" },
  { id: "transit", label: "В пути", shortLabel: "Путь", status: "pending" },
  { id: "delivery", label: "Выдача", shortLabel: "Выдача", status: "pending" },
]

export type ResidentPhaseView = {
  phaseId: ResidentPhaseId
  headline: string
  subline?: string
  steps: ResidentPhaseStep[]
  currentLocationLabel?: string
}

type Input = {
  procurement?: Procurement
  orders?: Order[]
  settlementName?: string | null
  userPickupPointId?: string | null
  routeProgress?: ProcurementRouteProgressStop[]
}

const activeOrders = (orders: Order[]) =>
  orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled")

const confirmableOrders = (orders: Order[]) =>
  orders.filter((o) => o.status === "in_transit" || o.status === "at_pickup")

const buildRouteSteps = (
  progress: ProcurementRouteProgressStop[],
  userPickupPointId?: string | null,
): ResidentPhaseStep[] => {
  const currentIndex = progress.findIndex((s) => s.status !== "completed")

  return progress.map((stop, index) => {
    const isUserStop = Boolean(
      userPickupPointId && stop.pickupPointId === userPickupPointId,
    )
    const shortLabel = stop.isProcurementStop
      ? "Закупка"
      : isUserStop
        ? "Ваш НП"
        : stop.label.length > 8
          ? `${stop.label.slice(0, 7)}…`
          : stop.label

    let status: ResidentPhaseStep["status"] = "pending"
    if (stop.status === "completed") status = "done"
    else if (index === currentIndex) status = "active"
    else if (stop.status === "in_progress") status = "active"

    return {
      id: stop.pickupPointId,
      label: stop.label,
      shortLabel,
      status,
    }
  })
}

const resolveRoutePhase = (
  progress: ProcurementRouteProgressStop[],
  orders: Order[],
  np: string,
  userPickupPointId?: string | null,
): ResidentPhaseView | null => {
  const userStopIndex = userPickupPointId
    ? progress.findIndex((s) => s.pickupPointId === userPickupPointId)
    : -1
  const currentIndex = progress.findIndex((s) => s.status !== "completed")
  const currentStop = currentIndex >= 0 ? progress[currentIndex] : undefined
  const userStop = userStopIndex >= 0 ? progress[userStopIndex] : undefined
  const steps = buildRouteSteps(progress, userPickupPointId)
  const toConfirm = confirmableOrders(orders)

  if (orders.length > 0 && orders.every((o) => o.status === "delivered")) {
    return {
      phaseId: "delivered",
      headline: "Заказы получены",
      subline: `${orders.length} заказ(ов) в этом сборе`,
      steps: steps.map((s) => ({ ...s, status: "done" as const })),
    }
  }

  if (toConfirm.length > 0) {
    return {
      phaseId: "at_settlement",
      headline: "Подтвердите получение",
      subline:
        toConfirm.length > 1
          ? `${toConfirm.length} заказа — одной кнопкой ниже`
          : "Водитель вручил заказ — подтвердите в приложении",
      steps,
      currentLocationLabel: np,
    }
  }

  if (userStop?.status === "in_progress") {
    return {
      phaseId: "soon_delivery",
      headline: "Скоро выдача",
      subline: `Водитель в ${np} — ожидайте по адресу`,
      steps,
      currentLocationLabel: np,
    }
  }

  if (userStop?.status === "completed") {
    return {
      phaseId: "delivered",
      headline: "Посёлок пройден",
      subline: "Заказ доставлен или в процессе подтверждения",
      steps,
    }
  }

  if (currentStop?.isProcurementStop && currentStop.status !== "completed") {
    return {
      phaseId: "procurement",
      headline: "Закупка",
      subline: `Водитель закупает товары · сейчас ${currentStop.label}`,
      steps,
      currentLocationLabel: currentStop.label,
    }
  }

  if (currentStop && userStopIndex >= 0 && currentIndex < userStopIndex) {
    return {
      phaseId: "in_transit",
      headline: `В пути в ${np}`,
      subline: `Сейчас: ${currentStop.label}`,
      steps,
      currentLocationLabel: currentStop.label,
    }
  }

  if (currentStop && userStopIndex < 0) {
    return {
      phaseId: "in_transit",
      headline: "Доставка по маршруту",
      subline: `Сейчас: ${currentStop.label}`,
      steps,
      currentLocationLabel: currentStop.label,
    }
  }

  return {
    phaseId: "in_transit",
    headline: `Ожидайте доставку в ${np}`,
    subline: currentStop ? `Маршрут: сейчас ${currentStop.label}` : undefined,
    steps,
    currentLocationLabel: currentStop?.label,
  }
}

export const getResidentProcurementPhase = ({
  procurement,
  orders = [],
  settlementName,
  userPickupPointId,
  routeProgress,
}: Input): ResidentPhaseView => {
  const np = settlementName ?? orders[0]?.settlementName ?? "посёлке"
  const active = activeOrders(orders)
  const primary = active[0] ?? orders[0]
  const progress = routeProgress ?? procurement?.routeProgress

  if (progress && progress.length > 0) {
    const routeView = resolveRoutePhase(progress, orders, np, userPickupPointId)
    if (routeView) return routeView
  }

  const steps = COLLECTION_STEPS.map((s) => ({ ...s }))

  if (!procurement) {
    return {
      phaseId: "browse",
      headline: "Выберите сбор",
      subline: "Вступите в активный сбор вашего посёлка",
      steps: steps.map((s, i) => ({
        ...s,
        status: (i === 0 ? "active" : "pending") as ResidentPhaseStep["status"],
      })),
    }
  }

  const markStep = (index: number) =>
    steps.map((s, i) => ({
      ...s,
      status: (i < index ? "done" : i === index ? "active" : "pending") as ResidentPhaseStep["status"],
    }))

  if (orders.length > 0 && orders.every((o) => o.status === "delivered")) {
    return {
      phaseId: "delivered",
      headline: "Заказы получены",
      steps: markStep(steps.length - 1).map((s) => ({ ...s, status: "done" as const })),
    }
  }

  const toConfirm = confirmableOrders(orders)
  if (toConfirm.length > 0) {
    return {
      phaseId: "at_settlement",
      headline: "Подтвердите получение",
      subline:
        toConfirm.length > 1
          ? `${toConfirm.length} заказа — подтвердите одной кнопкой`
          : "Водитель вручил заказ",
      steps: markStep(4),
    }
  }

  if (primary?.status === "in_transit") {
    return {
      phaseId: "in_transit",
      headline: `В пути в ${np}`,
      subline: "Водитель везёт заказ по маршруту",
      steps: markStep(3),
    }
  }

  if (primary?.status === "at_pickup") {
    return {
      phaseId: "soon_delivery",
      headline: "Скоро выдача",
      subline: `Водитель в ${np}`,
      steps: markStep(4),
    }
  }

  if (
    primary &&
    primary.paymentStatus === "held" &&
    (primary.status === "pending" || primary.status === "confirmed")
  ) {
    const closed = procurement.status === "closed" || procurement.status === "shipped"
    if (closed && primary.status === "confirmed") {
      return {
        phaseId: "procurement",
        headline: "Закупка",
        subline: "Водитель закупает товары для вашего заказа",
        steps: markStep(2),
      }
    }
    return {
      phaseId: "awaiting_accept",
      headline: closed ? "Закупка скоро" : "Оплачен",
      subline: closed
        ? "Водитель готовится к закупке"
        : "Примут в рейс после закрытия сбора",
      steps: markStep(closed ? 2 : 1),
    }
  }

  if (primary?.paymentStatus === "pending") {
    return {
      phaseId: "pay_order",
      headline: "Оплатите заказ",
      subline: active.length > 1 ? `${active.length} неоплаченных заказа` : undefined,
      steps: markStep(1),
    }
  }

  if (procurement.status === "closing") {
    return {
      phaseId: "collection_closing",
      headline: "Сбор закрывается",
      subline: "Успейте оформить и оплатить заказ",
      steps: markStep(0),
    }
  }

  if (procurement.status === "open") {
    return {
      phaseId: "collection_open",
      headline: "Сбор открыт",
      subline: "Выберите товары в каталоге",
      steps: markStep(0),
    }
  }

  if (procurement.status === "closed" || procurement.status === "shipped") {
    return {
      phaseId: "procurement",
      headline: orders.length ? "Закупка и доставка" : "Сбор завершён",
      subline: orders.length
        ? "Водитель закупает и везёт по маршруту"
        : "Вы не оформили заказ в этом сборе",
      steps: markStep(orders.length ? 2 : 0),
    }
  }

  return {
    phaseId: "collection_open",
    headline: procurement.title,
    steps: markStep(0),
  }
}
