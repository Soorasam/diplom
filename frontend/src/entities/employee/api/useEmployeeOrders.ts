import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { employeeApi } from "@/entities/employee/api/employeeApi"
import { ordersApi } from "@/entities/order/api/ordersApi"
import { useNetworkStore } from "@/features/offline/model/network-store"
import { useOfflineQueueStore } from "@/features/offline/model/offline-queue-store"
import { queryKeys } from "@/shared/config/query-keys"
import type { OrderStatus } from "@/shared/types"

export function useEmployeePickupPointId() {
  const pickupPointId = useAuthStore((s) => s.user?.pickupPointId)

  return useQuery({
    queryKey: ["employee", "pickupPointId", pickupPointId],
    queryFn: () => Promise.resolve(pickupPointId ?? null),
    enabled: Boolean(pickupPointId),
  })
}

export function useEmployeeOrders() {
  const { data: pickupPointId } = useEmployeePickupPointId()

  return useQuery({
    queryKey: queryKeys.employee.orders(pickupPointId ?? ""),
    queryFn: () => employeeApi.getOrdersByPickupPoint(pickupPointId!),
    enabled: Boolean(pickupPointId),
  })
}

function optimisticUpdateEmployeeOrder(
  qc: ReturnType<typeof useQueryClient>,
  pickupPointId: string,
  orderId: string,
  status: OrderStatus,
) {
  qc.setQueryData(queryKeys.employee.orders(pickupPointId), (old) => {
    const arr = old as Array<{ id: string; status: OrderStatus }> | undefined
    if (!arr) return old
    return arr.map((o) => (o.id === orderId ? { ...o, status } : o))
  })

  qc.setQueryData(queryKeys.orders.detail(orderId), (old) => {
    const o = old as { status: OrderStatus } | undefined
    return o ? { ...o, status } : old
  })
}

export function useEmployeeOrderStatusActions(pickupPointId?: string) {
  const qc = useQueryClient()
  const isOnline = useNetworkStore((s) => s.isOnline)
  const enqueue = useOfflineQueueStore((s) => s.enqueue)

  return useMutation({
    mutationFn: async (vars: { orderId: string; status: "at_pickup" | "delivered" }) => {
      if (!pickupPointId) throw new Error("pickupPointId not ready")

      // optimistic UI right away
      optimisticUpdateEmployeeOrder(qc, pickupPointId, vars.orderId, vars.status)

      if (!isOnline) {
        enqueue({
          type:
            vars.status === "at_pickup"
              ? "employee.order.mark_ready_for_pickup"
              : "employee.order.confirm_handover",
          payload: { orderId: vars.orderId },
        })
        return
      }

      await ordersApi.updateStatus(vars.orderId, vars.status)
    },
    onSuccess: async () => {
      if (!pickupPointId) return
      await qc.invalidateQueries({ queryKey: queryKeys.employee.orders(pickupPointId) })
      await qc.invalidateQueries({ queryKey: queryKeys.employee.workspace })
    },
  })
}

