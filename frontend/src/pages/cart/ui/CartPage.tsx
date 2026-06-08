import { Link, useNavigate } from "react-router-dom"
import { Package, Trash2 } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useProducts } from "@/entities/product/api/useProducts"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
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
import { CheckoutSteps } from "@/shared/ui/checkout-steps/CheckoutSteps"
import { QuantityStepper } from "@/shared/ui/quantity-stepper/QuantityStepper"
import { CartProcurementBlock } from "@/widgets/cart-procurement-block/ui/CartProcurementBlock"
import { useEffect } from "react"

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
  const { data: settlements } = useSettlements()

  const deliveryPointId = pickupPointId ?? user?.pickupPointId ?? user?.settlementId
  const settlementName = settlements?.find(
    (s) => s.id === user?.settlementId || s.id === deliveryPointId,
  )?.name

  useEffect(() => {
    if (!pickupPointId && deliveryPointId) {
      setPickupPoint(deliveryPointId)
    }
  }, [pickupPointId, deliveryPointId, setPickupPoint])

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
    Boolean(deliveryPointId) &&
    Boolean(user?.deliveryAddress?.trim()) &&
    cartProducts.length > 0 &&
    !weightOverLimit

  const checkoutHint = !isAuthenticated
    ? "Войдите в аккаунт"
    : !procurementId
      ? "Выберите сбор"
      : !hasJoined
        ? "Вступите в сбор"
        : !deliveryPointId
          ? "Укажите посёлок в профиле"
        : !user?.deliveryAddress?.trim()
          ? "Укажите адрес дома"
          : weightOverLimit
            ? "Превышен лимит веса"
            : "Оформить и оплатить"

  return (
    <>
      <PageShell withStickyFooter={cartProducts.length > 0}>
        <PageHeader
          title="Корзина"
          subtitle={
            cartProducts.length > 0
              ? `${cartProducts.length} поз. · ${formatWeightKg(cartWeightKg)}`
              : "Пусто"
          }
          className="!mb-0"
        />

        <CheckoutSteps current="cart" />

        <Card className="!p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Сбор и доставка</p>
          <CartProcurementBlock embedded settlementName={settlementName} />
        </Card>

        {cartProducts.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            fullWidth
            className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-950/40"
            onClick={() => void clearCart()}
          >
            <Trash2 size={18} />
            Очистить корзину
          </Button>
        ) : null}

        {cartProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Корзина пуста"
            description="Выберите товары в каталоге активного сбора"
            actionLabel="В каталог"
            onAction={() => navigate(routes.user.catalog)}
          />
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {cartProducts.map(({ product, quantity, productId }) => (
                <li key={productId}>
                  <Card className="!p-3">
                    <div className="flex gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
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
                        <div className="mt-2 grid grid-cols-[7.25rem_1fr] items-center gap-3">
                          <QuantityStepper
                            quantity={quantity}
                            size="sm"
                            onDecrease={() => void setQuantity(productId, quantity - 1)}
                            onIncrease={() => void setQuantity(productId, quantity + 1)}
                          />
                          <span className="text-right text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                            {formatPrice(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>

            <Card className="!p-4">
              <Input
                label="Комментарий к заказу"
                placeholder="Пожелания к заказу — увидит водитель при выдаче"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Card>

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
              <span className="ui-price text-lg">{formatPrice(total)}</span>
            </div>
            {canCheckout ? (
              <Link to={routes.user.checkout} className="block">
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
