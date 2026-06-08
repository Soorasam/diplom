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
  { id: "transit", label: "В пути", shortLabel: "В пути", status: "pending" },
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

const isPaymentDone = (orders: Order[]) =>
  orders.some(
    (o) =>
      o.status !== "cancelled" &&
      (o.paymentStatus === "held" ||
        o.paymentStatus === "released" ||
        o.status === "confirmed" ||
        o.status === "in_transit" ||
        o.status === "at_pickup" ||
        o.status === "delivered"),
  )

type CollectionStepOptions = {
  paymentDone?: boolean
  stepOverrides?: Partial<Record<number, Pick<ResidentPhaseStep, "label" | "shortLabel">>>
}

const markCollectionSteps = (
  activeIndex: number,
  options?: CollectionStepOptions,
): ResidentPhaseStep[] =>
  COLLECTION_STEPS.map((s, i) => {
    let step: ResidentPhaseStep = { ...s, ...options?.stepOverrides?.[i] }
    if (options?.paymentDone && i === 1) {
      step = { ...step, label: "Оплачено", shortLabel: "Оплачено" }
    }
    return {
      ...step,
      status: (i < activeIndex
        ? "done"
        : i === activeIndex
          ? "active"
          : "pending") as ResidentPhaseStep["status"],
    }
  })

type RoutePhaseMeta = Omit<ResidentPhaseView, "steps"> & { collectionStepIndex: number }

