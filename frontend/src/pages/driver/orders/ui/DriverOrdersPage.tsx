import { useQuery } from "@tanstack/react-query"
import { Package } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const DriverOrdersPage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"

  const { data: orders, isLoading } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
  })

  return (
    <PageShell>
      <PageHeader
        title="Заказы на маршруте"
        subtitle="Статусы доставки по точкам"
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">№ {order.id}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                    <p className="mt-1 text-sm font-medium text-blue-700">
                      {formatPrice(order.total)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.items.length} поз. · пункт {order.pickupPointId}
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
        <EmptyState
          icon={Package}
          title="Заказов нет"
          description="На текущем маршруте нет назначенных заказов"
        />
      )}
    </PageShell>
  )
}
