import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, MapPin, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { ProcurementChecklistCard } from "@/features/driver-procurement-checklist/ui/ProcurementChecklistCard"
import { ProcurementSettlementCard } from "@/features/driver-procurement-settlement/ui/ProcurementSettlementCard"
import { useDriverDeliveryProcurement } from "@/entities/procurement/api/useProcurements"
import { routesApi } from "@/entities/route/api/routesApi"
import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import { routes } from "@/shared/config/routes"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

type PointStatus = "pending" | "arrived" | "done"

const mapStopStatus = (s: RouteDeliveryStop["status"]): PointStatus => {
  if (s === "completed") return "done"
  if (s === "in_progress") return "arrived"
  return "pending"
}

const stopSubtitle = (ds: RouteDeliveryStop) => {
  if (ds.isProcurementStop && ds.expectsOrders) {
    return ds.procurementCompleted
      ? "Закупка завершена — переходите к выдаче"
      : "Точка закупа — сначала чек-лист"
  }
  if (ds.isProcurementStop && !ds.procurementCompleted) return "Точка закупа"
  if (ds.isProcurementStop && ds.procurementCompleted) return "Закупка завершена"
  if (ds.expectsOrders) return "Раздача заказов жителям на общей точке"
  return "Остановка по маршруту"
}

export const DriverRoutePage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"
  const qc = useQueryClient()

  const { data: driverRoutes, isLoading } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
  })

  const { data: deliveryRound } = useDriverDeliveryProcurement(user?.id)

  const completeStop = useMutation({
    mutationFn: ({
      roundId,
      pickupPointId,
    }: {
      roundId: string
      pickupPointId: string
    }) => routesApi.completeRouteStop(roundId, pickupPointId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.routes.driver(driverId) })
    },
  })

  const activeRoute =
    driverRoutes?.find((r) => r.status === "active") ?? driverRoutes?.[0]

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      </PageShell>
    )
  }

  if (!activeRoute) {
    return (
      <PageShell>
        <PageHeader title="Маршрут" subtitle="Населённые пункты на рейсе" />
        <EmptyState
          icon={MapPin}
          title="Нет активного маршрута"
          description="Маршрут появится после закрытия сбора и отправки рейса"
        />
      </PageShell>
    )
  }

  const deliveryStopsRaw = activeRoute.deliveryStops ?? []
  const driverPickupPointId = user?.pickupPointId
  const deliveryStops = deliveryStopsRaw.filter((ds, index, arr) => {
    const isLast = index === arr.length - 1
    const isDriverOwnTailStop =
      Boolean(driverPickupPointId) &&
      ds.pickupPointId === driverPickupPointId &&
      isLast &&
      (ds.totalOrders ?? 0) === 0 &&
      (ds.receivedOrders ?? 0) === 0 &&
      !ds.expectsOrders

    return !isDriverOwnTailStop
  })

  const stops = deliveryStops.map((ds) => ({
    pickupPointId: ds.pickupPointId,
    label: ds.label,
    subtitle: stopSubtitle(ds),
    address: ds.address ?? ds.settlementName,
    status: mapStopStatus(ds.status),
    progress: ds.expectsOrders
      ? `${ds.receivedOrders}/${ds.totalOrders} выдано`
      : undefined,
    driverCanComplete: ds.driverCanComplete,
    expectsOrders: ds.expectsOrders,
  }))

  if (stops.length === 0) {
    return (
      <PageShell>
        <PageHeader title={activeRoute.name} subtitle="Точки на маршруте" />
        <EmptyState
          icon={MapPin}
          title="Точки маршрута не заданы"
          description="После закрытия сбора и старта рейса появятся посёлки на маршруте"
        />
      </PageShell>
    )
  }

  const nextStop = stops.find((s) => s.status !== "done") ?? null
  const tripCompleted = activeRoute.status === "completed"
  const roundId = activeRoute.activeRoundId

  return (
    <PageShell>
      <PageHeader
        title={activeRoute.name}
        subtitle="Закупка и раздача — координатор на маршруте"
      />

      {roundId && activeRoute.status === "active" ? (
        <ProcurementChecklistCard roundId={roundId} />
      ) : null}

      {deliveryRound?.id ? (
        <ProcurementSettlementCard roundId={deliveryRound.id} />
      ) : null}

      {nextStop && !tripCompleted ? (
        <Card className="ui-panel-gradient">
          <div className="flex items-center gap-3">
            <div className="ui-icon-solid flex h-10 w-10 items-center justify-center rounded-2xl">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium ui-text-accent">Следующая точка</p>
              <p className="truncate font-semibold text-slate-900">{nextStop.label}</p>
              <p className="text-xs text-slate-500">{nextStop.address}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <Link to={routes.driver.handout} className="ui-cta ui-cta-primary ui-cta-block">
        Открыть список выдачи
      </Link>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">Точки маршрута</p>
        <ol className="flex flex-col gap-2">
          {stops.map((stop, index) => (
            <li key={stop.pickupPointId}>
              <Card
                className={
                  stop.status === "arrived"
                    ? "ui-stop-active"
                    : stop.status === "done"
                      ? "ui-stop-done"
                      : ""
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      stop.status === "done"
                        ? "ui-icon-soft"
                        : stop.status === "arrived"
                          ? "ui-icon-solid"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {stop.status === "done" ? <CheckCircle2 size={16} /> : index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{stop.label}</p>
                    <p className="text-xs text-slate-500">{stop.subtitle}</p>
                    <p className="mt-0.5 text-sm text-slate-700">{stop.address}</p>
                    {stop.progress ? (
                      <p className="mt-1 text-xs font-medium text-slate-600">{stop.progress}</p>
                    ) : null}
                    {stop.driverCanComplete && roundId ? (
                      <Button
                        size="sm"
                        className="mt-2"
                        disabled={completeStop.isPending}
                        onClick={() =>
                          completeStop.mutate({
                            roundId,
                            pickupPointId: stop.pickupPointId,
                          })
                        }
                      >
                        Точка выполнена
                      </Button>
                    ) : null}
                    {stop.expectsOrders && stop.status !== "done" ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Выдайте заказы в разделе «Выдача», затем закройте точку
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    {stop.status === "done" ? (
                      <Badge variant="success">Закрыта</Badge>
                    ) : stop.status === "arrived" ? (
                      <Badge variant="info">В работе</Badge>
                    ) : (
                      <Badge variant="default">Ожидает</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </div>

      {tripCompleted ? (
        <Card className="ui-panel">
          <p className="text-sm font-semibold ui-text-accent">
            Рейс завершён: все точки маршрута пройдены.
          </p>
        </Card>
      ) : (
        <p className="text-xs text-slate-500">
          В посёлках с заказами отметьте выдачу в разделе «Выдача», затем закройте точку маршрута.
        </p>
      )}
    </PageShell>
  )
}
