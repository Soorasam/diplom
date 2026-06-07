import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CreditCard, ShieldCheck } from "lucide-react"

import {
  useCheckoutFromCart,
  useReservePayment,
} from "@/entities/order/api/useOrders"
import type { Order } from "@/shared/api/api-types"
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
  procurementId: string
  pickupPointId: string
  total: number
  lineLabels: { name: string; quantity: number; price: number }[]
}

export const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as PaymentCheckoutState | null

  const checkout = useCheckoutFromCart()
  const reservePayment = useReservePayment()

  const [order, setOrder] = useState<Order | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [payError, setPayError] = useState(false)
  const checkoutStarted = useRef(false)

  useEffect(() => {
    if (!state?.procurementId || !state.pickupPointId || checkoutStarted.current) return
    checkoutStarted.current = true

    checkout.mutate(
      {
        procurementId: state.procurementId,
        pickupPointId: state.pickupPointId,
      },
      {
        onSuccess: (created) => setOrder(created),
        onError: () => setCheckoutError("Не удалось оформить заказ. Вернитесь в корзину."),
      },
    )
  }, [state?.procurementId, state?.pickupPointId, checkout.mutate])

  if (!state?.lineLabels?.length) {
    return (
      <PageShell>
        <PageHeader title="Оплата" backTo={routes.user.checkout} />
        <Card>
          <p className="text-sm text-slate-600">Нет данных для оплаты.</p>
          <Button className="mt-4" onClick={() => navigate(routes.user.checkout)}>
            К оформлению
          </Button>
        </Card>
      </PageShell>
    )
  }

  const isHeld = order?.paymentStatus === "held"
  const isPaying = reservePayment.isPending
  const isLoadingOrder = checkout.isPending && !order

  const handlePay = () => {
    if (!order || isHeld) return
    setPayError(false)
    reservePayment.mutate(order.id, {
      onSuccess: (updated) => {
        setOrder(updated)
        navigate(routes.user.order(updated.id), { replace: true })
      },
      onError: () => setPayError(true),
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

      {checkoutError ? (
        <AlertBanner variant="warning" title="Ошибка оформления">
          {checkoutError}
        </AlertBanner>
      ) : null}

      <Card className="ui-panel p-5!">
        <div className="flex items-center gap-4">
          <span className="ui-icon-solid flex h-14 w-14 rounded-2xl">
            <CreditCard size={28} />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-600">Сумма к оплате</p>
            <p className="ui-price text-3xl tracking-tight">
              {formatPrice(order?.total ?? state.total)}
            </p>
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
          Деньги остаются на платформе до подтверждения получения. Координатор закупает товар
          на свои средства и получит выплату после вашего подтверждения.
        </p>
      </Card>

      <Card className="p-4!">
        <p className="mb-3 text-sm font-semibold text-slate-900">Состав заказа</p>
        <ul className="divide-y divide-slate-100">
          {state.lineLabels.map((line) => (
            <li
              key={line.name}
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

      <p className="text-xs text-slate-500">
        Пилот: реальный платёжный шлюз не подключён — оплата симулируется.
      </p>

      {payError ? (
        <AlertBanner variant="warning" title="Оплата не прошла">
          Повторите попытку или вернитесь в корзину.
        </AlertBanner>
      ) : null}

      {isLoadingOrder ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            fullWidth
            size="lg"
            loading={isPaying}
            disabled={!order || isHeld}
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
