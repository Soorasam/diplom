import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { employeeApi } from "@/entities/employee/api/employeeApi"
import { useNetworkStore } from "@/features/offline/model/network-store"
import { useOfflineQueueStore } from "@/features/offline/model/offline-queue-store"
import { queryKeys } from "@/shared/config/query-keys"

export function useEmployeeWorkspace() {
  return useQuery({
    queryKey: queryKeys.employee.workspace,
    queryFn: () => employeeApi.getWorkspace(),
    refetchInterval: (query) => {
      const stats = query.state.data?.stats
      if (stats?.awaitingDriver || stats?.awaitingDispatch) return 5000
      return false
    },
  })
}

export function useEmployeeReceive() {
  const qc = useQueryClient()
  const isOnline = useNetworkStore((s) => s.isOnline)
  const enqueue = useOfflineQueueStore((s) => s.enqueue)

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!isOnline) {
        enqueue({
          type: "employee.order.mark_ready_for_pickup",
          payload: { orderId },
        })
        return { stopCompleted: false, roundDeliveryCompleted: false }
      }
      return employeeApi.receiveFromDriver(orderId)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employee.workspace })
      void qc.invalidateQueries({ queryKey: ["routes", "driver"] })
    },
  })
}

export function useEmployeeHandout() {
  const qc = useQueryClient()
  const isOnline = useNetworkStore((s) => s.isOnline)
  const enqueue = useOfflineQueueStore((s) => s.enqueue)

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!isOnline) {
        enqueue({
          type: "employee.order.confirm_handover",
          payload: { orderId },
        })
        return
      }
      return employeeApi.handoutToResident(orderId)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.employee.workspace })
    },
  })
}
