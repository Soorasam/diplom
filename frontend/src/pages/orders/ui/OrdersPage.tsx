import { Link } from "react-router-dom"
import { ChevronRight, Package } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useOrders } from "@/entities/order/api/useOrders"
import { routes } from "@/shared/config/routes"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"

export const OrdersPage = () => {
  const user = useAuthStore((s) => s.user)
  const { data: orders, isLoading } = useOrders(user?.id)

  return (
    <PageShell>
      <PageHeader
        title="Мои заказы"
        subtitle="История и статус сборов"
        backTo={routes.profile}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link to={routes.order(order.id)}>
                <Card className="transition hover:border-blue-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">№ {order.id}</p>
                      <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                      <p className="mt-1 text-sm font-medium text-blue-700">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Badge variant={orderStatusVariant[order.status]}>
                        {orderStatusLabel[order.status]}
                      </Badge>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Package}
          title="Заказов пока нет"
          description="Оформите первый заказ из каталога"
        />
      )}
    </PageShell>
  )
}
