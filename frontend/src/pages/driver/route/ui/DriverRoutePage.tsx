import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, MapPin, Snowflake, Truck } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import type { RouteDeliveryStop } from "@/entities/route/api/routesApi"
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

type RouteStop = {
  label: string
  subtitle: string
  coords: { lat: number; lng: number }
  type: "start" | "stop"
  status: PointStatus
  progress?: string
}

const formatCoords = (coords: { lat: number; lng: number }) =>
  `${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°`

const mapStopStatus = (s: RouteDeliveryStop["status"]): PointStatus => {
  if (s === "completed") return "done"
  if (s === "in_progress") return "arrived"
  return "pending"
}

export const DriverRoutePage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"

  const { data: driverRoutes, isLoading } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
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
        <PageHeader title="Маршрут" subtitle="Точки доставки в ПВЗ" />
        <EmptyState
          icon={MapPin}
          title="Нет активного маршрута"
          description="Маршрут появится после закрытия сбора и старта рейса"
        />
      </PageShell>
    )
  }

  const deliveryStops = activeRoute.deliveryStops ?? []
  const hubCoords = activeRoute.points[0]

  let stops: RouteStop[] = []

  if (deliveryStops.length > 0 && hubCoords) {
    stops = [
      {
        label: activeRoute.hubLabel ?? "Пункт отправления",
        subtitle: "Отправление",
        coords: hubCoords,
        type: "start",
        status: "done",
      },
      ...deliveryStops.map((ds) => ({
        label: ds.label,
        subtitle: ds.settlementName,
        coords: ds.coords,
        type: "stop" as const,
        status: mapStopStatus(ds.status),
        progress: `${ds.receivedOrders}/${ds.totalOrders} принято в ПВЗ`,
      })),
    ]
  } else if (activeRoute.points.length > 0) {
    stops = activeRoute.points.map((coords, index) => ({
      label: index === 0 ? (activeRoute.hubLabel ?? "Старт") : `Точка ${index}`,
      subtitle: index === 0 ? "Отправление" : "ПВЗ",
      coords,
      type: index === 0 ? ("start" as const) : ("stop" as const),
      status: (index === 0 ? "done" : "pending") as PointStatus,
    }))
  }

  if (stops.length === 0) {
    return (
      <PageShell>
        <PageHeader title={activeRoute.name} subtitle="Точки доставки" />
        <EmptyState
          icon={MapPin}
          title="Точки маршрута не заданы"
          description="После закрытия сбора и старта рейса появятся ПВЗ на маршруте"
        />
      </PageShell>
    )
  }

  const completedStops = stops.filter((s) => s.status === "done").length
  const nextStop = stops.find((s) => s.status !== "done") ?? null
  const tripCompleted = activeRoute.status === "completed"

  return (
    <PageShell>
      <PageHeader
        title={activeRoute.name}
        subtitle="Статус точек обновляется, когда сотрудник ПВЗ принимает все заказы"
      />

      <Card className="ui-panel">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Badge variant="info">{routeStatusLabel[activeRoute.status]}</Badge>
          <Badge variant="default">
            <Snowflake size={12} className="mr-1 inline" />
            {deliveryModeLabel[activeRoute.deliveryMode]}
          </Badge>
          <Badge variant={tripCompleted ? "success" : "warning"}>
            {tripCompleted ? "Рейс завершён" : "В пути"}
          </Badge>
          <Badge variant="default">
            {completedStops}/{stops.length} точек
          </Badge>
        </div>
      </Card>

      {nextStop && !tripCompleted ? (
        <Card className="ui-panel-gradient">
          <div className="flex items-center gap-3">
            <div className="ui-icon-solid flex h-10 w-10 items-center justify-center rounded-2xl">
              <Truck size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium ui-text-accent">Следующая точка</p>
              <p className="truncate font-semibold text-slate-900">{nextStop.label}</p>
              <p className="text-xs text-slate-500">{nextStop.subtitle}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">Точки передачи в ПВЗ</p>
        <ol className="flex flex-col gap-2">
          {stops.map((stop, index) => (
            <li key={`${stop.label}-${index}`}>
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
                    <p className="text-xs text-slate-400">{formatCoords(stop.coords)}</p>
                    {stop.progress ? (
                      <p className="mt-1 text-xs font-medium text-slate-600">{stop.progress}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    {stop.status === "done" ? (
                      <Badge variant="success">Закрыта</Badge>
                    ) : stop.status === "arrived" ? (
                      <Badge variant="info">Приём</Badge>
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
            Рейс завершён: все ПВЗ приняли товар.
          </p>
        </Card>
      ) : (
        <p className="text-xs text-slate-500">
          Точка закрывается автоматически, когда сотрудник ПВЗ отметит все заказы этого сбора.
        </p>
      )}
    </PageShell>
  )
}
