import { http } from "@/shared/api/client"
import type { Order } from "@/shared/api/mock-db"
import { mapBackendOrder } from "@/shared/api/mappers"

export interface EmployeeOrderView extends Order {
  userName: string
  userPhone: string
  itemsText: string
}

export const employeeApi = {
  getPickupPointIdByEmployee: (_userId: string, pickupPointId?: string | null) =>
    Promise.resolve(pickupPointId ?? null),

  getOrdersByPickupPoint: async (pickupPointId: string) => {
    const list = await http.get<Parameters<typeof mapBackendOrder>[0][]>(
      `/orders/pickup-point/${pickupPointId}`,
      true,
    )

    return list
      .map((o) => mapBackendOrder({ ...o, items: o.items ?? [], pickupPointId: o.pickupPointId ?? pickupPointId }))
      .filter((o) => o.status === "at_pickup" || o.status === "delivered")
      .map<EmployeeOrderView>((o) => ({
        ...o,
        userName: o.userId,
        userPhone: "—",
        itemsText: o.items
          .map((i) => `${i.productId.slice(0, 8)}… × ${i.quantity}`)
          .join(", "),
      }))
  },
}
