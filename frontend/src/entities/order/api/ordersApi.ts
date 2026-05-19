import { apiCall } from "@/shared/api/client"
import { orders, products, type Order } from "@/shared/api/mock-db"
import type { OrderStatus } from "@/shared/types"

let ordersStore = [...orders]

export const ordersApi = {
  getByUser: (userId: string) =>
    apiCall(() => ordersStore.filter((o) => o.userId === userId)),

  getById: (id: string) =>
    apiCall(() => {
      const order = ordersStore.find((o) => o.id === id)
      if (!order) throw new Error("Заказ не найден")
      return order
    }),

  create: (payload: {
    userId: string
    procurementId: string
    pickupPointId: string
    items: { productId: string; quantity: number }[]
    comment?: string
  }) =>
    apiCall(() => {
      const items = payload.items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        }
      })
      const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
      const now = new Date().toISOString()
      const order: Order = {
        id: `ord-${Date.now()}`,
        userId: payload.userId,
        procurementId: payload.procurementId,
        status: "pending",
        items,
        pickupPointId: payload.pickupPointId,
        total,
        comment: payload.comment,
        createdAt: now,
        timeline: [
          { status: "pending", at: now, label: "Заказ создан" },
        ],
      }
      ordersStore = [order, ...ordersStore]
      return order
    }),

  getAll: () => apiCall(() => ordersStore),

  updateStatus: (id: string, status: OrderStatus) =>
    apiCall(() => {
      ordersStore = ordersStore.map((o) =>
        o.id === id
          ? {
              ...o,
              status,
              timeline: [
                ...o.timeline,
                {
                  status,
                  at: new Date().toISOString(),
                  label: statusLabel(status),
                },
              ],
            }
          : o,
      )
      return ordersStore.find((o) => o.id === id)!
    }),
}

function statusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    draft: "Черновик",
    pending: "Ожидает подтверждения",
    collecting: "В сборе",
    confirmed: "Подтверждён",
    in_transit: "В пути",
    at_pickup: "В пункте выдачи",
    delivered: "Выдан",
    cancelled: "Отменён",
  }
  return map[status]
}
