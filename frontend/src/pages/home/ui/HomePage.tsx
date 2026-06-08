import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, ShoppingBag, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useSyncSelectedProcurement } from "@/features/procurement/hooks/useSyncSelectedProcurement"
import {
  useActiveProcurementsEnriched,
  useProcurement,
} from "@/entities/procurement/api/useProcurements"
import { useResidentJoinedProcurements } from "@/shared/hooks/useResidentJoinedProcurements"
import { useOrders } from "@/entities/order/api/useOrders"
import { useCategories, usePopularProducts } from "@/entities/product/api/useProducts"
import { routes } from "@/shared/config/routes"
import { useUserDeliverySettlement } from "@/shared/hooks/useUserDeliverySettlement"
import { cn } from "@/shared/lib/cn"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { ProcurementCard } from "@/widgets/procurement-card/ui/ProcurementCard"
import { ProductCard } from "@/widgets/product-card/ui/ProductCard"
import { ResidentProcurementHero } from "@/widgets/resident-procurement-hero/ui/ResidentProcurementHero"

export const HomePage = () => {
  const user = useAuthStore((s) => s.user)
  useSyncSelectedProcurement()
  const { settlementName, locationId } = useUserDeliverySettlement()
  const userPickupPointId = user?.pickupPointId ?? locationId
  const { data: orders } = useOrders(user?.id)
  const { data: openProcurementsNearby } = useActiveProcurementsEnriched()
  const { joinedProcurements, isLoading: loadingProcurements } =
    useResidentJoinedProcurements(user?.id, orders)
  const { data: popular, isLoading: loadingPopular } = usePopularProducts()
  const { data: categories } = useCategories()

  const [selectedProcurementId, setSelectedProcurementId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (joinedProcurements.length === 0) {
      setSelectedProcurementId(null)
      return
    }
    if (
      selectedProcurementId &&
      joinedProcurements.some((p) => p.id === selectedProcurementId)
    ) {
      return
    }
    const withActiveOrder = orders?.find(
      (o) => o.status !== "delivered" && o.status !== "cancelled",
    )
    const preferred = withActiveOrder
      ? joinedProcurements.find((p) => p.id === withActiveOrder.procurementId)
      : joinedProcurements[0]
    setSelectedProcurementId(preferred?.id ?? joinedProcurements[0].id)
  }, [joinedProcurements, orders, selectedProcurementId])

  const { data: procurementDetail } = useProcurement(selectedProcurementId ?? "")

  const selectedProcurement =
    procurementDetail ??
    joinedProcurements.find((p) => p.id === selectedProcurementId)

  const procurementOrders = useMemo(
    () =>
      (orders ?? []).filter(
        (o) =>
          o.procurementId === selectedProcurementId &&
          o.status !== "cancelled",
      ),
    [orders, selectedProcurementId],
  )

  const showHero = Boolean(selectedProcurement)

  return (
    <div className="flex min-h-full flex-col font-sans">
      <header className="border-b border-slate-200 bg-white px-4 pb-4 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] dark:border-slate-800 dark:bg-[#18202C]">
        <div className="mx-auto w-full max-w-[480px]">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {settlementName ? `Посёлок: ${settlementName}` : "Коопзакупки"}
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
            {user ? `Здравствуйте, ${user.name.split(" ")[0]}` : "Кооперативная доставка"}
          </h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4 p-4 pb-28">
        {loadingProcurements ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : showHero && selectedProcurement ? (
          <>
            {joinedProcurements.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {joinedProcurements.map((p) => {
                  const active = p.id === selectedProcurementId
                  const orderCount = (orders ?? []).filter(
                    (o) => o.procurementId === p.id && o.status !== "cancelled",
                  ).length
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProcurementId(p.id)}
                      className={cn(
                        "shrink-0 rounded-xl border px-3 py-2 text-left transition-colors",
                        active
                          ? "border-sky-500 bg-sky-50 dark:border-sky-600 dark:bg-sky-950/40"
                          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/60",
                      )}
                    >
                      <p
                        className={cn(
                          "max-w-[10rem] truncate text-sm font-semibold",
                          active
                            ? "text-sky-900 dark:text-sky-100"
                            : "text-slate-900 dark:text-slate-100",
                        )}
                      >
                        {p.title}
                      </p>
                      {orderCount > 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {orderCount} заказ(ов)
                        </p>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ) : null}

            <ResidentProcurementHero
              procurement={selectedProcurement}
              orders={procurementOrders}
              settlementName={settlementName}
              userPickupPointId={userPickupPointId}
            />
          </>
        ) : (
          <Card className="w-full p-5 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Нет активного сбора
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Вступите в сбор вашего посёлка, чтобы заказывать товары
            </p>
            <Link to={routes.user.activeProcurements} className="ui-cta ui-cta-primary mt-4">
              <Truck size={18} />
              Активные сборы
            </Link>
          </Card>
        )}

        {!showHero && joinedProcurements.length === 0 ? (
          <section className="w-full">
            <div className="mb-3 flex w-full items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Сборы рядом
              </h2>
              <Link to={routes.user.activeProcurements} className="ui-link text-sm">
                Все
              </Link>
            </div>
            <div className="flex w-full flex-col gap-2">
              {openProcurementsNearby?.slice(0, 2).map((p) => (
                <Link key={p.id} to={routes.user.procurement(p.id)} className="w-full">
                  <ProcurementCard procurement={p} compact />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="w-full">
          <div className="mb-3 flex w-full items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Популярное
            </h2>
            <Link to={routes.user.catalog} className="ui-link text-sm">
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
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Категории
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`${routes.user.catalog}?category=${cat.id}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300"
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
