import type { Order } from "@/shared/api/api-types"

export const orderRefundAmount = (order: Pick<Order, "refundAmount">) =>
  order.refundAmount && order.refundAmount > 0 ? order.refundAmount : 0

export const orderNetAmount = (order: Pick<Order, "netTotal" | "total" | "refundAmount">) => {
  if (order.netTotal != null && order.netTotal > 0) return order.netTotal
  const refund = orderRefundAmount(order)
  if (refund > 0) return Math.max(order.total - refund, 0)
  return order.total
}
