import type { OfflineAction } from "@/features/offline/model/offline-queue-store"
import { employeeApi } from "@/entities/employee/api/employeeApi"
import { queryKeys } from "@/shared/config/query-keys"
import type { Order } from "@/shared/api/mock-db"
import type { OrderStatus } from "@/shared/types"
import type { QueryClient } from "@tanstack/react-query"

type ActionHandler = (a: OfflineAction) => Promise<void>

function setOrderStatusInCache(qc: QueryClient, orderId: string, status: OrderStatus) {
  // detail cache
  qc.setQueryData<Order>(queryKeys.orders.detail(orderId), (old) =>
    old ? { ...old, status } : old,
  )
}

export function createOfflineHandlers(qc: QueryClient): Record<string, ActionHandler> {
  return {
    "employee.order.mark_ready_for_pickup": async (a) => {
      const { orderId } = a.payload as { orderId: string }
      // optimistic cache update (kept for UI consistency)
      setOrderStatusInCache(qc, orderId, "at_pickup")
      await employeeApi.receiveFromDriver(orderId)
      void qc.invalidateQueries({ queryKey: queryKeys.employee.workspace })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
    "employee.order.confirm_handover": async (a) => {
      const { orderId } = a.payload as { orderId: string }
      setOrderStatusInCache(qc, orderId, "delivered")
      await employeeApi.handoutToResident(orderId)
      void qc.invalidateQueries({ queryKey: queryKeys.employee.workspace })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  }
}

