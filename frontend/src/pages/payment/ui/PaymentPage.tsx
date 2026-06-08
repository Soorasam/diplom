import { useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { CreditCard, ShieldCheck } from "lucide-react"

import { useOrder, useReservePayment } from "@/entities/order/api/useOrders"
import { ApiError } from "@/shared/api/client"
import { routes } from "@/shared/config/routes"
import { formatPrice } from "@/shared/lib/format"
import {
  paymentStatusLabel,
  paymentStatusVariant,
} from "@/shared/lib/payment-status"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { CheckoutSteps } from "@/shared/ui/checkout-steps/CheckoutSteps"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export type PaymentCheckoutState = {
  lineLabels: { name: string; quantity: number; price: number }[]
  total: number
}

export const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as PaymentCheckoutState | null

  const orderId = searchParams.get("orderId")
  const { data: order, isLoading: loadingOrder, isError: orderLoadError } = useOrder(
    orderId ?? "",
  )
  const reservePayment = useReservePayment()

  const [payError, setPayError] = useState<string | null>(null)

  if (!orderId) {
    return (
      <PageShell>
        <PageHeader title="Оплата" backTo={routes.user.checkout} />
        <Card>
          <p className="text-sm text-slate-600">
            Сначала оформите заказ — оплата доступна после подтверждения на шаге
            «Оформление».
          </p>
          <Button className="mt-4" onClick={() => navigate(routes.user.checkout)}>
            К оформлению
          </Button>
        </Card>
      </PageShell>
    )
  }

  const lineLabels =
    state?.lineLabels ??
    order?.items.map((i) => ({
      name: i.productName ?? "Товар",
      quantity: i.quantity,
      price: i.price,
    })) ??
    []

  const displayTotal = order?.total ?? state?.total ?? 0
  const isHeld = order?.paymentStatus === "held"
  const isPaying = reservePayment.isPending

  const handlePay = () => {
    if (!order || isHeld) return
    setPayError(null)
    reservePayment.mutate(order.id, {
      onSuccess: (updated) => {
        navigate(routes.user.order(updated.id), { replace: true })
      },
      onError: (e) => {
        const message =
          e instanceof ApiError
            ? e.message
            : "Не удалось зарезервировать оплату. Повторите попытку."
        setPayError(message)
      },
    })
  }

  return (
    <PageShell>
      <PageHeader
        title="Оплата"
        backTo={routes.user.checkout}
        subtitle="Средства резервируются на платформе до получения заказа"
        className="mb-0!"
      />

      <CheckoutSteps current="payment" className="mb-2" />

      {orderLoadError ? (
        <AlertBanner variant="warning" title="Не удалось загрузить заказ">
          Вернитесь в корзину и оформите заказ заново.
        </AlertBanner>
      ) : null}

      <Card className="ui-panel p-5!">
        <div className="flex items-center gap-4">
          <span className="ui-icon-solid flex h-14 w-14 rounded-2xl">
            <CreditCard size={28} />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-600">Сумма к оплате</p>
            <p className="ui-price text-3xl tracking-tight">{formatPrice(displayTotal)}</p>
            {order?.paymentStatus ? (
              <Badge
                variant={paymentStatusVariant[order.paymentStatus]}
                className="mt-2"
              >
                {order.paymentStatusLabel ?? paymentStatusLabel[order.paymentStatus]}
              </Badge>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="border-sky-100 bg-sky-50/50 p-4!">
        <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-sky-600" />
          Деньги остаются на платформе до подтверждения получения. Водитель закупает товар
          на свои средства и получит выплату после вашего подтверждения.
        </p>
      </Card>

      {lineLabels.length > 0 ? (
        <Card className="p-4!">
          <p className="mb-3 text-sm font-semibold text-slate-900">Состав заказа</p>
          <ul className="divide-y divide-slate-100">
            {lineLabels.map((line) => (
              <li
                key={`${line.name}-${line.quantity}`}
                className="flex justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <span className="text-slate-700">
                  {line.name}
                  <span className="text-slate-400"> × {line.quantity}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-slate-900">
                  {formatPrice(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <p className="text-xs text-slate-500">
        Пилот: реальный платёжный шлюз не подключён — оплата симулируется.
      </p>

      {payError ? (
        <AlertBanner variant="warning" title="Оплата не прошла">
          {payError}
        </AlertBanner>
      ) : null}

      {loadingOrder ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            size="lg"
            loading={isPaying}
            disabled={!order || isHeld || orderLoadError}
            onClick={() => void handlePay()}
          >
            {isHeld ? "Средства зарезервированы" : "Оплатить и зарезервировать"}
          </Button>
          {order && isHeld ? (
            <Button
              fullWidth
              variant="outline"
              onClick={() => navigate(routes.user.order(order.id), { replace: true })}
            >
              Перейти к заказу
            </Button>
          ) : null}
          <Button variant="ghost" fullWidth onClick={() => navigate(routes.user.cart)}>
            Вернуться в корзину
          </Button>
        </div>
      )}
    </PageShell>
  )
}
