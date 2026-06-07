import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, MapPin, Package, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { useAuthStore } from "@/app/model/auth-store"
import { ProcurementChecklistCard } from "@/features/driver-procurement-checklist/ui/ProcurementChecklistCard"
import { ProcurementSettlementCard } from "@/features/driver-procurement-settlement/ui/ProcurementSettlementCard"
import { useDriverDeliveryProcurement } from "@/entities/procurement/api/useProcurements"
import { routesApi } from "@/entities/route/api/routesApi"
import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import { routes } from "@/shared/config/routes"
import { isCoordinatorRouteInProgress } from "@/shared/lib/driver-round-workload"
import { AlertBanner } from "@/shared/ui/alert-banner/AlertBanner"
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

const stopPhaseLabel = (ds: RouteDeliveryStop) => {
  if (ds.isProcurementStop) return "Этап: закупка"
  if (ds.expectsOrders) return "Этап: выдача жителям"
  return "Этап: проезд"
}

const stopInstruction = (ds: RouteDeliveryStop) => {
  if (ds.isProcurementStop && ds.expectsOrders) {
    return ds.procurementCompleted
      ? "Закупка завершена — можно везти товар в посёлки"
      : "Сначала отметьте закупку в чек-листе ниже"
  }
  if (ds.isProcurementStop) {
    return ds.procurementCompleted
      ? "Закупка на этой точке завершена"
      : "Точка закупа — заполните чек-лист"
  }
  if (ds.expectsOrders) {
    const pending = (ds.inTransitOrders ?? 0) + (ds.totalOrders ?? 0) - (ds.receivedOrders ?? 0)
    if (pending > 0) {
      return "Вручите товар жителям и попросите подтвердить получение в приложении. Не уезжайте, пока выдача не завершена."
    }
    return "Заказов к выдаче нет — можно закрыть точку"
  }
  return "Техническая остановка маршрута"
}

export const DriverRoutePage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"
  const qc = useQueryClient()

  const { data: driverRoutes, isLoading } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
  })

  const { data: driverOrders } = useQuery({
    queryKey: [...queryKeys.routes.driver(driverId), "orders"],
    queryFn: () => routesApi.getDriverOrders(driverId),
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

  const rawActiveRoute = driverRoutes?.find((r) => r.status === "active")
  const activeRoute =
    rawActiveRoute && isCoordinatorRouteInProgress(rawActiveRoute, driverOrders)
      ? rawActiveRoute
      : undefined

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
          description="Маршрут появится после закрытия сбора с оплаченными заказами. Пустой сбор не блокирует новый."
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

  const stops = deliveryStops.map((ds, index) => ({
    step: index + 1,
    pickupPointId: ds.pickupPointId,
    label: ds.label,
    phase: stopPhaseLabel(ds),
    instruction: stopInstruction(ds),
    address: ds.address ?? ds.settlementName,
    status: mapStopStatus(ds.status),
    totalOrders: ds.totalOrders ?? 0,
    inTransitOrders: ds.inTransitOrders ?? 0,
    receivedOrders: ds.receivedOrders ?? 0,
    driverCanComplete: ds.driverCanComplete,
    expectsOrders: ds.expectsOrders,
    isProcurementStop: ds.isProcurementStop,
    needsHandout:
      ds.expectsOrders &&
      ds.status !== "completed" &&
      (ds.inTransitOrders > 0 || ds.totalOrders > ds.receivedOrders),
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
        subtitle={`Маршрут поэтапно · ${stops.length} ${
          stops.length === 1 ? "точка" : stops.length < 5 ? "точки" : "точек"
        }`}
      />

      <AlertBanner variant="info" title="Порядок работы">
        Пройдите точки по номерам. На этапе «Выдача» сдайте товар жителям до отъезда — выплата
        поступит после их подтверждения в приложении.
      </AlertBanner>

      {roundId && activeRoute.status === "active" ? (
        <ProcurementChecklistCard roundId={roundId} />
      ) : null}

      {deliveryRound?.id ? (
        <ProcurementSettlementCard roundId={deliveryRound.id} />
      ) : null}

      {nextStop && !tripCompleted ? (
        <Card className="ui-panel-gradient border-sky-200">
          <div className="flex items-start gap-3">
            <div className="ui-icon-solid flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sky-700">
                Сейчас: шаг {nextStop.step} из {stops.length}
              </p>
              <p className="truncate font-semibold text-slate-900">{nextStop.label}</p>
              <p className="text-xs text-slate-600">{nextStop.phase}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{nextStop.instruction}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {nextStop?.needsHandout ? (
        <Link to={routes.driver.handout} className="ui-cta ui-cta-primary ui-cta-block">
          <Package size={18} />
          Открыть список выдачи в {nextStop.label}
        </Link>
      ) : (
        <Link to={routes.driver.handout} className="ui-cta ui-cta-outline ui-cta-block">
          Список заказов сбора
        </Link>
      )}

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-800">Этапы маршрута</p>
        <ol className="relative flex flex-col gap-0">
          {stops.map((stop, index) => {
            const isLast = index === stops.length - 1
            const isCurrent = stop.status === "arrived"
            const isDone = stop.status === "done"

            return (
              <li key={stop.pickupPointId} className="relative flex gap-3 pb-4">
                {!isLast ? (
                  <span
                    className={`absolute left-4 top-10 bottom-0 w-0.5 ${
                      isDone ? "bg-emerald-200" : "bg-slate-200"
                    }`}
                    aria-hidden
                  />
                ) : null}

                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : isCurrent
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={16} /> : stop.step}
                </div>

                <Card
                  className={`min-w-0 flex-1 !p-4 ${
                    isCurrent ? "border-sky-300 ring-1 ring-sky-200" : ""
                  } ${stop.needsHandout ? "border-amber-300 bg-amber-50/40" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {stop.phase}
                      </p>
                      <p className="font-semibold text-slate-900">{stop.label}</p>
                    </div>
                    <Badge
                      variant={
                        isDone ? "success" : isCurrent ? "info" : "default"
                      }
                      className="shrink-0"
                    >
                      {isDone ? "Пройдена" : isCurrent ? "Сейчас здесь" : "Впереди"}
                    </Badge>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">{stop.address}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">
                    {stop.instruction}
                  </p>

                  {stop.expectsOrders ? (
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      Заказов: {stop.receivedOrders}/{stop.totalOrders} подтверждено
                      {stop.inTransitOrders > 0
                        ? ` · ${stop.inTransitOrders} ждут выдачи`
                        : ""}
                    </p>
                  ) : null}

                  {stop.needsHandout ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                      <span>
                        Перед отъездом вручите товар и дождитесь подтверждения в приложении
                      </span>
                    </div>
                  ) : null}

                  {stop.driverCanComplete && roundId ? (
                    <Button
                      size="sm"
                      className="mt-3"
                      variant={stop.needsHandout ? "outline" : "primary"}
                      disabled={completeStop.isPending || stop.needsHandout}
                      onClick={() =>
                        completeStop.mutate({
                          roundId,
                          pickupPointId: stop.pickupPointId,
                        })
                      }
                    >
                      {stop.needsHandout
                        ? "Сначала завершите выдачу"
                        : "Точка пройдена — можно ехать дальше"}
                    </Button>
                  ) : null}
                </Card>
              </li>
            )
          })}
        </ol>
      </div>

      {tripCompleted ? (
        <Card className="ui-panel">
          <p className="text-sm font-semibold text-emerald-800">
            Рейс завершён: все точки маршрута пройдены.
          </p>
        </Card>
      ) : null}
    </PageShell>
  )
}
