import { http } from "@/shared/api/client"
import type { Order } from "@/shared/api/mock-db"
import { mapBackendOrder } from "@/shared/api/mappers"

type PickupOrderDto = Parameters<typeof mapBackendOrder>[0] & {
  customerName?: string
  customerPhone?: string | null
}

export interface EmployeeOrderView extends Order {
  userName: string
  userPhone: string
  itemsText: string
}

export const employeeApi = {
  getPickupPointIdByEmployee: (_userId: string, pickupPointId?: string | null) =>
    Promise.resolve(pickupPointId ?? null),

  getOrdersByPickupPoint: async (pickupPointId: string) => {
    const list = await http.get<PickupOrderDto[]>(
      `/orders/pickup-point/${pickupPointId}`,
      true,
    )

    return list.map<EmployeeOrderView>((raw) => {
      const o = mapBackendOrder({
        ...raw,
        items: raw.items ?? [],
        pickupPointId: raw.pickupPointId ?? pickupPointId,
      })
      return {
        ...o,
        userName: raw.customerName ?? o.userId,
        userPhone: raw.customerPhone ?? "—",
        itemsText: o.items
          .map((i) => `${i.productName ?? i.productId} × ${i.quantity}`)
          .join(", "),
      }
    })
  },
}
