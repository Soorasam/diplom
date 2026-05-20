import { useState } from "react"
import { Package } from "lucide-react"

import { useAdminOrders, useUpdateAdminOrderStatus } from "@/entities/admin/api/useAdmin"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import type { OrderStatus } from "@/shared/types"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const statusOptions: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_transit",
  "at_pickup",
  "delivered",
  "cancelled",
]

export const AdminOrdersPage = () => {
  const { data: orders, isLoading, isError, error } = useAdminOrders()
  const updateStatus = useUpdateAdminOrderStatus()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Заказы" subtitle="Все заказы и смена статуса" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-800">
            {(error as Error)?.message ?? "Не удалось загрузить заказы"}
          </p>
        </Card>
      ) : orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const expanded = expandedId === order.id
            return (
              <li key={order.id}>
                <Card>
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          № {order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(order.createdAt)} · {order.userId.slice(0, 8)}…
                        </p>
                        <p className="mt-1 text-sm font-medium text-blue-700">
                          {formatPrice(order.total)}
                        </p>
                      </div>
                      <Badge variant={orderStatusVariant[order.status]}>
                        {orderStatusLabel[order.status]}
                      </Badge>
                    </div>
                  </button>

                  {expanded ? (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      {order.items && order.items.length > 0 ? (
                        <ul className="mb-4 space-y-1 text-sm text-slate-700">
                          {order.items.map((item, idx) => (
                            <li key={`${item.productId}-${idx}`}>
                              {item.productName ?? item.productId} × {item.quantity} —{" "}
                              {formatPrice(item.price * item.quantity)}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <label className="block text-xs font-medium text-slate-600">
                        Статус заказа
                      </label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <select
                          className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                          value={order.status}
                          onChange={(e) =>
                            updateStatus.mutate({
                              orderId: order.id,
                              status: e.target.value as OrderStatus,
                            })
                          }
                          disabled={updateStatus.isPending}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {orderStatusLabel[s]}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpandedId(null)}
                        >
                          Свернуть
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Package}
          title="Заказов нет"
          description="Оформите заказ из корзины под учёткой жителя"
        />
      )}
    </div>
  )
}
