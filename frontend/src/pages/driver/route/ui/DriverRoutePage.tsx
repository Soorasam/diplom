import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, MapPin, Snowflake } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import { settlements } from "@/shared/api/mock-db"
import type { DeliveryMode } from "@/shared/types"
import { queryKeys } from "@/shared/config/query-keys"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
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

export const DriverRoutePage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"

  const { data: driverRoutes, isLoading } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
  })

  const activeRoute =
    driverRoutes?.find((r) => r.status === "active") ?? driverRoutes?.[0]

  const [pointStatuses, setPointStatuses] = useState<Record<number, PointStatus>>({})
  const [routeStatus, setRouteStatus] = useState<string | null>(null)

  const getPointStatus = (index: number): PointStatus =>
    pointStatuses[index] ?? (index === 0 ? "arrived" : "pending")

  const updatePoint = (index: number, status: PointStatus) => {
    setPointStatuses((prev) => ({ ...prev, [index]: status }))
  }

  const settlementName = (id: string) =>
    settlements.find((s) => s.id === id)?.name ?? id

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (!activeRoute) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Маршрут" subtitle="Точки доставки" />
        <EmptyState
          icon={MapPin}
          title="Нет активного маршрута"
          description="Маршрут появится после назначения диспетчером"
        />
      </div>
    )
  }

  const stops = [
    {
      label: settlementName(activeRoute.fromSettlementId),
      coords: activeRoute.points[0],
      type: "start" as const,
    },
    ...activeRoute.toSettlementIds.map((sid, i) => ({
      label: settlementName(sid),
      coords: activeRoute.points[i + 1] ?? activeRoute.points[activeRoute.points.length - 1],
      type: "stop" as const,
    })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={activeRoute.name}
        subtitle="Управление точками маршрута"
      />

      <Card className="border-blue-100 bg-blue-50/40">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{routeStatusLabel[activeRoute.status]}</Badge>
          <Badge variant="default">
            <Snowflake size={12} className="mr-1 inline" />
            {deliveryModeLabel[activeRoute.deliveryMode]}
          </Badge>
          {routeStatus ? (
            <Badge variant="success">{routeStatus}</Badge>
          ) : null}
        </div>
      </Card>

      <div>
        <p className="mb-2 text-sm font-semibold text-slate-800">Точки маршрута</p>
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
                      <p className="text-xs text-slate-500">
                        {stop.coords.lat.toFixed(2)}°, {stop.coords.lng.toFixed(2)}°
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {stop.type === "start" ? "Отправление" : "Пункт выдачи"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      {status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updatePoint(index, "arrived")}
                        >
                          Прибыл
                        </Button>
                      ) : null}
                      {status === "arrived" ? (
                        <Button
                          size="sm"
                          onClick={() => updatePoint(index, "done")}
                        >
                          Сдано
                        </Button>
                      ) : null}
                      {status === "done" ? (
                        <Badge variant="success">Готово</Badge>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      </div>

      <Button
        fullWidth
        variant="secondary"
        onClick={() => setRouteStatus("Маршрут завершён (демо)")}
      >
        Завершить маршрут
      </Button>
    </div>
  )
}
