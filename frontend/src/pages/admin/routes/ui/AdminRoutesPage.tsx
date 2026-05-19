import { Route } from "lucide-react"

import { useAdminRoutes } from "@/entities/admin/api/useAdmin"
import type { DeliveryMode, MapMarker, MapRoute } from "@/shared/types"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { MapView } from "@/shared/ui/map/MapView"
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

const routeStatusVariant = {
  planned: "warning" as const,
  active: "info" as const,
  completed: "success" as const,
}

export const AdminRoutesPage = () => {
  const { data: deliveryRoutesList, isLoading } = useAdminRoutes()

  const markers: MapMarker[] =
    deliveryRoutesList?.flatMap((route) =>
      route.points.map((point, i) => ({
        id: `${route.id}-${i}`,
        title: route.name,
        coordinates: point,
        type: "route" as const,
      })),
    ) ?? []

  const mapRoutes: MapRoute[] =
    deliveryRoutesList?.map((route) => ({
      id: route.id,
      name: route.name,
      points: route.points,
      color: route.status === "active" ? "#2563eb" : "#64748b",
    })) ?? []

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Маршруты доставки" subtitle="Логистика по улусам" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : deliveryRoutesList && deliveryRoutesList.length > 0 ? (
        <>
          <MapView
            markers={markers}
            routes={mapRoutes}
            height="280px"
            title="Все маршруты"
          />

          <ul className="flex flex-col gap-3">
            {deliveryRoutesList.map((route) => (
              <li key={route.id}>
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{route.name}</p>
                      <p className="text-xs text-slate-500">
                        {deliveryModeLabel[route.deliveryMode]} · {route.points.length} точек
                        {route.driverId ? ` · водитель ${route.driverId}` : ""}
                      </p>
                    </div>
                    <Badge variant={routeStatusVariant[route.status]}>
                      {routeStatusLabel[route.status]}
                    </Badge>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState icon={Route} title="Маршрутов нет" />
      )}
    </div>
  )
}
