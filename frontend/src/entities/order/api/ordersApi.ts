import { http } from "@/shared/api/client"
import {
  mapBackendOrder,
  mapFrontOrderStatusToBackend,
} from "@/shared/api/mappers"
import type { OrderStatus } from "@/shared/types"

export const ordersApi = {
  getByUser: async (_userId: string) => {
    const list = await http.get<Parameters<typeof mapBackendOrder>[0][]>("/orders", true)
    return list.map((o) =>
      mapBackendOrder({
        ...o,
        items: o.items ?? [],
        pickupPointId: o.pickupPointId ?? "",
        procurementId: o.procurementId ?? o.roundId ?? "",
      }),
    )
  },

  getById: async (id: string) => {
    const order = await http.get<Parameters<typeof mapBackendOrder>[0]>(`/orders/${id}`, true)
    return mapBackendOrder(order)
  },

  create: async (payload: {
    userId: string
    procurementId: string
    pickupPointId: string
    items: { productId: string; quantity: number }[]
    comment?: string
  }) => {
    const { cartApi } = await import("@/entities/cart/api/cartApi")
    await cartApi.clear()
    for (const item of payload.items) {
      await cartApi.addItem(item.productId, item.quantity, payload.procurementId)
    }
    const { http: h } = await import("@/shared/api/client")
    await h.patch("/profile", { pickupPointId: payload.pickupPointId }, true)
    const created = await cartApi.checkout(payload.procurementId)
    return ordersApi.getById(created.id)
  },

  getAll: async () => {
    const list = await http.get<Parameters<typeof mapBackendOrder>[0][]>("/admin/orders", true)
    return list.map(mapBackendOrder)
  },

  updateStatus: async (id: string, status: OrderStatus) => {
    const backendStatus = mapFrontOrderStatusToBackend(status)
    const order = await http.patch<Parameters<typeof mapBackendOrder>[0]>(
      `/orders/${id}/status`,
      { status: backendStatus },
      true,
    )
    return mapBackendOrder(order)
  },
}
