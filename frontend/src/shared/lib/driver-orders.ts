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

export const residentDeliveryLabel = (order: Order) => {
  if (order.status === "delivered") return "Получено"
  if (order.status === "in_transit" || order.status === "at_pickup") {
    return "Ждёт подтверждения в приложении"
  }
  if (order.status === "confirmed") return "В рейсе"
  if (isAwaitingTripAccept(order)) return "Оплачен, ждёт принятия в рейс"
  return "Ожидает оплаты"
}
