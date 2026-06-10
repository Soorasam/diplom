import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { useCartStore } from "@/features/cart/model/cart-store"
import { queryKeys } from "@/shared/config/query-keys"
import { invalidateDriverWorkbench } from "@/shared/lib/invalidate-driver-workbench"
import { invalidateResidentWorkbench } from "@/shared/lib/invalidate-resident-workbench"
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
  const user = useAuthStore((s) => s.user)
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
      invalidateResidentWorkbench(qc, user?.id)
    },
  })
}

export const useReservePayment = () => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.reservePayment(orderId),
    onSuccess: (order) => {
      qc.setQueryData(queryKeys.orders.detail(order.id), order)
      invalidateResidentWorkbench(qc, user?.id)
    },
  })
}

export const useConfirmReceipt = () => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : undefined
  return useMutation({
    mutationFn: (orderId: string) => ordersApi.confirmReceipt(orderId),
    onSuccess: (order) => {
      qc.setQueryData(queryKeys.orders.detail(order.id), order)
      invalidateResidentWorkbench(qc, user?.id, driverId)
      invalidateDriverWorkbench(qc)
    },
  })
}

export const useConfirmAllReceipts = () => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async (orderIds: string[]) => {
      const results = await Promise.all(
        orderIds.map((id) => ordersApi.confirmReceipt(id)),
      )
      return results
    },
    onSuccess: (orders) => {
      for (const order of orders) {
        qc.setQueryData(queryKeys.orders.detail(order.id), order)
      }
      invalidateResidentWorkbench(qc, user?.id)
      invalidateDriverWorkbench(qc)
    },
  })
}

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : ""
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateStatus(orderId, status),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(order.id) })
      invalidateDriverWorkbench(qc, driverId)
    },
  })
}
