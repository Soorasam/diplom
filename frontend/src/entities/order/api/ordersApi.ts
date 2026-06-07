import { http } from "@/shared/api/client"
import {
  mapBackendOrder,
  mapFrontOrderStatusToBackend,
} from "@/shared/api/mappers"
import type { OrderStatus } from "@/shared/types"

type BackendOrderPayload = Parameters<typeof mapBackendOrder>[0]

const mapOrder = (o: BackendOrderPayload) =>
  mapBackendOrder({
    ...o,
    items: o.items ?? [],
    pickupPointId: o.pickupPointId ?? "",
    procurementId: (o as { procurementId?: string }).procurementId ?? o.roundId ?? "",
  })

export const ordersApi = {
  getByUser: async (_userId: string) => {
    const list = await http.get<BackendOrderPayload[]>("/orders", true)
    return list.map(mapOrder)
  },

  getById: async (id: string) => {
    const order = await http.get<BackendOrderPayload>(`/orders/${id}`, true)
    return mapOrder(order)
  },

  /** Checkout корзины → заказ submitted + paymentStatus pending */
  checkoutFromCart: async (procurementId: string, pickupPointId: string) => {
    const { cartApi } = await import("@/entities/cart/api/cartApi")
    await http.patch("/profile", { pickupPointId }, true)
    const created = await cartApi.checkout(procurementId)
    await cartApi.clear()
    return ordersApi.getById(created.id)
  },

  /** Эскроу: симуляция оплаты, pending → held */
  reservePayment: async (orderId: string) => {
    const order = await http.post<BackendOrderPayload>(
      `/orders/${orderId}/reserve-payment`,
      {},
      true,
    )
    return mapOrder(order)
  },

  /** Житель подтверждает получение: in_transit → delivered, held → released */
  confirmReceipt: async (orderId: string) => {
    const order = await http.post<BackendOrderPayload>(
      `/orders/${orderId}/confirm-receipt`,
      {},
      true,
    )
    return mapOrder(order)
  },

  getAll: async () => {
    const list = await http.get<BackendOrderPayload[]>("/admin/orders", true)
    return list.map(mapOrder)
  },

  updateStatus: async (id: string, status: OrderStatus) => {
    const backendStatus = mapFrontOrderStatusToBackend(status)
    const order = await http.patch<BackendOrderPayload>(
      `/orders/${id}/status`,
      { status: backendStatus },
      true,
    )
    return mapOrder(order)
  },
}
