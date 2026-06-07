import { Link } from "react-router-dom"
import { ChevronRight, Package } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useOrders } from "@/entities/order/api/useOrders"
import { routes } from "@/shared/config/routes"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderNetAmount, orderRefundAmount } from "@/shared/lib/order-amounts"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import {
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/shared/lib/payment-status"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"

export const OrdersPage = () => {
  const profileRoutes = useProfileRoutes()
  const user = useAuthStore((s) => s.user)
  const { data: orders, isLoading } = useOrders(user?.id)

  return (
    <PageShell>
      <PageHeader
        title="Мои заказы"
        subtitle="История и статус сборов"
        backTo={profileRoutes.profile}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : orders && orders.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => {
            const refund = orderRefundAmount(order)
            const displayTotal = refund > 0 ? orderNetAmount(order) : order.total
            return (
            <li key={order.id}>
              <Link to={routes.user.order(order.id)}>
                <Card className="ui-card-interactive transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">№ {order.id}</p>
                      <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                      <p className="ui-price mt-1 text-sm">
                        {formatPrice(displayTotal)}
                      </p>
                      {refund > 0 ? (
                        <p className="mt-0.5 text-xs text-emerald-700">
                          Возврат переплаты: {formatPrice(refund)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Badge variant={orderStatusVariant[order.status]}>
                          {order.statusLabel ?? orderStatusLabel[order.status]}
                        </Badge>
                        {order.paymentStatus ? (
                          <Badge variant={paymentStatusVariant[order.paymentStatus]}>
                            {order.paymentStatusLabel ??
                              paymentStatusLabel[order.paymentStatus]}
                          </Badge>
                        ) : null}
                      </div>
                      <ChevronRight size={18} className="text-slate-400" />
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          )})}
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
