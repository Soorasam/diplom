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
  <Link to={routes.product(product.id)} className="block h-full">
    <Card
      padding="none"
      className="flex h-full flex-col overflow-hidden transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex aspect-square shrink-0 items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50">
        <Package className="text-slate-300" size={36} strokeWidth={1.25} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3">
        {product.popular ? (
          <Badge variant="info" className="mb-2 w-fit shrink-0">
            Популярное
          </Badge>
        ) : null}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {product.name}
        </h3>

        <p className="mt-1 shrink-0 text-xs text-slate-500">
          {product.weightKg} кг · {product.unit}
        </p>

        <p className="mt-auto pt-2 text-base font-bold text-blue-700">
          {formatPrice(product.price)}
        </p>
      </div>
    </Card>
  </Link>
)
