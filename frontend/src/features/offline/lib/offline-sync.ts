import type { OfflineAction } from "@/features/offline/model/offline-queue-store"
import { ordersApi } from "@/entities/order/api/ordersApi"
import { queryKeys } from "@/shared/config/query-keys"
import type { Order } from "@/shared/api/api-types"
import type { OrderStatus } from "@/shared/types"
import type { QueryClient } from "@tanstack/react-query"

type ActionHandler = (a: OfflineAction) => Promise<void>

function setOrderStatusInCache(qc: QueryClient, orderId: string, status: OrderStatus) {
  qc.setQueryData<Order>(queryKeys.orders.detail(orderId), (old) =>
    old ? { ...old, status } : old,
  )
}

export function createOfflineHandlers(qc: QueryClient): Record<string, ActionHandler> {
  return {
    "driver.order.confirm_handout": async (a) => {
      const { orderId } = a.payload as { orderId: string }
      setOrderStatusInCache(qc, orderId, "delivered")
      await ordersApi.updateStatus(orderId, "delivered")
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  }
}
