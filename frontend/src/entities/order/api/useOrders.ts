import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useCartStore } from "@/features/cart/model/cart-store"
import { queryKeys } from "@/shared/config/query-keys"
import type { OrderStatus } from "@/shared/types"

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

export const useCheckoutFromCart = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      procurementId,
      pickupPointId,
      comment,
    }: {
      procurementId: string
      pickupPointId: string
      comment?: string
    }) => ordersApi.checkoutFromCart(procurementId, pickupPointId, comment),
    onSuccess: (order) => {
      useCartStore.getState().reset()
      qc.setQueryData(queryKeys.orders.detail(order.id), order)
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
    },
  })
}

export const useReservePayment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.reservePayment(orderId),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
    },
  })
}

export const useConfirmReceipt = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.confirmReceipt(orderId),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) })
    },
  })
}

export const useConfirmAllReceipts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderIds: string[]) => {
      const results = await Promise.all(
        orderIds.map((id) => ordersApi.confirmReceipt(id)),
      )
      return results
    },
    onSuccess: (orders) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      for (const order of orders) {
        void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) })
      }
    },
  })
}

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) })
      void qc.invalidateQueries({ queryKey: ["routes", "driver"] })
    },
  })
}
