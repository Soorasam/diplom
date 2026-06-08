import type { Order } from "@/shared/api/api-types"

export const isAwaitingTripAccept = (order: Order) =>
  order.status === "pending" && order.paymentStatus === "held"

export const isActiveForDelivery = (order: Order) =>
  order.status === "confirmed" ||
  order.status === "in_transit" ||
  order.status === "at_pickup"

export const isDelivered = (order: Order) => order.status === "delivered"

export const groupOrdersBySettlement = (orders: Order[]) => {
  const map = new Map<string, Order[]>()
  for (const order of orders) {
    const key = order.pickupPointId || "unknown"
    const list = map.get(key) ?? []
    list.push(order)
    map.set(key, list)
  }
  return map
}

export const ordersAtPickupPoint = (orders: Order[], pickupPointId: string) =>
  orders.filter(
    (o) => o.pickupPointId === pickupPointId && o.status !== "cancelled",
  )

/** Адреса = уникальные жители; доставлено = все заказы жителя получены */
export const residentDeliveryStats = (orders: Order[]) => {
  const groups = groupOrdersByResident(
    orders.filter((o) => o.status !== "cancelled"),
  )
  const delivered = groups.filter((g) => g.every(isDelivered)).length
  return { total: groups.length, delivered }
}

/** Один житель — одна карточка, даже если оформил несколько заказов */
export const groupOrdersByResident = (orders: Order[]): Order[][] => {
  const map = new Map<string, Order[]>()
  for (const order of orders) {
    const key = order.userId || order.id
    const list = map.get(key) ?? []
    list.push(order)
    map.set(key, list)
  }
  return [...map.values()]
}

export const residentGroupDeliveryLabel = (orders: Order[]) => {
  if (orders.every(isDelivered)) return "Получено"
  if (orders.some((o) => o.status === "in_transit" || o.status === "at_pickup")) {
    return "Ждёт подтверждения в приложении"
  }
  if (orders.every((o) => o.status === "confirmed")) return "В рейсе"
  if (orders.some(isAwaitingTripAccept)) return "Оплачен, ждёт принятия в рейс"
  return "Ожидает оплаты"
}

export const residentGroupDeliveryShortLabel = (orders: Order[]) => {
  if (orders.every(isDelivered)) return "Получен"
  if (orders.some((o) => o.status === "in_transit" || o.status === "at_pickup")) {
    return "Ждёт"
  }
  if (orders.every((o) => o.status === "confirmed")) return "В рейсе"
  if (orders.some(isAwaitingTripAccept)) return "К приёму"
  return "Не оплачен"
}

export const residentDeliveryLabel = (order: Order) => {
  if (order.status === "delivered") return "Получено"
  if (order.status === "in_transit" || order.status === "at_pickup") {
    return "Ждёт подтверждения в приложении"
  }
  if (order.status === "confirmed") return "В рейсе"
  if (isAwaitingTripAccept(order)) return "Оплачен, ждёт принятия в рейс"
  return "Ожидает оплаты"
}

/** Короткая подпись для бейджа в углу карточки */
export const residentDeliveryShortLabel = (order: Order) => {
  if (order.status === "delivered") return "Получен"
  if (order.status === "in_transit" || order.status === "at_pickup") return "Ждёт"
  if (order.status === "confirmed") return "В рейсе"
  if (isAwaitingTripAccept(order)) return "К приёму"
  return "Не оплачен"
}
