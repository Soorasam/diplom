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
            const orderLabel = order.publicNumber
              ? `№ ${order.publicNumber}`
              : `№ ${order.id.slice(0, 8)}`

            return (
              <li key={order.id}>
                <Link to={routes.user.order(order.id)} className="block">
                  <Card className="ui-card-interactive relative min-h-[5.5rem] pr-11 pt-3 pb-3 pl-4">
                    <div className="absolute top-3 right-3 flex max-w-[46%] flex-col items-end gap-1">
                      <Badge
                        variant={orderStatusVariant[order.status]}
                        className="max-w-full truncate"
                      >
                        {order.statusLabel ?? orderStatusLabel[order.status]}
                      </Badge>
                      {order.paymentStatus ? (
                        <Badge
                          variant={paymentStatusVariant[order.paymentStatus]}
                          className="max-w-full truncate"
                        >
                          {order.paymentStatusLabel ??
                            paymentStatusLabel[order.paymentStatus]}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="min-w-0 pr-[42%]">
                      <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                        {orderLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="ui-price mt-2 text-sm font-semibold">
                        {formatPrice(displayTotal)}
                      </p>
                      {refund > 0 ? (
                        <p className="mt-0.5 text-xs leading-snug text-emerald-700">
                          Возврат: {formatPrice(refund)}
                        </p>
                      ) : null}
                    </div>

                    <ChevronRight
                      size={18}
                      className="absolute bottom-3 right-3 text-slate-400"
                      aria-hidden
                    />
                  </Card>
                </Link>
              </li>
            )
          })}
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
