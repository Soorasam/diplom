import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import type { Product } from "@/shared/api/mock-db"
import { useCartActions } from "@/features/cart/hooks/useCartActions"
import { useCartStore } from "@/features/cart/model/cart-store"
import { routes } from "@/shared/config/routes"
import { formatPrice } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { ProductImage } from "@/shared/ui/product-image/ProductImage"
import { QuantityStepper } from "@/shared/ui/quantity-stepper/QuantityStepper"

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const quantity =
    useCartStore((s) => s.items.find((i) => i.productId === product.id)?.quantity) ?? 0
  const { addItem, setQuantity } = useCartActions()

  const handleAdd = () => {
    void addItem(product.id, 1)
  }

  const handleDecrease = () => {
    void setQuantity(product.id, quantity - 1)
  }

  const handleIncrease = () => {
    void setQuantity(product.id, quantity + 1)
  }

  return (
    <Card
      padding="none"
      className="flex h-full flex-col overflow-hidden transition hover:border-blue-200 hover:shadow-md"
    >
      <Link to={routes.product(product.id)} className="block">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          variant="card"
          className="rounded-none border-0 border-b border-slate-100"
        />
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <Link to={routes.product(product.id)} className="block min-h-0 flex-1">
          {product.popular ? (
            <Badge variant="info" className="mb-2 w-fit shrink-0">
              Популярное
            </Badge>
          ) : null}

          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {product.name}
          </h3>

          <p className="mt-1 shrink-0 text-xs text-slate-500">
            {product.weightKg > 0 ? `${product.weightKg} кг · ` : ""}
            {product.unit}
          </p>

          <p className="mt-auto pt-2 text-base font-bold text-blue-700">
            {formatPrice(product.price)}
          </p>
        </Link>

        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          {quantity > 0 ? (
            <QuantityStepper
              size="sm"
              quantity={quantity}
              onDecrease={handleDecrease}
              onIncrease={handleIncrease}
              className="w-full justify-between"
            />
          ) : (
            <Button
              type="button"
              size="sm"
              fullWidth
              onClick={handleAdd}
              className="!min-h-9"
            >
              <Plus size={14} />
              В корзину
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
