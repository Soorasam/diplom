import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { ordersApi } from "./ordersApi"

export const useOrders = (userId?: string) =>
  useQuery({
    queryKey: queryKeys.orders.list(userId),
    queryFn: () => ordersApi.getByUser(userId!),
    enabled: Boolean(userId),
  })

export const useOrder = (id: string) =>
  useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: Boolean(id),
  })

export const useCreateOrder = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
    },
  })
}
