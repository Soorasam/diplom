import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { MapPin, Package, Route, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import { queryKeys } from "@/shared/config/query-keys"
import { routes } from "@/shared/config/routes"
import { formatShortDate } from "@/shared/lib/format"
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

const routeStatusLabel = {
  planned: "Запланирован",
  active: "Активен",
  completed: "Завершён",
} as const

const routeStatusVariant = {
  planned: "warning" as const,
  active: "info" as const,
  completed: "success" as const,
}

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

  const activeRoute = driverRoutes?.find((r) => r.status === "active")
  const todayRoutes = driverRoutes?.filter((r) => r.status !== "completed") ?? []
  const nextSettlementId = activeRoute?.toSettlementIds[0]
  const nextStop = settlements?.find((s) => s.id === nextSettlementId)
  const inTransitCount =
    driverOrders?.filter((o) => o.status === "in_transit" || o.status === "at_pickup")
      .length ?? 0

  const isLoading = loadingRoutes || loadingOrders

  return (
    <PageShell>
      <PageHeader
        title="Сводка на сегодня"
        subtitle={user?.name ?? "Водитель"}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-blue-100 bg-blue-50/40">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Route size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Маршрутов</p>
                  <p className="text-xl font-bold text-slate-900">{todayRoutes.length}</p>
                </div>
              </div>
            </Card>

            <Card className="border-blue-100 bg-blue-50/40">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Заказов</p>
                  <p className="text-xl font-bold text-slate-900">{driverOrders?.length ?? 0}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Truck size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500">В доставке</p>
                <p className="text-lg font-semibold text-slate-900">{inTransitCount} заказов</p>
              </div>
            </div>
          </Card>

          {nextStop ? (
            <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/60">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700">Следующая остановка</p>
                  <p className="font-semibold text-slate-900">{nextStop.name}</p>
                  <p className="text-xs text-slate-500">{nextStop.ulus} улус</p>
                </div>
              </div>
            </Card>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Маршруты</p>
            <div className="flex flex-col gap-2">
              {driverRoutes?.map((route) => (
                <Link key={route.id} to={routes.driver.route}>
                  <Card className="transition hover:border-blue-200">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{route.name}</p>
                        <p className="text-xs text-slate-500">
                          {deliveryModeLabel[route.deliveryMode]}
                        </p>
                      </div>
                      <Badge variant={routeStatusVariant[route.status]}>
                        {routeStatusLabel[route.status]}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {activeRoute ? (
            <p className="text-center text-xs text-slate-500">
              Активный маршрут — ориентир доставки{" "}
              {formatShortDate(new Date().toISOString())}
            </p>
          ) : null}
        </>
      )}
    </PageShell>
  )
}
