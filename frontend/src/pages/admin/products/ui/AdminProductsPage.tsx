import { ShoppingBag } from "lucide-react"

import { useAdminProducts } from "@/entities/admin/api/useAdmin"
import { formatPrice } from "@/shared/lib/format"
import { ProductImage } from "@/shared/ui/product-image/ProductImage"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminProductsPage = () => {
  const { data: products, isLoading, isError, error } = useAdminProducts()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Товары" subtitle="Каталог из базы и MinIO" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50">
          <p className="text-sm text-red-800">
            {(error as Error)?.message ?? "Не удалось загрузить товары"}
          </p>
        </Card>
      ) : products && products.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <ProductImage src={product.imageUrl} alt={product.name} variant="card" />
              <div className="mt-3 flex flex-col gap-1">
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="line-clamp-2 text-xs text-slate-500">{product.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <p className="text-sm font-bold text-blue-700">{formatPrice(product.price)}</p>
                  <p className="text-xs text-slate-400">{product.unit}</p>
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
