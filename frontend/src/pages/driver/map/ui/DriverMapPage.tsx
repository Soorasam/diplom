import { useQuery } from "@tanstack/react-query"
import { Map } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routesApi } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"
import type { MapMarker, MapRoute } from "@/shared/types"
import { MapView } from "@/shared/ui/map/MapView"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const DriverMapPage = () => {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.role === "driver" ? user.id : "d1"

  const { data: driverRoutes, isLoading } = useQuery({
    queryKey: queryKeys.routes.driver(driverId),
    queryFn: () => routesApi.getByDriver(driverId),
  })

  const markers: MapMarker[] =
    driverRoutes?.flatMap((route) =>
      route.points.map((point, i) => ({
        id: `${route.id}-${i}`,
        title: `${route.name} — точка ${i + 1}`,
        coordinates: point,
        type: "route" as const,
        description: route.status === "active" ? "Активный маршрут" : route.status,
      })),
    ) ?? []

  const mapRoutes: MapRoute[] =
    driverRoutes?.map((route) => ({
      id: route.id,
      name: route.name,
      points: route.points,
      color: route.status === "active" ? "#2563eb" : "#94a3b8",
    })) ?? []

  return (
    <PageShell>
      <PageHeader
        title="Карта маршрутов"
        subtitle="Все точки доставки на сегодня"
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          <MapView
            markers={markers}
            routes={mapRoutes}
            height="320px"
            title="Маршруты водителя"
          />

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Map size={16} className="text-blue-600" />
              <span>
                {driverRoutes?.length ?? 0} маршрутов · {markers.length} точек
              </span>
            </div>
          </div>
        </>
      )}
    </PageShell>
  )
}
