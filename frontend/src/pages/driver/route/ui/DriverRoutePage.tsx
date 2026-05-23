import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, MapPin, Snowflake, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import type { DeliveryMode } from "@/shared/types"
import { queryKeys } from "@/shared/config/query-keys"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const deliveryModeLabel: Record<DeliveryMode, string> = {
  winter_road: "Зимник",
  river: "Речной",
  air: "Авиа",
  mixed: "Смешанный",
}

const routeStatusLabel = {
  planned: "Запланирован",
  active: "Активен",
  completed: "Завершён",
} as const

type PointStatus = "pending" | "arrived" | "done"

type RouteCoords = { lat: number; lng: number }

const hubLabelFromRouteName = (name: string) => {
  const part = name.split("→")[0]?.trim()
  return part && part.length > 0 ? part : "Пункт отправления"
}

const formatCoords = (coords?: RouteCoords) => {
  if (coords == null || typeof coords.lat !== "number" || typeof coords.lng !== "number") {
    return "Координаты уточняются"
  }
  return `${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°`
}

export const DriverRoutePage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"

  const { data: settlements } = useSettlements()

  const { data: driverRoutes, isLoading } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
  })

  const activeRoute =
    driverRoutes?.find((r) => r.status === "active") ?? driverRoutes?.[0]

  const settlementName = (id: string) =>
    settlements?.find((s) => s.id === id)?.name ?? id

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
        <PageHeader title="Маршрут" subtitle="Точки доставки" />
        <EmptyState
          icon={MapPin}
          title="Нет активного маршрута"
          description="Маршрут появится после назначения диспетчером"
        />
      </PageShell>
    )
  }

  const stops = [
    {
      label: hubLabelFromRouteName(activeRoute.name),
      coords: activeRoute.points[0],
      type: "start" as const,
    },
    ...activeRoute.toSettlementIds.map((sid, i) => ({
      label: settlementName(sid),
      coords: activeRoute.points[i + 1],
      type: "stop" as const,
    })),
  ].filter(
    (stop): stop is typeof stop & { coords: RouteCoords } =>
      stop.coords != null &&
      typeof stop.coords.lat === "number" &&
      typeof stop.coords.lng === "number",
  )
  if (stops.length === 0) {
    return (
      <PageShell>
        <PageHeader title={activeRoute.name} subtitle="Точки доставки" />
        <EmptyState
          icon={MapPin}
          title="Точки маршрута не заданы"
          description="Диспетчер добавит пункты выдачи после формирования рейса"
        />
      </PageShell>
    )
  }

  const inferredCurrentStopIndex =
    activeRoute.status === "completed" ? stops.length : Math.min(1, stops.length - 1)

  const getPointStatus = (index: number): PointStatus => {
    if (activeRoute.status === "completed") return "done"
    if (index < inferredCurrentStopIndex) return "done"
    if (index === inferredCurrentStopIndex) return "arrived"
    return "pending"
  }

  const completedStops = stops.filter((_, idx) => getPointStatus(idx) === "done").length
  const nextStop = stops.find((_, idx) => getPointStatus(idx) !== "done") ?? null
  const autoCompleted = completedStops === stops.length

  return (
    <PageShell>
      <PageHeader
        title={activeRoute.name}
        subtitle="Водитель видит точки, адрес следующей доставки и текущий статус"
      />

      <Card className="border-blue-100 bg-blue-50/40">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{routeStatusLabel[activeRoute.status]}</Badge>
          <Badge variant="default">
            <Snowflake size={12} className="mr-1 inline" />
            {deliveryModeLabel[activeRoute.deliveryMode]}
          </Badge>
          <Badge variant={autoCompleted ? "success" : "warning"}>
            {autoCompleted ? "Рейс завершен автоматически" : "В пути"}
          </Badge>
          <Badge variant="default">{completedStops}/{stops.length} точек выполнено</Badge>
        </div>
      </Card>

      {nextStop ? (
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-blue-700">Следующая точка</p>
              <p className="truncate font-semibold text-slate-900">{nextStop.label}</p>
              <p className="text-xs text-slate-500">{formatCoords(nextStop.coords)}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">Точки передачи в ПВЗ</p>
        <ol className="flex flex-col gap-2">
          {stops.map((stop, index) => {
            const status = getPointStatus(index)
            return (
              <li key={`${stop.label}-${index}`}>
                <Card
                  className={
                    status === "arrived"
                      ? "border-blue-300 bg-blue-50/50"
                      : status === "done"
                        ? "border-emerald-200 bg-emerald-50/30"
                        : ""
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        status === "done"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "arrived"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {status === "done" ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">{stop.label}</p>
                      <p className="text-xs text-slate-500">{formatCoords(stop.coords)}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {stop.type === "start" ? "Отправление" : "Пункт выдачи"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {status === "done" ? (
                        <Badge variant="success">Передано</Badge>
                      ) : status === "arrived" ? (
                        <Badge variant="info">Текущая точка</Badge>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      </div>
      {autoCompleted ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <p className="text-sm font-semibold text-emerald-800">
            Отличная работа! Рейс завершен автоматически, все точки пройдены.
          </p>
        </Card>
      ) : (
        <p className="text-xs text-slate-500">
          Все действия по приемке подтверждает ПВЗ. Водитель видит маршрут и следующую точку.
        </p>
      )}
    </PageShell>
  )
}
