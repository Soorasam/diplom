import { MapPin } from "lucide-react"

import { useAdminSettlements } from "@/entities/admin/api/useAdmin"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminSettlementsPage = () => {
  const { data: settlementsList, isLoading } = useAdminSettlements()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Населённые пункты" subtitle="Улусы и координаты" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : settlementsList && settlementsList.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {settlementsList.map((settlement) => (
            <li key={settlement.id}>
              <Card>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{settlement.name}</p>
                    <p className="text-xs text-slate-500">{settlement.ulus} улус</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Население: {settlement.population.toLocaleString("ru-RU")} ·{" "}
                      {settlement.coordinates.lat.toFixed(2)}°,{" "}
                      {settlement.coordinates.lng.toFixed(2)}°
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MapPin} title="Населённых пунктов нет" />
      )}
    </div>
  )
}
