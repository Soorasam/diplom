import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"
import type { OrderStatus } from "@/shared/types"

import { adminApi } from "./adminApi"

export const useAdminStats = () =>
  useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: () => adminApi.getStats(),
  })

export const useAdminUsers = () =>
  useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: () => adminApi.getUsers(),
  })

export const useAdminOrders = () =>
  useQuery({
    queryKey: [...queryKeys.admin.stats, "orders"],
    queryFn: () => adminApi.getOrders(),
  })

export const useAdminProducts = () =>
  useQuery({
    queryKey: [...queryKeys.admin.stats, "products"],
    queryFn: () => adminApi.getProducts(),
  })

export const useAdminSettlements = () =>
  useQuery({
    queryKey: [...queryKeys.admin.stats, "settlements"],
    queryFn: () => adminApi.getSettlements(),
  })

export const useCreateSettlement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: adminApi.createSettlement,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...queryKeys.admin.stats, "settlements"] })
      void qc.invalidateQueries({ queryKey: ["settlements", "catalog"] })
      void qc.invalidateQueries({ queryKey: queryKeys.settlements })
    },
  })
}

export const useAdminDrivers = () =>
  useQuery({
    queryKey: queryKeys.admin.drivers,
    queryFn: () => adminApi.getDrivers(),
  })

export const useAdminDriver = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.admin.driver(id ?? ""),
    queryFn: () => adminApi.getDriver(id!),
    enabled: Boolean(id),
  })

export const useAdminRounds = () =>
  useQuery({
    queryKey: [...queryKeys.admin.stats, "rounds"],
    queryFn: () => adminApi.getRounds(),
  })

export const useUpdateAdminOrderStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      adminApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...queryKeys.admin.stats, "orders"] })
    },
  })
}
