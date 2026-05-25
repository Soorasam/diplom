import { MapPin, Phone, User } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { usePickupPoints } from "@/entities/settlement/api/useSettlements"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import type { MapMarker } from "@/shared/types"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { MapView } from "@/shared/ui/map/MapView"

export const PickupPointsPage = () => {
  const profileRoutes = useProfileRoutes()
  const user = useAuthStore((s) => s.user)
  const { data: points, isLoading } = usePickupPoints(user?.settlementId)

  const markers: MapMarker[] =
    points?.map((pp) => ({
      id: pp.id,
      title: pp.name,
      coordinates: pp.coordinates,
      type: "pickup",
      description: pp.address,
    })) ?? []

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Пункты выдачи" backTo={profileRoutes.profile} />

      <MapView title="Пункты на карте" markers={markers} height="220px" />

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {points?.map((pp) => (
            <li key={pp.id}>
              <Card>
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{pp.name}</p>
                    <p className="text-sm text-slate-600">{pp.address}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <User size={12} />
                      {pp.coordinatorName}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone size={12} />
                      {pp.coordinatorPhone}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
