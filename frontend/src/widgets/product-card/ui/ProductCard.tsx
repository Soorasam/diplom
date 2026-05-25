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
      className="ui-card-interactive flex h-full flex-col overflow-hidden"
    >
      <Link to={routes.user.product(product.id)} className="block">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          variant="card"
          className="rounded-none border-0 border-b border-slate-200 dark:border-slate-800"
        />
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        <Link to={routes.user.product(product.id)} className="block min-h-0 flex-1">
          {product.popular ? (
            <Badge variant="warning" className="mb-2 w-fit shrink-0">
              Популярное
            </Badge>
          ) : null}

          <h3 className="line-clamp-2 text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
            {product.name}
          </h3>

          <p className="mt-1 shrink-0 text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
            {product.weightKg > 0 ? `${product.weightKg} кг · ` : ""}
            {product.unit}
          </p>

          <p className="ui-price mt-auto pt-2">{formatPrice(product.price)}</p>
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
