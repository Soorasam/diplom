import { Link } from "react-router-dom"
import { Package } from "lucide-react"

import type { Product } from "@/shared/api/mock-db"
import { routes } from "@/shared/config/routes"
import { formatPrice } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => (
  <Link to={routes.product(product.id)} className="block">
    <Card padding="none" className="overflow-hidden transition hover:border-blue-200 hover:shadow-md">
      <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
        <Package className="text-slate-300" size={36} strokeWidth={1.25} />
      </div>

      <div className="p-3">
        {product.popular ? (
          <Badge variant="info" className="mb-1.5">
            Популярное
          </Badge>
        ) : null}

        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
          {product.name}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          {product.weightKg} кг · {product.unit}
        </p>

        <p className="mt-2 text-base font-bold text-blue-700">
          {formatPrice(product.price)}
        </p>
      </div>
    </Card>
  </Link>
)