const resolveRoutePhaseMeta = (
  progress: ProcurementRouteProgressStop[],
  orders: Order[],
  np: string,
  userPickupPointId?: string | null,
): RoutePhaseMeta | null => {
  const userStopIndex = userPickupPointId
    ? progress.findIndex((s) => s.pickupPointId === userPickupPointId)
    : -1
  const currentIndex = progress.findIndex((s) => s.status !== "completed")
  const currentStop = currentIndex >= 0 ? progress[currentIndex] : undefined
  const userStop = userStopIndex >= 0 ? progress[userStopIndex] : undefined
  const toConfirm = confirmableOrders(orders)
  const routeStillActive = progress.some((s) => s.status !== "completed")
  const paymentDone = isPaymentDone(orders)

  if (orders.length > 0 && orders.every((o) => o.status === "delivered")) {
    return {
      phaseId: "delivered",
      headline: "Заказы получены",
      subline: routeStillActive
        ? `Водитель продолжает маршрут${currentStop ? ` · сейчас ${currentStop.label}` : ""}`
        : `${orders.length} заказ(ов) в этом сборе`,
      collectionStepIndex: 4,
      currentLocationLabel: routeStillActive ? currentStop?.label : undefined,
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
      collectionStepIndex: 4,
      currentLocationLabel: np,
    }
  }

  if (userStop?.status === "in_progress") {
    return {
      phaseId: "soon_delivery",
      headline: "Скоро выдача",
      subline: `Водитель в ${np} — ожидайте по адресу`,
      collectionStepIndex: 4,
      currentLocationLabel: np,
    }
  }

  if (userStop?.status === "completed") {
    return {
      phaseId: "delivered",
      headline: "Ваш посёлок пройден",
      subline: routeStillActive
        ? `Водитель продолжает маршрут${currentStop ? ` · сейчас ${currentStop.label}` : ""}`
        : "Заказы получены",
      collectionStepIndex: 4,
      currentLocationLabel: routeStillActive ? currentStop?.label : undefined,
    }
  }

  if (currentStop?.isProcurementStop && currentStop.status !== "completed") {
    return {
      phaseId: "procurement",
      headline: "Закупка",
      subline: `Водитель закупает товары · сейчас ${currentStop.label}`,
      collectionStepIndex: 2,
      currentLocationLabel: currentStop.label,
    }
  }

  if (currentStop && userStopIndex >= 0 && currentIndex < userStopIndex) {
    return {
      phaseId: "in_transit",
      headline: `В пути в ${np}`,
      subline: `Сейчас: ${currentStop.label}`,
      collectionStepIndex: 3,
      currentLocationLabel: currentStop.label,
    }
  }

  if (currentStop && userStopIndex < 0) {
    return {
      phaseId: "in_transit",
      headline: "Доставка по маршруту",
      subline: `Сейчас: ${currentStop.label}`,
      collectionStepIndex: 3,
      currentLocationLabel: currentStop.label,
    }
  }

  return {
    phaseId: "in_transit",
    headline: `Ожидайте доставку в ${np}`,
    subline: currentStop ? `Маршрут: сейчас ${currentStop.label}` : undefined,
    collectionStepIndex: paymentDone ? 3 : 2,
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
  const paymentDone = isPaymentDone(orders)

  if (progress && progress.length > 0) {
    const meta = resolveRoutePhaseMeta(progress, orders, np, userPickupPointId)
    if (meta) {
      const { collectionStepIndex, ...view } = meta
      const allDelivered = orders.length > 0 && orders.every((o) => o.status === "delivered")
      const routeStillActive = progress.some((s) => s.status !== "completed")
      const steps = markCollectionSteps(collectionStepIndex, { paymentDone })
      return {
        ...view,
        steps:
          allDelivered && !routeStillActive
            ? steps.map((s) => ({ ...s, status: "done" as const }))
            : steps,
      }
    }
  }

  if (!procurement) {
    return {
      phaseId: "browse",
      headline: "Выберите сбор",
      subline: "Вступите в активный сбор вашего посёлка",
      steps: markCollectionSteps(0),
    }
  }

  if (orders.length > 0 && orders.every((o) => o.status === "delivered")) {
    const routeDone = procurement.status === "shipped"
    return {
      phaseId: "delivered",
      headline: "Заказы получены",
      subline: routeDone ? undefined : "Водитель завершает доставку по маршруту",
      steps: routeDone
        ? markCollectionSteps(4, { paymentDone }).map((s) => ({
            ...s,
            status: "done" as const,
          }))
        : markCollectionSteps(4, { paymentDone }),
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
      steps: markCollectionSteps(4, { paymentDone }),
    }
  }

  if (primary?.status === "in_transit") {
    return {
      phaseId: "in_transit",
      headline: `В пути в ${np}`,
      subline: "Водитель везёт заказ по маршруту",
      steps: markCollectionSteps(3, { paymentDone }),
    }
  }

  if (primary?.status === "at_pickup") {
    return {
      phaseId: "soon_delivery",
      headline: "Скоро выдача",
      subline: `Водитель в ${np}`,
      steps: markCollectionSteps(4, { paymentDone }),
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
        steps: markCollectionSteps(2, { paymentDone }),
      }
    }
    return {
      phaseId: "awaiting_accept",
      headline: closed ? "Закупка скоро" : "Оплачен",
      subline: closed
        ? "Водитель готовится к закупке"
        : "Примут в рейс после закрытия сбора",
      steps: markCollectionSteps(2, {
        paymentDone: true,
        stepOverrides: closed
          ? undefined
          : { 2: { label: "Ожидание", shortLabel: "Ожидание" } },
      }),
    }
  }

  if (primary?.paymentStatus === "pending") {
    return {
      phaseId: "pay_order",
      headline: "Оплатите заказ",
      subline: active.length > 1 ? `${active.length} неоплаченных заказа` : undefined,
      steps: markCollectionSteps(1),
    }
  }

  if (procurement.status === "closing") {
    return {
      phaseId: "collection_closing",
      headline: "Сбор закрывается",
      subline: "Успейте оформить и оплатить заказ",
      steps: markCollectionSteps(0),
    }
  }

  if (procurement.status === "open") {
    return {
      phaseId: "collection_open",
      headline: "Сбор открыт",
      subline: "Выберите товары в каталоге",
      steps: markCollectionSteps(0),
    }
  }

  if (procurement.status === "closed" || procurement.status === "shipped") {
    return {
      phaseId: "procurement",
      headline: orders.length ? "Закупка и доставка" : "Сбор завершён",
      subline: orders.length
        ? "Водитель закупает и везёт по маршруту"
        : "Вы не оформили заказ в этом сборе",
      steps: markCollectionSteps(orders.length ? 2 : 0, { paymentDone }),
    }
  }

  return {
    phaseId: "collection_open",
    headline: procurement.title,
    steps: markCollectionSteps(0),
  }
}
