import { useParams, Link, useSearchParams } from "react-router-dom"
import { Plus, Truck } from "lucide-react"

import { useProduct } from "@/entities/product/api/useProducts"
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
import { ProductImage } from "@/shared/ui/product-image/ProductImage"
import { QuantityStepper } from "@/shared/ui/quantity-stepper/QuantityStepper"
import { ProcurementProgress } from "@/widgets/procurement-progress/ui/ProcurementProgress"

export const ProductPage = () => {
  const { id = "" } = useParams()
  const { data: product, isLoading } = useProduct(id)
  const [searchParams] = useSearchParams()
  const roundFromUrl = searchParams.get("round") ?? undefined
  const procurementIdFromStore = useCartStore((s) => s.procurementId)
  useSyncSelectedProcurement(roundFromUrl ?? undefined)

  const activeRoundId = roundFromUrl ?? procurementIdFromStore ?? ""
  const { procurement: openProcurement } = useOpenSelectedProcurement(activeRoundId)
  const { addItem, setQuantity } = useCartActions()
  const setProcurement = useCartStore((s) => s.setProcurement)
  const quantity =
    useCartStore((s) => s.items.find((i) => i.productId === id)?.quantity) ?? 0

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
      <PageHeader title={product.name} backTo={routes.catalog} className="!mb-0" />

      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        variant="detail"
        className="rounded-2xl border border-slate-200 dark:border-slate-800"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="ui-price text-3xl leading-tight">{formatPrice(product.price)}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {product.weightKg > 0 ? `${product.weightKg} кг · ` : ""}
            {product.unit}
          </p>
        </div>
        {quantity > 0 ? (
          <QuantityStepper
            quantity={quantity}
            onDecrease={() => void setQuantity(product.id, quantity - 1)}
            onIncrease={() => void setQuantity(product.id, quantity + 1)}
            className="shrink-0"
          />
        ) : (
          <Button
            size="lg"
            className="h-11 w-[7.25rem] shrink-0 justify-center px-0"
            onClick={handleAdd}
            aria-label="В корзину"
          >
            <Plus size={20} />
          </Button>
        )}
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Описание</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {product.description}
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <Truck size={18} className="text-sky-600 dark:text-sky-400" />
          Доставка
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Товар будет включён в ближайший сбор по вашему маршруту. Срок зависит от погоды и
          заполнения маршрута.
        </p>
        {openProcurement ? (
          <div className="mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">{openProcurement.title}</p>
            <div className="mt-2">
              <ProcurementProgress procurement={openProcurement} size="sm" />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Доставка ориентировочно {formatShortDate(openProcurement.estimatedDelivery)}
            </p>
          </div>
        ) : null}
      </Card>

      <Link to={routes.cart} className="ui-link block text-center text-sm">
        Перейти в корзину
      </Link>
    </PageShell>
  )
}
