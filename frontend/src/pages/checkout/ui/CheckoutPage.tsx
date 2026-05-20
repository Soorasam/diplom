import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { useCreateOrder } from "@/entities/order/api/useOrders"
import { useProducts } from "@/entities/product/api/useProducts"
import { useActiveProcurements } from "@/entities/procurement/api/useProcurements"
import { usePickupPoints } from "@/entities/settlement/api/useSettlements"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
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
  const user = useAuthStore((s) => s.isAuthenticated)
  const authUser = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const pickupPointId = useCartStore((s) => s.pickupPointId)
  const procurementId = useCartStore((s) => s.procurementId)
  const comment = useCartStore((s) => s.comment)
  const setPickupPoint = useCartStore((s) => s.setPickupPoint)
  const setProcurement = useCartStore((s) => s.setProcurement)
  const { clearCart } = useCartActions()

  const { data: products } = useProducts()
  const { data: pickupPoints } = usePickupPoints(authUser?.settlementId)
  const { data: procurements } = useActiveProcurements()
  const createOrder = useCreateOrder()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { agreeTerms: false },
  })

  const agreeTerms = watch("agreeTerms")

  useEffect(() => {
    if (procurementId) return
    const active = procurements?.[0]
    if (active) setProcurement(active.id)
  }, [procurementId, procurements, setProcurement])

  const pickup = pickupPoints?.find((p) => p.id === pickupPointId)
  const lineItems = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId)
      return product ? { ...item, product } : null
    })
    .filter(Boolean) as {
    productId: string
    quantity: number
    product: NonNullable<typeof products>[number]
  }[]

  const total = lineItems.reduce((s, i) => s + i.product.price * i.quantity, 0)

  const blockers: string[] = []
  if (!user) blockers.push("Войдите в аккаунт")
  if (lineItems.length === 0) blockers.push("В корзине нет товаров — добавьте из каталога")
  if (!pickupPointId) blockers.push("Выберите пункт выдачи")
  if (!procurementId) blockers.push("Нет активного сбора закупки")
  if (!agreeTerms) blockers.push("Отметьте согласие с условиями доставки")

  const canSubmit = blockers.length === 0

  const onSubmit = async () => {
    if (!authUser || !pickupPointId || !procurementId || lineItems.length === 0) return
    const order = await createOrder.mutateAsync({
      userId: authUser.id,
      procurementId,
      pickupPointId,
      items: lineItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
      comment: comment || undefined,
    })
    await clearCart()
    navigate(routes.order(order.id))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Оформление" backTo={routes.cart} subtitle="Проверьте данные перед отправкой" />

      {!canSubmit && blockers.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <p className="text-sm font-semibold text-amber-900">Чтобы оформить заказ:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
            {blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {lineItems.length === 0 ? (
            <Link
              to={routes.catalog}
              className="mt-3 inline-block text-sm font-semibold text-blue-700 underline"
            >
              Перейти в каталог
            </Link>
          ) : null}
          {!pickupPointId ? (
            <Link
              to={routes.cart}
              className="mt-1 inline-block text-sm font-semibold text-blue-700 underline"
            >
              Вернуться в корзину и выбрать ПВЗ
            </Link>
          ) : null}
        </Card>
      ) : null}

      <Card>
        <h2 className="text-sm font-semibold text-slate-800">Пункт выдачи</h2>
        {pickupPoints && pickupPoints.length > 0 ? (
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={pickupPointId ?? ""}
            onChange={(e) => setPickupPoint(e.target.value)}
          >
            <option value="">Выберите пункт</option>
            {pickupPoints.map((pp) => (
              <option key={pp.id} value={pp.id}>
                {pp.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="mt-1 text-sm text-slate-600">
            {pickup?.name ?? "Не выбран"}
            {!authUser?.settlementId
              ? " — укажите населённый пункт в профиле"
              : ""}
          </p>
        )}
        {pickup?.address ? (
          <p className="mt-1 text-xs text-slate-500">{pickup.address}</p>
        ) : null}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-800">Состав заказа</h2>
        {lineItems.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Корзина пуста</p>
        ) : (
          <>
            <ul className="mt-2 space-y-2">
              {lineItems.map((line) => (
                <li key={line.productId} className="flex justify-between text-sm">
                  <span className="text-slate-700">
                    {line.product.name} × {line.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(line.product.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold">
              <span>Итого</span>
              <span className="text-blue-700">{formatPrice(total)}</span>
            </div>
          </>
        )}
      </Card>

      {comment ? (
        <Card>
          <p className="text-xs text-slate-500">Комментарий</p>
          <p className="text-sm text-slate-700">{comment}</p>
        </Card>
      ) : null}

      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-white p-3">
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
        disabled={!canSubmit}
      >
        Подтвердить заказ
      </Button>
    </form>
  )
}
