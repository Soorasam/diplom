import { Link, useNavigate } from "react-router-dom"
import { Minus, Package, Plus, MapPin } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useProducts } from "@/entities/product/api/useProducts"
import { usePickupPoints } from "@/entities/settlement/api/useSettlements"
import { useCartStore } from "@/features/cart/model/cart-store"
import { routes } from "@/shared/config/routes"
import { formatPrice } from "@/shared/lib/format"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"

export const CartPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const items = useCartStore((s) => s.items)
  const pickupPointId = useCartStore((s) => s.pickupPointId)
  const comment = useCartStore((s) => s.comment)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const setPickupPoint = useCartStore((s) => s.setPickupPoint)
  const setComment = useCartStore((s) => s.setComment)

  const { data: products } = useProducts()
  const { data: pickupPoints } = usePickupPoints(user?.settlementId)

  const cartProducts = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId)
      return product ? { ...item, product } : null
    })
    .filter(Boolean) as { productId: string; quantity: number; product: NonNullable<typeof products>[number] }[]

  const total = cartProducts.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  )

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title="Корзина"
        subtitle="Товары группируются по активному сбору"
      />

      <Card className="border-blue-100 bg-blue-50/40">
        <div className="flex items-start gap-2">
          <MapPin size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Пункт выдачи</p>
            <select
              value={pickupPointId ?? ""}
              onChange={(e) => setPickupPoint(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
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
              Все пункты на карте
            </Link>
          </div>
        </div>
      </Card>

      {cartProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Корзина пуста"
          description="Добавьте товары из каталога"
          actionLabel="В каталог"
          onAction={() => navigate(routes.catalog)}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {cartProducts.map(({ product, quantity, productId }) => (
              <li key={productId}>
                <Card>
                  <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm text-blue-700">{formatPrice(product.price)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(productId, quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
                        aria-label="Уменьшить"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(productId, quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
                        aria-label="Увеличить"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Input
            label="Комментарий к заказу"
            placeholder="Пожелания, уточнения…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <Card className="bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Итого</span>
              <span className="text-lg font-bold text-blue-700">{formatPrice(total)}</span>
            </div>
          </Card>

          <Link
            to={routes.checkout}
            className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md ${
              !pickupPointId || cartProducts.length === 0
                ? "pointer-events-none bg-slate-300"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Оформить заказ
          </Link>
        </>
      )}
    </div>
  )
}
