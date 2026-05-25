import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { CreditCard, ShieldCheck } from "lucide-react"

import { useCreateOrder } from "@/entities/order/api/useOrders"
import { useCartStore } from "@/features/cart/model/cart-store"
import { queryKeys } from "@/shared/config/query-keys"
import { useQueryClient } from "@tanstack/react-query"
import { routes } from "@/shared/config/routes"
import { formatPrice } from "@/shared/lib/format"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { CheckoutSteps } from "@/shared/ui/checkout-steps/CheckoutSteps"

export type PaymentCheckoutState = {
  userId: string
  procurementId: string
  pickupPointId: string
  items: { productId: string; quantity: number }[]
  comment?: string
  total: number
  lineLabels: { name: string; quantity: number; price: number }[]
}

export const PaymentPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as PaymentCheckoutState | null
  const createOrder = useCreateOrder()
  const qc = useQueryClient()
  const [paying, setPaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const resetCart = useCartStore((s) => s.reset)

  if (!state?.items?.length) {
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

  const simulatePay = async (success: boolean) => {
    setPaying(true)
    setFailed(false)
    await new Promise((r) => setTimeout(r, 900))
    if (!success) {
      setPaying(false)
      setFailed(true)
      return
    }
    try {
      const order = await createOrder.mutateAsync({
        userId: state.userId,
        procurementId: state.procurementId,
        pickupPointId: state.pickupPointId,
        items: state.items,
        comment: state.comment,
      })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
      resetCart()
      navigate(routes.user.order(order.id), { replace: true })
    } catch {
      setPaying(false)
      setFailed(true)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Оплата"
        backTo={routes.user.checkout}
        subtitle="Демо-оплата · после успеха вес заказа учтётся в сборе"
        className="mb-0!"
      />

      <CheckoutSteps current="payment" className="mb-2" />

      <Card className="ui-panel p-5!">
        <div className="flex items-center gap-4">
          <span className="ui-icon-solid flex h-14 w-14 rounded-2xl">
            <CreditCard size={28} />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-600">Сумма к оплате</p>
            <p className="ui-price text-3xl tracking-tight">
              {formatPrice(state.total)}
            </p>
          </div>
        </div>
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

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck size={14} />
        Прототип: реальные платежи не подключены
      </p>

      {failed ? (
        <AlertBanner variant="warning" title="Оплата не прошла">
          Повторите попытку или вернитесь в корзину.
        </AlertBanner>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button fullWidth size="lg" loading={paying} onClick={() => void simulatePay(true)}>
          Оплатить
        </Button>
        <Button
          variant="outline"
          fullWidth
          disabled={paying}
          onClick={() => void simulatePay(false)}
        >
          Симулировать отказ
        </Button>
        {failed ? (
          <Button variant="ghost" fullWidth onClick={() => navigate(routes.user.cart)}>
            Вернуться в корзину
          </Button>
        ) : null}
      </div>
    </PageShell>
  )
}
