import { apiCall } from "@/shared/api/client"
import {
  orders,
  pvzEmployees,
  users,
  products,
  type Order,
} from "@/shared/api/mock-db"

let ordersStore = [...orders]

export interface EmployeeOrderView extends Order {
  userName: string
  userPhone: string
  itemsText: string
}

export const employeeApi = {
  getPickupPointIdByEmployee: (userId: string) =>
    apiCall(() => pvzEmployees.find((x) => x.userId === userId)?.pickupPointId),

  getOrdersByPickupPoint: (pickupPointId: string) =>
    apiCall(() => {
      const list = ordersStore
        .filter((o) => o.pickupPointId === pickupPointId)
        // Employee работает только с выдачей: показываем то, что уже в ПВЗ / выдано
        .filter((o) => o.status === "at_pickup" || o.status === "delivered")

      return list.map<EmployeeOrderView>((o) => {
        const user = users.find((u) => u.id === o.userId)
        const itemsText = o.items
          .map((i) => {
            const p = products.find((x) => x.id === i.productId)
            return `${p?.name ?? i.productId} × ${i.quantity}`
          })
          .join(", ")
        return {
          ...o,
          userName: user?.name ?? o.userId,
          userPhone: user?.phone ?? "—",
          itemsText,
        }
      })
    }),
}

