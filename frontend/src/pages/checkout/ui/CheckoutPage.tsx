import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { useCreateOrder } from "@/entities/order/api/useOrders"
import { useProducts } from "@/entities/product/api/useProducts"
import { usePickupPoints } from "@/entities/settlement/api/useSettlements"
import { useCartStore } from "@/features/cart/model/cart-store"
import {
  checkoutSchema,
  type CheckoutFormValues,
} from "@/features/cart/model/checkout-schema"
import { routes } from "@/shared/config/routes"
import { formatPrice } from "@/shared/lib/format"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"

export const CheckoutPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const pickupPointId = useCartStore((s) => s.pickupPointId)
  const procurementId = useCartStore((s) => s.procurementId)
  const comment = useCartStore((s) => s.comment)
  const clear = useCartStore((s) => s.clear)

  const { data: products } = useProducts()
  const { data: pickupPoints } = usePickupPoints(user?.settlementId)
  const createOrder = useCreateOrder()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { agreeTerms: false },
  })

  const pickup = pickupPoints?.find((p) => p.id === pickupPointId)
  const lineItems = items.map((item) => {
    const product = products?.find((p) => p.id === item.productId)
    return { ...item, product }
  })
  const total = lineItems.reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0,
  )

  const onSubmit = async () => {
    if (!user || !pickupPointId || !procurementId) return
    const order = await createOrder.mutateAsync({
      userId: user.id,
      procurementId,
      pickupPointId,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      comment: comment || undefined,
    })
    clear()
    navigate(routes.order(order.id))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Оформление" backTo={routes.cart} subtitle="Проверьте данные перед отправкой" />

      <Card>
        <h2 className="text-sm font-semibold text-slate-800">Пункт выдачи</h2>
        <p className="mt-1 text-sm text-slate-600">{pickup?.name ?? "Не выбран"}</p>
        <p className="text-xs text-slate-500">{pickup?.address}</p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-800">Состав заказа</h2>
        <ul className="mt-2 space-y-2">
          {lineItems.map((line) =>
            line.product ? (
              <li key={line.productId} className="flex justify-between text-sm">
                <span className="text-slate-700">
                  {line.product.name} × {line.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(line.product.price * line.quantity)}
                </span>
              </li>
            ) : null,
          )}
        </ul>
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold">
          <span>Итого</span>
          <span className="text-blue-700">{formatPrice(total)}</span>
        </div>
      </Card>

      {comment ? (
        <Card>
          <p className="text-xs text-slate-500">Комментарий</p>
          <p className="text-sm text-slate-700">{comment}</p>
        </Card>
      ) : null}

      <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
        <input type="checkbox" className="mt-0.5" {...register("agreeTerms")} />
        <span className="text-xs text-slate-600">
          Согласен с условиями кооперативной доставки. Сроки могут меняться из‑за погоды и
          состояния зимников.
        </span>
      </label>
      {errors.agreeTerms ? (
        <p className="text-xs text-red-600">{errors.agreeTerms.message}</p>
      ) : null}

      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={createOrder.isPending}
        disabled={!user || !pickupPointId || items.length === 0}
      >
        Подтвердить заказ
      </Button>
    </form>
  )
}
