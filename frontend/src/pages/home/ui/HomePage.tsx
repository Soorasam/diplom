import { Link } from "react-router-dom"
import {
  ArrowRight,
  MapPin,
  ShoppingBag,
  Snowflake,
  Truck,
} from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useSyncSelectedProcurement } from "@/features/procurement/hooks/useSyncSelectedProcurement"
import { useActiveProcurements } from "@/entities/procurement/api/useProcurements"
import { useOrders } from "@/entities/order/api/useOrders"
import { useCategories, usePopularProducts } from "@/entities/product/api/useProducts"
import { routes } from "@/shared/config/routes"
import { formatShortDate } from "@/shared/lib/format"
import { orderStatusLabel, orderStatusVariant } from "@/shared/lib/order-status"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { ProcurementCard } from "@/widgets/procurement-card/ui/ProcurementCard"
import { ProductCard } from "@/widgets/product-card/ui/ProductCard"

export const HomePage = () => {
  const user = useAuthStore((s) => s.user)
  useSyncSelectedProcurement()
  const { data: procurements, isLoading: loadingProcurements } = useActiveProcurements()
  const { data: orders } = useOrders(user?.id)
  const { data: popular, isLoading: loadingPopular } = usePopularProducts()
  const { data: categories } = useCategories()

  const activeOrder = orders?.find((o) => o.status !== "delivered" && o.status !== "cancelled")
  const nearestDelivery = procurements?.[0]?.estimatedDelivery

  return (
    <div className="flex min-h-full flex-col font-sans">
      <header className="home-hero ornament-frame relative z-10 w-full shrink-0 overflow-hidden rounded-b-2xl">
        <div className="relative z-10 mx-auto w-full max-w-[480px] px-4 pb-6 pt-[max(1.5rem,calc(env(safe-area-inset-top,0px)+1rem))]">
          <p className="text-[11px] font-semibold uppercase leading-normal tracking-[0.14em] text-sky-200/90">
            Северные закупки
          </p>
          <h1 className="mt-3 text-2xl font-bold leading-normal tracking-tight text-white">
            {user ? `Здравствуйте, ${user.name.split(" ")[0]}` : "Кооперативная доставка"}
          </h1>
          <p className="mt-2 max-w-sm text-sm font-normal leading-relaxed text-slate-200">
            Объединяем заказы жителей отдалённых посёлков Якутии
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="pattern-hero-chip">
              <Snowflake size={14} />
              Сезонные маршруты
            </span>
            <span className="pattern-hero-chip">
              <MapPin size={14} />
              Пункты выдачи
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-4 p-4 pb-28">
        {nearestDelivery ? (
          <Card className="w-full p-4">
            <div className="flex items-center gap-3">
              <span className="ui-icon-well h-11 w-11">
                <Truck size={20} />
              </span>
              <div>
                <p className="text-xs font-medium leading-normal text-sky-600 dark:text-sky-400">
                  Ближайшая доставка
                </p>
                <p className="mt-1 text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
                  ориентир — {formatShortDate(nearestDelivery)}
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {activeOrder ? (
          <Link to={routes.user.order(activeOrder.id)} className="w-full">
            <Card className="ui-card-interactive w-full p-4 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                    Активный заказ
                  </p>
                  <p className="mt-1 font-semibold leading-normal text-slate-900 dark:text-slate-100">
                    № {activeOrder.id}
                  </p>
                </div>
                <Badge variant={orderStatusVariant[activeOrder.status]}>
                  {orderStatusLabel[activeOrder.status]}
                </Badge>
              </div>
            </Card>
          </Link>
        ) : null}

        <section className="w-full">
          <div className="ornament-divider mb-4" aria-hidden />
          <div className="mb-3 flex w-full items-center justify-between gap-2">
            <h2 className="ui-section-title">Активные сборы</h2>
            <Link to={routes.user.activeProcurements} className="ui-link">
              Все
            </Link>
          </div>
          {loadingProcurements ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              {procurements?.slice(0, 2).map((p) => (
                <Link key={p.id} to={routes.user.procurement(p.id)} className="w-full">
                  <ProcurementCard procurement={p} compact />
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link to={routes.user.activeProcurements} className="ui-cta ui-cta-primary">
          <Truck size={18} />
          Активные сборы
          <ArrowRight size={18} />
        </Link>

        <section className="w-full">
          <div className="ornament-divider mb-4" aria-hidden />
          <div className="mb-3 flex w-full items-center justify-between gap-2">
            <h2 className="ui-section-title">Популярное</h2>
            <Link to={routes.user.catalog} className="ui-link">
              Каталог
            </Link>
          </div>
          {loadingPopular ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="product-grid-tight w-full">
              {popular?.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {categories && categories.length > 0 ? (
          <section className="w-full">
            <h2 className="ui-section-title mb-3">Категории</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`${routes.user.catalog}?category=${cat.id}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-sky-700 transition-colors hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-400 dark:hover:border-slate-600 dark:hover:bg-slate-700"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <Link to={routes.user.catalog} className="ui-cta ui-cta-outline">
          <ShoppingBag size={18} />
          Каталог
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}
