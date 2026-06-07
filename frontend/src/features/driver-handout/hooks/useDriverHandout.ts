import { useMutation, useQueryClient } from "@tanstack/react-query"

import { ordersApi } from "@/entities/order/api/ordersApi"
import { useNetworkStore } from "@/features/offline/model/network-store"
import { useOfflineQueueStore } from "@/features/offline/model/offline-queue-store"
import { queryKeys } from "@/shared/config/query-keys"

export const useDriverHandout = (driverId?: string) => {
  const qc = useQueryClient()
  const isOnline = useNetworkStore((s) => s.isOnline)
  const enqueue = useOfflineQueueStore((s) => s.enqueue)

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!isOnline) {
        enqueue({
          type: "driver.order.confirm_handout",
          payload: { orderId },
        })
        return { id: orderId, offline: true as const }
      }
      return ordersApi.updateStatus(orderId, "delivered")
    },
    onSuccess: (_data, orderId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      if (driverId) {
        void qc.invalidateQueries({
          queryKey: [...queryKeys.routes.driver(driverId), "orders"],
        })
      }
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) })
    },
  })
}
