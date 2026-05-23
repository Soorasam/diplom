import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Search, ShoppingCart } from "lucide-react"

import { useCartStore } from "@/features/cart/model/cart-store"
import { useValidCartItemCount } from "@/features/cart/hooks/useCartSync"
import { useProcurementParticipation } from "@/features/procurement/hooks/useProcurementParticipation"
import { useOpenSelectedProcurement } from "@/features/procurement/hooks/useOpenSelectedProcurement"
import { useSyncSelectedProcurement } from "@/features/procurement/hooks/useSyncSelectedProcurement"
import { useActiveProcurements } from "@/entities/procurement/api/useProcurements"
import { useCategories, useProducts } from "@/entities/product/api/useProducts"
import type { ProductFilters } from "@/entities/product/api/productsApi"
import { routes } from "@/shared/config/routes"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Input } from "@/shared/ui/input/Input"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Card } from "@/shared/ui/card/Card"
import { ProductCard } from "@/widgets/product-card/ui/ProductCard"
import { ActiveProcurementBanner } from "@/widgets/active-procurement-banner/ui/ActiveProcurementBanner"

export const CatalogPage = () => {
  const [searchParams] = useSearchParams()
  const roundFromUrl = searchParams.get("round") ?? undefined
  const procurementIdFromStore = useCartStore((s) => s.procurementId)
  const setProcurement = useCartStore((s) => s.setProcurement)
  const cartCount = useValidCartItemCount()

  useSyncSelectedProcurement(roundFromUrl)

  const activeRoundId = roundFromUrl ?? procurementIdFromStore ?? ""

  useEffect(() => {
    if (roundFromUrl) setProcurement(roundFromUrl)
  }, [roundFromUrl, setProcurement])

  const {
    procurement: openProcurement,
    closedProcurement,
    isLoading: loadingRound,
  } = useOpenSelectedProcurement(activeRoundId)

  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState<string | undefined>(
    searchParams.get("category") ?? undefined,
  )
  const [sort, setSort] = useState<ProductFilters["sort"]>("name")

  const filters = useMemo<ProductFilters>(
    () => ({ search: search || undefined, categoryId, sort }),
    [search, categoryId, sort],
  )

  const { data: categories } = useCategories()
  const { data: products, isLoading } = useProducts(filters)
  const { data: procurements } = useActiveProcurements()
  const { hasJoined, isAuthenticated, procurementId: selectedRoundId } =
    useProcurementParticipation()

  const hasOpenProcurements = (procurements?.length ?? 0) > 0

  return (
    <PageShell>
        {loadingRound && activeRoundId ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : openProcurement ? (
          <ActiveProcurementBanner procurement={openProcurement} />
        ) : null}

        {closedProcurement ? (
          <AlertBanner variant="warning" title="Сбор завершён">
            «{closedProcurement.title}» больше не принимает заказы.{" "}
            <Link to={routes.activeProcurements} className="font-semibold text-blue-700 underline">
              Выберите открытый сбор
            </Link>
            .
          </AlertBanner>
        ) : null}

        {!openProcurement &&
        !closedProcurement &&
        !loadingRound &&
        hasOpenProcurements ? (
          <AlertBanner variant="info" title="Сбор не выбран">
            Товары можно добавить в корзину. Сбор выберите в корзине или в разделе{" "}
            <Link to={routes.activeProcurements} className="font-semibold text-blue-700 underline">
              Сборы
            </Link>
            .
          </AlertBanner>
        ) : null}

        {openProcurement && isAuthenticated && selectedRoundId && !hasJoined ? (
          <AlertBanner variant="info" title="Вступите перед оплатой">
            Товары в корзине сохранятся. Перед оформлением нажмите «Вступить в сбор» в корзине.
          </AlertBanner>
        ) : null}

        <PageHeader
          title="Каталог"
          subtitle={
            openProcurement
              ? "Добавьте товары в корзину, затем оплатите заказ"
              : "Каталог товаров — сбор можно выбрать при оформлении"
          }
          className="!mb-0"
        />

        <Card className="space-y-4 !p-4" padding="none">
          <div className="px-4 pt-4">
            <Input
              placeholder="Поиск товаров…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Поиск"
            />
          </div>

          <div
            className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none"
            data-no-swipe
          >
            <button
              type="button"
              onClick={() => setCategoryId(undefined)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                !categoryId
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Все
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  categoryId === cat.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <label className="block text-xs font-medium text-slate-500">
              Сортировка
              <select
                value={sort ?? "name"}
                onChange={(e) => setSort(e.target.value as ProductFilters["sort"])}
                className="mt-1.5 w-full min-h-11 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-800"
              >
                <option value="name">По названию</option>
                <option value="price_asc">Цена: сначала дешевле</option>
                <option value="price_desc">Цена: сначала дороже</option>
              </select>
            </label>
          </div>
        </Card>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            {isLoading ? "Загрузка…" : `Товары${products ? ` (${products.length})` : ""}`}
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="Товары не найдены"
              description="Измените поиск или категорию"
            />
          )}
        </section>

      {cartCount > 0 ? (
        <Link
          to={routes.cart}
          className="fixed bottom-[5.25rem] right-4 z-30 flex items-center gap-2 rounded-full bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95 sm:right-[calc(50%-220px)]"
        >
          <ShoppingCart size={18} />
          {cartCount > 9 ? "9+" : cartCount}
        </Link>
      ) : null}
    </PageShell>
  )
}
