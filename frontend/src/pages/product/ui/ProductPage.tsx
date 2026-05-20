import { useParams, Link } from "react-router-dom"
import { Plus, Truck } from "lucide-react"

import { useProduct } from "@/entities/product/api/useProducts"
import { useActiveProcurements } from "@/entities/procurement/api/useProcurements"
import { useCartStore } from "@/features/cart/model/cart-store"
import { routes } from "@/shared/config/routes"
import { formatPrice, formatShortDate } from "@/shared/lib/format"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { Badge } from "@/shared/ui/badge/Badge"
import { ProductImage } from "@/shared/ui/product-image/ProductImage"

export const ProductPage = () => {
  const { id = "" } = useParams()
  const { data: product, isLoading } = useProduct(id)
  const { data: procurements } = useActiveProcurements()
  const addItem = useCartStore((s) => s.addItem)
  const setProcurement = useCartStore((s) => s.setProcurement)

  const procurement = procurements?.[0]

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-4">
        <PageHeader title="Товар не найден" backTo={routes.catalog} />
      </div>
    )
  }

  const handleAdd = () => {
    if (procurement) setProcurement(procurement.id)
    addItem(product.id)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title={product.name} backTo={routes.catalog} />

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
        {procurement ? (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{procurement.title}</span>
              <Badge variant="info">{procurement.currentVolumePercent}%</Badge>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${procurement.currentVolumePercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Доставка ориентировочно {formatShortDate(procurement.estimatedDelivery)}
            </p>
          </div>
        ) : null}
      </Card>

      <Button fullWidth size="lg" onClick={handleAdd}>
        <Plus size={18} />
        В корзину
      </Button>

      <Link
        to={routes.cart}
        className="block text-center text-sm font-medium text-blue-600"
      >
        Перейти в корзину
      </Link>
    </div>
  )
}
