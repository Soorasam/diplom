import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Check, MapPin, Package } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { ProcurementChecklistCard } from "@/features/driver-procurement-checklist/ui/ProcurementChecklistCard"
import { routesApi } from "@/entities/route/api/routesApi"
import { useDriverWorkbench } from "@/shared/hooks/useDriverWorkbench"
import {
  areAllDriverStopsCompleted,
  filterDriverRouteStops,
  isDriverProcurementStop,
  resolveDriverRouteChain,
} from "@/shared/lib/driver-route-stops"
import { buildDriverTripView } from "@/shared/lib/driver-trip-phase"
import { refetchProcurementState } from "@/shared/lib/invalidate-procurement-state"
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

export const DriverRoutePage = () => {
  const user = useAuthStore((s) => s.user)
  const workbench = useDriverWorkbench()
  const {
    isLoading,
    driverId,
    orders,
    awaitingAccept,
    awaitingAcceptCount,
    hasOpenCollection,
    activeRound,
    activeRoute,
    deliveryRound,
    workRoundId,
    ordersBySettlement,
    routeStops,
  } = workbench

  const qc = useQueryClient()
  const [checklistPurchased, setChecklistPurchased] = useState(0)
  const [checklistTotal, setChecklistTotal] = useState(0)

  const completeStop = useMutation({
    mutationFn: ({
      roundId,
      pickupPointId,
    }: {
      roundId: string
      pickupPointId: string
    }) => routesApi.completeRouteStop(roundId, pickupPointId),
    onSuccess: () => {
      void refetchProcurementState(qc, { driverId })
    },
  })

  const deliveryStops = useMemo(
    () =>
      routeStops.length > 0
        ? routeStops
        : filterDriverRouteStops(activeRoute?.deliveryStops ?? [], user?.pickupPointId),
    [routeStops, activeRoute?.deliveryStops, user?.pickupPointId],
  )

  const currentIndex = deliveryStops.findIndex((s) => s.status !== "completed")
  const currentStop = currentIndex >= 0 ? deliveryStops[currentIndex] : undefined
  const nextStop = currentIndex >= 0 ? deliveryStops[currentIndex + 1] : undefined
  const allStopsCompleted = areAllDriverStopsCompleted(deliveryStops)
  const tripCompleted =
    allStopsCompleted ||
    (!activeRoute &&
      !hasOpenCollection &&
      deliveryRound?.status === "shipped")

  const currentResidents = currentStop
    ? ordersBySettlement.get(currentStop.pickupPointId) ?? []
    : []
  const pendingConfirm = Boolean(
    currentStop?.expectsOrders &&
      currentResidents.some(
        (o) => o.status === "in_transit" || o.status === "at_pickup",
      ),
  )

  const trip = buildDriverTripView({
    orders,
    awaitingAcceptCount,
    hasOpenCollection,
    activeRound: activeRound ?? undefined,
    deliveryRound: deliveryRound ?? undefined,
    activeRoute,
    deliveryStops,
    currentStop,
    nextStop,
    tripCompleted,
    pendingConfirm,
    checklistPurchased,
    checklistPositions: checklistTotal,
  })

  const routeChain = resolveDriverRouteChain(activeRoute, user?.pickupPointId)
  const deliveryInProgress =
    !allStopsCompleted &&
    deliveryRound != null &&
    deliveryRound.status !== "open" &&
    deliveryRound.status !== "shipped"
  const hasWork =
    awaitingAcceptCount > 0 ||
    hasOpenCollection ||
    (Boolean(activeRoute) && !allStopsCompleted) ||
    deliveryInProgress

  const heroFooter = (() => {
    if (trip.contentPhase === "depart" && trip.roundId && trip.currentStop) {
      return (
        <Button
          fullWidth
          size="lg"
          className="ui-cta-primary"
          loading={completeStop.isPending}
          onClick={() =>
            completeStop.mutate({
              roundId: trip.roundId!,
              pickupPointId: trip.currentStop!.pickupPointId,
            })
          }
        >
          {trip.nextStop
            ? `Поехали в ${trip.nextStop.label}`
            : "Поехали дальше"}
        </Button>
      )
    }
    if (
      (trip.contentPhase === "handout" ||
        trip.contentPhase === "close_settlement" ||
        trip.contentPhase === "transit") &&
      trip.canCompleteStop &&
      trip.roundId &&
      trip.currentStop
    ) {
      const isLast = !trip.nextStop
      return (
        <Button
          fullWidth
          size="lg"
          className="ui-cta-primary"
          loading={completeStop.isPending}
          onClick={() =>
            completeStop.mutate({
              roundId: trip.roundId!,
              pickupPointId: trip.currentStop!.pickupPointId,
            })
          }
        >
          {isLast
            ? "Завершить рейс"
            : "Посёлок завершён — ехать дальше"}
        </Button>
      )
    }
    if (pendingConfirm) {
      return (
        <p className="text-center text-xs text-amber-700 dark:text-amber-300">
          Дождитесь подтверждений всех жителей
        </p>
      )
    }
    if (trip.contentPhase === "procurement") {
      return (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Отметьте позиции ниже · {checklistPurchased}/{checklistTotal || "…"}
        </p>
      )
    }
    if (trip.contentPhase === "accept_orders") {
      return (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Примите оплаченные заказы в рейс
        </p>
      )
    }
    return null
  })()

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      </PageShell>
    )
  }

  if (!hasWork) {
    return (
      <PageShell>
        <PageHeader title="Рейс" subtitle="Всё по этапам в одном месте" />
        <EmptyState
          icon={MapPin}
          title="Пока нечего делать"
          description="Откройте сбор в разделе «Сборы» — здесь появятся заказы и этапы маршрута."
        />
      </PageShell>
    )
  }

  return (
    <PageShell withStickyFooter={Boolean(heroFooter && trip.contentPhase !== "procurement")}>
      <PageHeader
        title="Рейс"
        subtitle={routeChain || activeRound?.title || "По этапам"}
      />

      <div className="flex flex-col gap-4">
        <DriverPhaseHero hero={trip.hero} hideFooter footer={heroFooter} />
        {routeChain ? <DriverRouteChain chain={routeChain} /> : null}

        {trip.contentPhase === "accept_orders" ? (
          <Card className="!p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Оплаченные заказы
            </p>
            <DriverSettlementResidents orders={awaitingAccept} showAcceptActions />
          </Card>
        ) : null}

        {trip.contentPhase === "waiting_close" ? (
          <Card className="border-sky-200 bg-sky-50/50 !p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Все заказы приняты. После закрытия сбора начнётся закупка и доставка по
              маршруту — этапы появятся здесь автоматически.
            </p>
          </Card>
        ) : null}

        {trip.contentPhase === "procurement" &&
        workRoundId &&
        isDriverProcurementStop(currentStop) ? (
          <ProcurementChecklistCard
            roundId={workRoundId}
            compact
            onProgress={(purchased, total) => {
              setChecklistPurchased(purchased)
              setChecklistTotal(total)
            }}
          />
        ) : null}

        {trip.contentPhase === "close_settlement" ? (
          <Card className="border-emerald-200 bg-emerald-50/60 !p-4 dark:border-emerald-900/50 dark:bg-emerald-950/25">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Все жители подтвердили получение
            </p>
            <p className="mt-1 text-sm text-emerald-800/90 dark:text-emerald-300/90">
              Нажмите кнопку внизу, чтобы закрыть посёлок
              {trip.nextStop ? ` и выехать в ${trip.nextStop.label}` : " и завершить рейс"}.
            </p>
          </Card>
        ) : null}

        {trip.contentPhase === "handout" && currentResidents.length > 0 ? (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Package size={18} className="text-sky-600" />
              Обход по адресам
            </p>
            <DriverSettlementResidents orders={currentResidents} compact />
            {pendingConfirm ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>
                  Вручите заказ лично. Житель подтверждает в приложении — без этого
                  нельзя уезжать.
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {deliveryStops.length > 0 ? (
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Этапы маршрута
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
                      isCurrent && "ui-stop-active",
                      isDone && "ui-stop-done opacity-80",
                      !isCurrent &&
                        !isDone &&
                        "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isDone &&
                          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
                        isCurrent && "bg-slate-900 text-white dark:bg-sky-600",
                        !isDone &&
                          !isCurrent &&
                          "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
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
                            ? `${stop.receivedOrders ?? 0}/${stop.totalOrders ?? 0} выдано`
                            : "Проезд"}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        ) : null}

        {trip.contentPhase === "done" ? (
          <Card className="border-emerald-200 bg-emerald-50/50 !p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Рейс завершён — все точки маршрута пройдены
            </p>
          </Card>
        ) : null}
      </div>
    </PageShell>
  )
}
