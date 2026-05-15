import { Link } from "react-router-dom"
import {
  ArrowRight,
  MapPin,
  ShoppingBag,
  Snowflake,
  Truck,
} from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
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
  const { data: procurements, isLoading: loadingProcurements } = useActiveProcurements()
  const { data: orders } = useOrders(user?.id)
  const { data: popular, isLoading: loadingPopular } = usePopularProducts()
  const { data: categories } = useCategories()

  const activeOrder = orders?.find((o) => o.status !== "delivered" && o.status !== "cancelled")
  const nearestDelivery = procurements?.[0]?.estimatedDelivery

  return (
    <div className="flex flex-col gap-5 p-4">
      <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 px-5 py-6 text-white shadow-lg">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-200/90">
          Северные закупки
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">
          {user ? `Здравствуйте, ${user.name.split(" ")[0]}` : "Кооперативная доставка"}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Объединяем заказы жителей отдалённых посёлков Якутии
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <Snowflake size={14} />
            Сезонные маршруты
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
            <MapPin size={14} />
            Пункты выдачи
          </span>
        </div>
      </header>

      {nearestDelivery ? (
        <Card className="border-blue-100 bg-blue-50/50">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Truck size={20} />
            </span>
            <div>
              <p className="text-xs font-medium text-blue-800">Ближайшая доставка</p>
              <p className="text-sm font-semibold text-slate-900">
                ориентир — {formatShortDate(nearestDelivery)}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {activeOrder ? (
        <Link to={routes.order(activeOrder.id)}>
          <Card className="transition hover:border-blue-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500">Активный заказ</p>
                <p className="font-semibold text-slate-900">№ {activeOrder.id}</p>
              </div>
              <Badge variant={orderStatusVariant[activeOrder.status]}>
                {orderStatusLabel[activeOrder.status]}
              </Badge>
            </div>
          </Card>
        </Link>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Активные сборы</h2>
          <Link to={routes.catalog} className="text-xs font-medium text-blue-600">
            Все
          </Link>
        </div>
        {loadingProcurements ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {procurements?.slice(0, 2).map((p) => (
              <ProcurementCard key={p.id} procurement={p} compact />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Популярное</h2>
          <Link to={routes.catalog} className="text-xs font-medium text-blue-600">
            Каталог
          </Link>
        </div>
        {loadingPopular ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {popular?.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {categories && categories.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Категории</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`${routes.catalog}?category=${cat.id}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Link
        to={routes.catalog}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
      >
        <ShoppingBag size={18} />
        Перейти в каталог
        <ArrowRight size={18} />
      </Link>
    </div>
  )
}
