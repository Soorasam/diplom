import { useEffect, useMemo, useRef, useState } from "react"

import { Link, useSearchParams } from "react-router-dom"

import { Search } from "lucide-react"



import { useCartStore } from "@/features/cart/model/cart-store"

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

import { cn } from "@/shared/lib/cn"



export const CatalogPage = () => {

  const [searchParams] = useSearchParams()

  const roundFromUrl = searchParams.get("round") ?? undefined

  const procurementIdFromStore = useCartStore((s) => s.procurementId)

  const setProcurement = useCartStore((s) => s.setProcurement)

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
  const filtersEndRef = useRef<HTMLDivElement>(null)
  const [compactSearch, setCompactSearch] = useState(false)

  useEffect(() => {
    const target = filtersEndRef.current
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => setCompactSearch(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: "0px" },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [loadingRound, openProcurement])



  const filters = useMemo<ProductFilters>(

    () => ({ search: search || undefined, categoryId, sort }),

    [search, categoryId, sort],

  )



  const { data: categories } = useCategories()

  const { data: products, isLoading } = useProducts(filters)

  const { data: procurements } = useActiveProcurements()

  const hasOpenProcurements = (procurements?.length ?? 0) > 0



  return (

    <PageShell>

        {loadingRound && activeRoundId ? (

          <div className="flex justify-center py-8">

            <Spinner />

          </div>

        ) : null}



        {closedProcurement ? (

          <AlertBanner variant="warning" title="Сбор завершён">

            «{closedProcurement.title}» больше не принимает заказы.{" "}

            <Link to={routes.user.activeProcurements} className="ui-link font-semibold underline">

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

            <Link to={routes.user.activeProcurements} className="ui-link font-semibold underline">

              Сборы

            </Link>

            .

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

        <div
          className={cn(
            "fixed left-[50vw] z-50 w-screen max-w-[480px] -translate-x-1/2 border-b border-slate-200 bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] transition-[transform,opacity] duration-200 dark:border-slate-800 dark:bg-[#18202C]",
            "top-0",
            compactSearch
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          )}
          aria-hidden={!compactSearch}
        >
          <Input
            placeholder="Поиск товаров…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Поиск (компактный)"
          />
        </div>

        <Card className="space-y-4 p-0" padding="none">

          <div className="p-4">

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

              className={`ui-pill shrink-0 ${

                !categoryId ? "ui-pill-active" : "ui-pill-inactive"

              }`}

            >

              Все

            </button>

            {categories?.map((cat) => (

              <button

                key={cat.id}

                type="button"

                onClick={() => setCategoryId(cat.id)}

                className={`ui-pill shrink-0 ${

                  categoryId === cat.id ? "ui-pill-active" : "ui-pill-inactive"

                }`}

              >

                {cat.name}

              </button>

            ))}

          </div>



          <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">

            <label className="block text-xs font-medium leading-normal text-slate-500 dark:text-slate-400">

              Сортировка

              <select

                value={sort ?? "name"}

                onChange={(e) => setSort(e.target.value as ProductFilters["sort"])}

                className="mt-2 w-full min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"

              >

                <option value="name">По названию</option>

                <option value="price_asc">Цена: сначала дешевле</option>

                <option value="price_desc">Цена: сначала дороже</option>

              </select>

            </label>

          </div>

        </Card>

        <div ref={filtersEndRef} className="h-px w-full shrink-0" aria-hidden />

        <section>

          <h2 className="ui-section-title mb-3">

            {isLoading ? "Загрузка…" : `Товары${products ? ` (${products.length})` : ""}`}

          </h2>

          {isLoading ? (

            <div className="flex justify-center py-12">

              <Spinner />

            </div>

          ) : products && products.length > 0 ? (

            <div className="product-grid-tight">

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



    </PageShell>

  )

}

