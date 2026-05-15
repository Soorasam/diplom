import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useActiveProcurements } from "@/entities/procurement/api/useProcurements"
import { useCategories, useProducts } from "@/entities/product/api/useProducts"
import type { ProductFilters } from "@/entities/product/api/productsApi"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Input } from "@/shared/ui/input/Input"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { ProductCard } from "@/widgets/product-card/ui/ProductCard"
import { ProcurementCard } from "@/widgets/procurement-card/ui/ProcurementCard"
import { Package } from "lucide-react"

export const CatalogPage = () => {
  const [searchParams] = useSearchParams()
  const categoryFromUrl = searchParams.get("category") ?? undefined

  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string | undefined>(categoryFromUrl)
  const [sort, setSort] = useState<ProductFilters["sort"]>("name")

  const filters = useMemo<ProductFilters>(
    () => ({ search: search || undefined, categoryId, sort }),
    [search, categoryId, sort],
  )

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts(filters)
  const { data: procurements, isLoading: loadingProcurements } = useActiveProcurements()

  return (
    <div className="flex flex-col gap-5 p-4">
      <PageHeader
        title="Каталог"
        subtitle="Товары привязаны к активным сборам по маршрутам доставки"
      />

      <Input
        placeholder="Поиск товаров…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Поиск"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryId(undefined)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            !categoryId
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          Все
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              categoryId === cat.id
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <label className="block text-xs font-medium text-slate-600">
        Сортировка
        <select
          value={sort ?? "name"}
          onChange={(e) => setSort(e.target.value as ProductFilters["sort"])}
          className="mt-1 w-full min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="name">По названию</option>
          <option value="price_asc">Цена ↑</option>
          <option value="price_desc">Цена ↓</option>
        </select>
      </label>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title="Товары не найдены"
          description="Попробуйте изменить фильтры или поисковый запрос"
        />
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Активные сборы</h2>
        {loadingProcurements ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-3">
            {procurements?.map((p) => (
              <ProcurementCard key={p.id} procurement={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
