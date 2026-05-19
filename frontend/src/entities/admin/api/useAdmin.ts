import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

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

export const useAdminRoutes = () =>
  useQuery({
    queryKey: queryKeys.routes.all,
    queryFn: () => adminApi.getRoutes(),
  })

export const useAdminSettlements = () =>
  useQuery({
    queryKey: [...queryKeys.admin.stats, "settlements"],
    queryFn: () => adminApi.getSettlements(),
  })

export const useAdminDrivers = () =>
  useQuery({
    queryKey: queryKeys.admin.drivers,
    queryFn: () => adminApi.getDrivers(),
  })
