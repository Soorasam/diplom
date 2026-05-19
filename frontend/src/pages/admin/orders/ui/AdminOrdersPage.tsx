import { Package } from "lucide-react"

import { useAdminOrders } from "@/entities/admin/api/useAdmin"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminOrdersPage = () => {
  const { data: orders, isLoading } = useAdminOrders()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Заказы" subtitle="Все заказы кооператива" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">№ {order.id}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(order.createdAt)} · пользователь {order.userId}
                    </p>
                    <p className="mt-1 text-sm font-medium text-blue-700">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                  <Badge variant={orderStatusVariant[order.status]}>
                    {orderStatusLabel[order.status]}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Package} title="Заказов нет" />
      )}
    </div>
  )
}
