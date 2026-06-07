import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { CheckCircle2, MessageSquare, ShieldCheck } from "lucide-react"

import {
  useConfirmReceipt,
  useOrder,
  useReservePayment,
} from "@/entities/order/api/useOrders"
import { useTicketByOrder } from "@/entities/ticket/api/useTickets"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import { useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"
import { formatDate, formatPrice } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import {
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/shared/lib/payment-status"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { OrderTimeline } from "@/widgets/order-timeline/ui/OrderTimeline"

export const OrderDetailsPage = () => {
  const { id = "" } = useParams()
  const user = useAuthStore((s) => s.user)
  const profileRoutes = useProfileRoutes()
  const { data: order, isLoading } = useOrder(id)
  const { data: existingTicket } = useTicketByOrder(id)
  const { data: settlements } = useSettlements()
  const confirmReceipt = useConfirmReceipt()
  const reservePayment = useReservePayment()
  const [actionError, setActionError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4">
        <PageHeader title="Заказ не найден" backTo={routes.user.orders} />
      </div>
    )
  }

  const settlement = settlements?.find(
    (s) => s.id === order.pickupPointId || s.id === user?.settlementId,
  )

  const canPay =
    order.paymentStatus === "pending" && order.status !== "cancelled"
  const canConfirmReceipt =
    order.status === "in_transit" && order.paymentStatus === "held"
  const canDispute = order.status !== "cancelled" && order.status !== "draft"

  const paymentLabel =
    order.paymentStatusLabel ??
    (order.paymentStatus ? paymentStatusLabel[order.paymentStatus] : null)

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title={
          order.publicNumber
            ? `Заказ №${order.publicNumber}`
            : `Заказ #${order.id.slice(0, 8)}`
        }
        backTo={routes.user.orders}
        subtitle={formatDate(order.createdAt)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {formatPrice(order.total)}
        </span>
        <div className="flex flex-wrap gap-2">
          <Badge variant={orderStatusVariant[order.status]}>
            {order.statusLabel ?? orderStatusLabel[order.status]}
          </Badge>
          {order.paymentStatus ? (
            <Badge variant={paymentStatusVariant[order.paymentStatus]}>
              {paymentLabel}
            </Badge>
          ) : null}
        </div>
      </div>

      {order.paymentStatus === "held" ? (
        <Card className="border-sky-100 bg-sky-50/40 p-4!">
          <p className="flex items-start gap-2 text-sm text-slate-700">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-sky-600" />
            Средства зарезервированы на платформе. Координатор получит выплату после вашего
            подтверждения получения товара.
          </p>
        </Card>
      ) : null}

      {settlement ? (
        <Card>
          <p className="text-sm font-semibold text-slate-900">Посёлок доставки</p>
          <p className="mt-1 text-sm text-slate-600">{settlement.name}</p>
          <p className="mt-2 text-xs text-slate-500">
            Заберите заказ на общей точке раздачи — координатор сообщит время и место
          </p>
        </Card>
      ) : null}

      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-900">Состав</p>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.productId} className="flex justify-between text-sm">
              <span className="text-slate-700">
                {item.productName ?? item.productId} × {item.quantity}
              </span>
              <span className="font-medium text-slate-900">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-semibold text-slate-900">История статусов</p>
        <OrderTimeline timeline={order.timeline} />
      </Card>

      {actionError ? (
        <AlertBanner variant="warning" title="Не удалось выполнить действие">
          {actionError}
        </AlertBanner>
      ) : null}

      {(canPay || canConfirmReceipt || canDispute) && (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-slate-900">Действия</p>

          {canPay ? (
            <Button
              fullWidth
              loading={reservePayment.isPending}
              onClick={() => {
                setActionError(null)
                reservePayment.mutate(order.id, {
                  onError: () =>
                    setActionError("Не удалось зарезервировать оплату. Повторите попытку."),
                })
              }}
            >
              Оплатить и зарезервировать на платформе
            </Button>
          ) : null}

          {canConfirmReceipt ? (
            <>
              <p className="text-xs text-slate-500">
                Проверьте товар при координаторе и подтвердите только после получения.
              </p>
              <Button
                fullWidth
                leftIcon={<CheckCircle2 size={18} />}
                loading={confirmReceipt.isPending}
                onClick={() => {
                  setActionError(null)
                  confirmReceipt.mutate(order.id, {
                    onError: () =>
                      setActionError(
                        "Не удалось подтвердить получение. Проверьте статус заказа.",
                      ),
                  })
                }}
              >
                Товар получен
              </Button>
            </>
          ) : null}

          {canDispute ? (
            <Link
              to={
                existingTicket
                  ? profileRoutes.dispute(existingTicket.id)
                  : routes.user.disputeCreate(order.id)
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <MessageSquare size={18} />
              {existingTicket ? "Перейти к спору" : "Открыть спор"}
            </Link>
          ) : null}
        </Card>
      )}
    </div>
  )
}
