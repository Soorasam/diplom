import { Link } from "react-router-dom"
import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Check, MapPin } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { ProcurementSettlementCard } from "@/features/driver-procurement-settlement/ui/ProcurementSettlementCard"
import { useDriverDeliveryProcurement } from "@/entities/procurement/api/useProcurements"
import { routesApi } from "@/entities/route/api/routesApi"
import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"
import { routes } from "@/shared/config/routes"
import { queryKeys } from "@/shared/config/query-keys"
import { buildRouteChain, buildRoutePageHero } from "@/shared/lib/driver-phase-hero"
import { buildDriverRouteAction } from "@/shared/lib/driver-route-action"
import { isCoordinatorRouteInProgress } from "@/shared/lib/driver-round-workload"
import {
  groupOrdersBySettlement,
  isAwaitingTripAccept,
} from "@/shared/lib/driver-orders"
import { cn } from "@/shared/lib/cn"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { DriverPhaseHero } from "@/widgets/driver-phase-hero/ui/DriverPhaseHero"
import { DriverRouteChain } from "@/widgets/driver-route-chain/ui/DriverRouteChain"
import { DriverSettlementResidents } from "@/widgets/driver-settlement-residents/ui/DriverSettlementResidents"

const filterStops = (
  stops: RouteDeliveryStop[],
  driverPickupPointId?: string,
) =>
  stops.filter((ds, index, arr) => {
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

  const ordersBySettlement = useMemo(
    () => groupOrdersBySettlement(driverOrders ?? []),
    [driverOrders],
  )

  const awaitingAccept = useMemo(
    () => (driverOrders ?? []).filter(isAwaitingTripAccept),
    [driverOrders],
  )

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
        <PageHeader title="Рейс" subtitle="Маршрут по порядку" />
        {awaitingAccept.length > 0 ? (
          <Card className="!p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {awaitingAccept.length} заказ(ов) ждут принятия
            </p>
            <Link
              to={routes.driver.orders}
              className="ui-cta-primary mt-3 flex min-h-10 items-center justify-center rounded-xl text-sm font-semibold"
            >
              Открыть заказы
            </Link>
          </Card>
        ) : null}
        <EmptyState
          icon={MapPin}
          title="Нет активного рейса"
          description="Рейс появится после закрытия сбора с оплаченными заказами."
        />
      </PageShell>
    )
  }

  const deliveryStops = filterStops(
    activeRoute.deliveryStops ?? [],
    user?.pickupPointId,
  )

  if (deliveryStops.length === 0) {
    return (
      <PageShell>
        <PageHeader title={activeRoute.name} subtitle="Точки на маршруте" />
        <EmptyState
          icon={MapPin}
          title="Точки маршрута не заданы"
          description="После закрытия сбора появятся посёлки на маршруте"
        />
      </PageShell>
    )
  }

  const currentIndex = deliveryStops.findIndex((s) => s.status !== "completed")
  const currentStop = currentIndex >= 0 ? deliveryStops[currentIndex] : undefined
  const nextStop = currentIndex >= 0 ? deliveryStops[currentIndex + 1] : undefined
  const tripCompleted = activeRoute.status === "completed"
  const roundId = activeRoute.activeRoundId

  const currentResidents = currentStop
    ? ordersBySettlement.get(currentStop.pickupPointId) ?? []
    : []
  const pendingConfirm = Boolean(
    currentStop?.expectsOrders &&
      currentResidents.some(
        (o) => o.status === "in_transit" || o.status === "at_pickup",
      ),
  )

  const hero = buildRoutePageHero({
    routeName: activeRoute.name,
    currentStop,
    step: currentIndex >= 0 ? currentIndex + 1 : deliveryStops.length,
    totalSteps: deliveryStops.length,
    nextStopLabel: nextStop?.label,
  })

  const routeChain = buildRouteChain(deliveryStops)
  const action = buildDriverRouteAction({
    currentStop,
    roundId: roundId ?? undefined,
    tripCompleted,
    pendingConfirm,
  })

  return (
    <PageShell withStickyFooter>
      <PageHeader title="Рейс" subtitle={activeRoute.name} />

      <div className="flex flex-col gap-4">
        <DriverPhaseHero hero={hero} hideFooter />
        <DriverRouteChain chain={routeChain} />

        {currentStop?.expectsOrders && currentResidents.length > 0 ? (
          <Card className="!p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Жители в {currentStop.label}
            </p>
            <DriverSettlementResidents orders={currentResidents} compact />
            {pendingConfirm ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>Обойдите по адресам — все должны подтвердить получение</span>
              </div>
            ) : null}
          </Card>
        ) : null}

        {deliveryRound?.id ? (
          <ProcurementSettlementCard roundId={deliveryRound.id} />
        ) : null}

        <div>
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Маршрут
          </p>
          <ol className="flex flex-col gap-1.5">
            {deliveryStops.map((stop, index) => {
              const isDone = stop.status === "completed"
              const isCurrent = index === currentIndex
              return (
                <li
                  key={stop.pickupPointId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                    isCurrent && "ui-stop-active border-sky-300",
                    isDone && "ui-stop-done opacity-80",
                    !isCurrent && !isDone && "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isDone && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
                      isCurrent && "bg-slate-900 text-white dark:bg-sky-600",
                      !isDone && !isCurrent && "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
                    )}
                  >
                    {isDone ? <Check size={14} /> : index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                      {stop.label}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {stop.isProcurementStop
                        ? "Закупка"
                        : stop.expectsOrders
                          ? `${stop.receivedOrders ?? 0}/${stop.totalOrders ?? 0} подтвердили`
                          : "Проезд"}
                    </p>
                  </div>
                  {isCurrent ? (
                    <span className="shrink-0 text-[10px] font-semibold uppercase text-sky-700 dark:text-sky-300">
                      Сейчас
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ol>
        </div>

        {tripCompleted ? (
          <Card className="border-emerald-200 bg-emerald-50/50 !p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Рейс завершён
            </p>
          </Card>
        ) : null}
      </div>

      {!tripCompleted && action.kind !== "none" ? (
        <div className="fixed bottom-20 left-0 right-0 z-10 mx-auto max-w-[480px] px-4 sm:bottom-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {action.kind === "link" ? (
              <Link
                to={action.to}
                className="ui-cta-primary flex min-h-12 w-full items-center justify-center rounded-xl text-base font-semibold"
              >
                {action.label}
              </Link>
            ) : (
              <Button
                fullWidth
                size="lg"
                variant={action.disabled ? "outline" : "primary"}
                disabled={action.disabled || completeStop.isPending}
                onClick={() =>
                  roundId &&
                  completeStop.mutate({
                    roundId,
                    pickupPointId: action.pickupPointId,
                  })
                }
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </PageShell>
  )
}
