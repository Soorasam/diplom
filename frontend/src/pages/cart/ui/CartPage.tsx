import { Link, useNavigate } from "react-router-dom"
import { Minus, Package, Plus, MapPin, Trash2 } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useProducts } from "@/entities/product/api/useProducts"
import { usePickupPoints } from "@/entities/settlement/api/useSettlements"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useProcurementParticipation } from "@/features/procurement/hooks/useProcurementParticipation"
import { calcCartWeightKg } from "@/features/cart/lib/calc-weight"
import { useCartStore } from "@/features/cart/model/cart-store"
import { routes } from "@/shared/config/routes"
import { formatPrice, formatWeightKg } from "@/shared/lib/format"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Button } from "@/shared/ui/button/Button"
import { StickyActionBar } from "@/shared/ui/sticky-action-bar/StickyActionBar"
import { CartProcurementBlock } from "@/widgets/cart-procurement-block/ui/CartProcurementBlock"

export const CartPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const pickupPointId = useCartStore((s) => s.pickupPointId)
  const comment = useCartStore((s) => s.comment)
  const { setQuantity, clearCart } = useCartActions()
  const setPickupPoint = useCartStore((s) => s.setPickupPoint)
  const setComment = useCartStore((s) => s.setComment)

  const {
    procurement,
    canCheckoutRound,
    isAuthenticated,
    hasJoined,
    procurementId,
  } = useProcurementParticipation()

  const { data: products } = useProducts()
  const { data: pickupPoints } = usePickupPoints(user?.settlementId)

  const cartProducts = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId)
      return product ? { ...item, product } : null
    })
    .filter(Boolean) as {
    productId: string
    quantity: number
    product: NonNullable<typeof products>[number]
  }[]

  const total = cartProducts.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const cartWeightKg = products ? calcCartWeightKg(items, products) : 0
  const weightOverLimit =
    procurement != null &&
    procurement.currentWeightKg + cartWeightKg >
      procurement.targetWeightKg + 0.001

  const canCheckout =
    isAuthenticated &&
    canCheckoutRound &&
    Boolean(pickupPointId) &&
    cartProducts.length > 0 &&
    !weightOverLimit

  const checkoutHint = !isAuthenticated
    ? "Войдите в аккаунт"
    : !procurementId
      ? "Выберите сбор"
      : !hasJoined
        ? "Вступите в сбор"
        : !pickupPointId
          ? "Выберите пункт выдачи"
          : weightOverLimit
            ? "Превышен лимит веса"
            : "Оформить и оплатить"

  return (
    <>
    <PageShell withStickyFooter={cartProducts.length > 0}>
        <div className="flex items-start justify-between gap-3">
          <PageHeader
            title="Корзина"
            subtitle={
              cartProducts.length > 0
                ? `${cartProducts.length} поз. · ${formatWeightKg(cartWeightKg)}`
                : "Пусто"
            }
            className="!mb-0 min-w-0 flex-1"
          />
          {cartProducts.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => void clearCart()}
            >
              <Trash2 size={16} />
              Очистить
            </Button>
          ) : null}
        </div>

        <CartProcurementBlock />

        <Card className="!p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <MapPin size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">Пункт выдачи</p>
              <select
                value={pickupPointId ?? ""}
                onChange={(e) => setPickupPoint(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm"
              >
                <option value="">Выберите пункт</option>
                {pickupPoints?.map((pp) => (
                  <option key={pp.id} value={pp.id}>
                    {pp.name}
                  </option>
                ))}
              </select>
              <Link
                to={routes.pickupPoints}
                className="mt-2 inline-block text-xs font-medium text-blue-600"
              >
                Карта пунктов выдачи
              </Link>
            </div>
          </div>
        </Card>

        {cartProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Корзина пуста"
            description="Выберите товары в каталоге активного сбора"
            actionLabel="В каталог"
            onAction={() => navigate(routes.catalog)}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {cartProducts.map(({ product, quantity, productId }) => (
                <li key={productId}>
                  <Card className="!p-3">
                    <div className="flex gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Package size={24} className="text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatWeightKg(product.weightKg * quantity)} ·{" "}
                          {formatPrice(product.price)} / {product.unit}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                            <button
                              type="button"
                              onClick={() => void setQuantity(productId, quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white"
                              aria-label="Уменьшить"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="min-w-8 text-center text-sm font-bold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => void setQuantity(productId, quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white"
                              aria-label="Увеличить"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          <span className="text-sm font-bold text-slate-900">
                            {formatPrice(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>

            <div className="scroll-mt-4">
              <Input
                label="Комментарий"
                placeholder="Пожелания к заказу…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {weightOverLimit ? (
              <AlertBanner variant="warning" title="Превышен лимит сбора">
                Уменьшите количество товаров. После оплаты в сбор пойдёт только вес в пределах
                лимита.
              </AlertBanner>
            ) : null}
          </>
        )}
      </PageShell>

      {cartProducts.length > 0 ? (
        <StickyActionBar>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-600">
                {formatWeightKg(cartWeightKg)} · {cartProducts.length} поз.
              </span>
              <span className="text-lg font-bold text-blue-700">{formatPrice(total)}</span>
            </div>
            {canCheckout ? (
              <Link to={routes.checkout} className="block">
                <Button type="button" fullWidth size="lg">
                  Оформить и оплатить
                </Button>
              </Link>
            ) : (
              <Button type="button" fullWidth size="lg" disabled>
                {checkoutHint}
              </Button>
            )}
          </div>
        </StickyActionBar>
      ) : null}
    </>
  )
}
