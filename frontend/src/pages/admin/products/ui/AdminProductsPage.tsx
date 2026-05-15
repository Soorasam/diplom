import { ShoppingBag } from "lucide-react"

import { useAdminProducts } from "@/entities/admin/api/useAdmin"
import { formatPrice } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminProductsPage = () => {
  const { data: products, isLoading } = useAdminProducts()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Товары" subtitle="Каталог кооперативных закупок" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <Card key={product.id}>
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  {product.popular ? <Badge variant="info">Популярное</Badge> : null}
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-blue-700">{formatPrice(product.price)}</p>
                  <p className="text-xs text-slate-400">
                    {product.weightKg} кг · {product.unit}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={ShoppingBag} title="Товаров нет" />
      )}
    </div>
  )
}
