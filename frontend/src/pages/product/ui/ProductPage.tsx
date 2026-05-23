import { useParams, Link, useSearchParams } from "react-router-dom"
import { Plus, Trash2, Truck } from "lucide-react"

import { useProduct } from "@/entities/product/api/useProducts"
import { ActiveProcurementBanner } from "@/widgets/active-procurement-banner/ui/ActiveProcurementBanner"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useCartStore } from "@/features/cart/model/cart-store"
import { useOpenSelectedProcurement } from "@/features/procurement/hooks/useOpenSelectedProcurement"
import { useSyncSelectedProcurement } from "@/features/procurement/hooks/useSyncSelectedProcurement"
import { routes } from "@/shared/config/routes"
import { formatPrice, formatShortDate } from "@/shared/lib/format"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { Badge } from "@/shared/ui/badge/Badge"
import { ProductImage } from "@/shared/ui/product-image/ProductImage"
import { QuantityStepper } from "@/shared/ui/quantity-stepper/QuantityStepper"

export const ProductPage = () => {
  const { id = "" } = useParams()
  const { data: product, isLoading } = useProduct(id)
  const [searchParams] = useSearchParams()
  const roundFromUrl = searchParams.get("round") ?? undefined
  const procurementIdFromStore = useCartStore((s) => s.procurementId)
  useSyncSelectedProcurement(roundFromUrl ?? undefined)

  const activeRoundId = roundFromUrl ?? procurementIdFromStore ?? ""
  const { procurement: openProcurement } = useOpenSelectedProcurement(activeRoundId)
  const { addItem, setQuantity, clearCart } = useCartActions()
  const setProcurement = useCartStore((s) => s.setProcurement)
  const quantity =
    useCartStore((s) => s.items.find((i) => i.productId === id)?.quantity) ?? 0
  const cartItemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  )

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!product) {
    return (
      <PageShell>
        <PageHeader title="Товар не найден" backTo={routes.catalog} />
      </PageShell>
    )
  }

  const handleAdd = () => {
    if (openProcurement) setProcurement(openProcurement.id)
    void addItem(product.id, 1, openProcurement?.id)
  }

  return (
    <PageShell>
      {openProcurement ? <ActiveProcurementBanner procurement={openProcurement} /> : null}
      <PageHeader title={product.name} backTo={routes.catalog} className="!mb-0" />

      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        variant="detail"
        className="shadow-sm"
      />

      <div>
        <p className="text-2xl font-bold text-blue-700">{formatPrice(product.price)}</p>
        <p className="mt-1 text-sm text-slate-500">
          {product.weightKg > 0 ? `${product.weightKg} кг · ` : ""}
          {product.unit}
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-800">Описание</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{product.description}</p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Truck size={18} className="text-blue-600" />
          Доставка
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Товар будет включён в ближайший сбор по вашему маршруту. Срок зависит от погоды и
          заполнения маршрута.
        </p>
        {openProcurement ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{openProcurement.title}</span>
              <Badge variant="info">{openProcurement.currentVolumePercent}%</Badge>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${openProcurement.currentVolumePercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Доставка ориентировочно {formatShortDate(openProcurement.estimatedDelivery)}
            </p>
          </div>
        ) : null}
      </Card>

      <div className="flex flex-col gap-3">
        {quantity > 0 ? (
          <QuantityStepper
            quantity={quantity}
            onDecrease={() => void setQuantity(product.id, quantity - 1)}
            onIncrease={() => void setQuantity(product.id, quantity + 1)}
            className="w-full justify-between"
          />
        ) : (
          <Button fullWidth size="lg" onClick={handleAdd}>
            <Plus size={18} />
            В корзину
          </Button>
        )}

        {cartItemCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => void clearCart()}
          >
            <Trash2 size={18} />
            Очистить корзину
          </Button>
        ) : null}

        <Link
          to={routes.cart}
          className="block text-center text-sm font-medium text-blue-600"
        >
          Перейти в корзину
        </Link>
      </div>
    </PageShell>
  )
}
