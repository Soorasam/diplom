import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { MapPin, Package, Route, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import { queryKeys } from "@/shared/config/query-keys"
import { routes } from "@/shared/config/routes"
import { isCoordinatorRouteInProgress } from "@/shared/lib/driver-round-workload"
import { getDriverRouteDisplayStatus } from "@/shared/lib/driver-route-display"
import {
  groupOrdersBySettlement,
  isAwaitingTripAccept,
} from "@/shared/lib/driver-orders"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const deliveryModeLabel = {
  winter_road: "Зимник",
  river: "Речной",
  air: "Авиа",
  mixed: "Смешанный",
} as const

export const DriverDashboardPage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"

  const { data: driverRoutes, isLoading: loadingRoutes } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
  })

  const { data: settlements } = useSettlements()

  const { data: driverOrders, isLoading: loadingOrders } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
  })

  const rawActiveRoute = driverRoutes?.find((r) => r.status === "active")
  const activeRoute =
    rawActiveRoute && isCoordinatorRouteInProgress(rawActiveRoute, driverOrders)
      ? rawActiveRoute
      : undefined
  const todayRoutes = driverRoutes ?? []
  const nextSettlementId = activeRoute?.toSettlementIds[0]
  const nextStop = settlements?.find((s) => s.id === nextSettlementId)
  const ordersBySettlement = groupOrdersBySettlement(driverOrders ?? [])
  const awaitingAccept = (driverOrders ?? []).filter(isAwaitingTripAccept)
  const awaitingAcceptCount = awaitingAccept.length
  const inTransitCount =
    driverOrders?.filter(
      (o) => o.status === "in_transit" || o.status === "at_pickup",
    ).length ?? 0

  const currentStop = activeRoute?.deliveryStops?.find(
    (s) => s.status !== "completed",
  )
  const currentStopOrders = currentStop
    ? ordersBySettlement.get(currentStop.pickupPointId) ?? []
    : []
  const pendingConfirmCount = currentStopOrders.filter(
    (o) => o.status === "in_transit" || o.status === "at_pickup",
  ).length

  const isLoading = loadingRoutes || loadingOrders

  return (
    <PageShell>
      <PageHeader
        title="Сводка на сегодня"
        subtitle={user?.name ?? "Водитель"}
      />

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <Card className="ui-panel-gradient border-sky-200 !p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Сейчас
            </p>
            {awaitingAcceptCount > 0 ? (
              <>
                <p className="mt-1 font-semibold text-slate-900">
                  Примите {awaitingAcceptCount} оплаченных заказ(ов) в рейс
                </p>
                <Link
                  to={routes.driver.route}
                  className="ui-cta ui-cta-primary ui-cta-block mt-3"
                >
                  Открыть рейс
                </Link>
              </>
            ) : activeRoute && currentStop ? (
              <>
                <p className="mt-1 font-semibold text-slate-900">
                  {currentStop.label}
                  {currentStop.expectsOrders
                    ? ` · ${currentStop.receivedOrders}/${currentStop.totalOrders} подтвердили`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {currentStop.expectsOrders
                    ? pendingConfirmCount > 0
                      ? `Обойдите ${currentStopOrders.length} жителей по адресам · ${pendingConfirmCount} ждут подтверждения`
                      : `Обойдите жителей по адресам в посёлке`
                    : "Этап закупки или проезда"}
                </p>
                <Link
                  to={routes.driver.route}
                  className="ui-cta ui-cta-primary ui-cta-block mt-3"
                >
                  Открыть рейс
                </Link>
              </>
            ) : (
              <>
                <p className="mt-1 font-semibold text-slate-900">
                  Нет активного рейса
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Откройте или закройте сбор в разделе «Сборы»
                </p>
                <Link
                  to={routes.driver.procurements}
                  className="ui-cta ui-cta-outline ui-cta-block mt-3"
                >
                  Перейти к сборам
                </Link>
              </>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="ui-panel p-4">
              <div className="flex items-center gap-2">
                <div className="ui-icon-soft flex h-9 w-9 items-center justify-center rounded-lg">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                    Маршрутов
                  </p>
                  <p className="text-xl font-bold leading-normal text-slate-900 dark:text-slate-100">
                    {todayRoutes.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="ui-panel p-4">
              <div className="flex items-center gap-2">
                <div className="ui-icon-soft flex h-9 w-9 items-center justify-center rounded-lg">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                    Заказов
                  </p>
                  <p className="text-xl font-bold leading-normal text-slate-900 dark:text-slate-100">
                    {driverOrders?.length ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="ui-icon-soft flex h-10 w-10 shrink-0 rounded-2xl">
                  <Package size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-normal text-slate-500 dark:text-slate-400">
                    К принятию
                  </p>
                  <p className="text-lg font-semibold leading-normal text-slate-900 dark:text-slate-100">
                    {awaitingAcceptCount}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="ui-icon-soft flex h-10 w-10 shrink-0 rounded-2xl">
                  <Truck size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-normal text-slate-500 dark:text-slate-400">
                    В доставке
                  </p>
                  <p className="text-lg font-semibold leading-normal text-slate-900 dark:text-slate-100">
                    {inTransitCount}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {nextStop ? (
            <Card className="ui-panel-gradient p-4">
              <div className="flex items-center gap-3">
                <div className="ui-icon-solid flex h-10 w-10 items-center justify-center rounded-2xl">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium leading-normal text-sky-600 dark:text-sky-400">
                    Следующая остановка
                  </p>
                  <p className="font-semibold leading-normal text-slate-900 dark:text-slate-100">
                    {nextStop.name}
                  </p>
                  <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                    {nextStop.ulus} улус
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <div>
            <div className="ornament-divider mb-3" aria-hidden />
            <p className="ui-section-title mb-3">Маршруты</p>
            <div className="flex flex-col gap-2">
              {todayRoutes.length === 0 ? (
                <Card className="p-4 text-center text-sm text-slate-500">
                  Нет активных маршрутов. Откройте сбор в разделе «Сборы» — маршрут появится здесь.
                </Card>
              ) : (
                todayRoutes.map((route) => {
                  const display = getDriverRouteDisplayStatus(route, driverOrders)

                  return (
                    <Link key={route.id} to={routes.driver.route}>
                      <Card className="ui-link-card p-4 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium leading-normal text-slate-900 dark:text-slate-100">
                              {route.name}
                            </p>
                            <p className="text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                              {deliveryModeLabel[route.deliveryMode]}
                            </p>
                          </div>
                          <Badge variant={display.variant}>{display.label}</Badge>
                        </div>
                      </Card>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {activeRoute ? (
            <p className="text-center text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
              Доставка в пути — маршрут «{activeRoute.name}»
            </p>
          ) : null}
        </>
      )}
    </PageShell>
  )
}
