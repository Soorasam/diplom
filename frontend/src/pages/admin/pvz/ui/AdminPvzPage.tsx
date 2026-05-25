import { MapPin, User } from "lucide-react"

import { useAdminPickupPoints } from "@/entities/admin/api/useAdmin"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

export const AdminPvzPage = () => {
  const { data: points, isLoading } = useAdminPickupPoints()

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="ПВЗ"
        subtitle="Тот же справочник, что и населённые пункты (1 НП = 1 ПВЗ)"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : points && points.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {points.map((pp) => (
            <li key={pp.id}>
              <Card className="border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <MapPin size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{pp.name}</p>
                    {pp.address ? (
                      <p className="mt-1 text-sm text-slate-600">{pp.address}</p>
                    ) : null}
                    {pp.coordinatorPhone ? (
                      <p className="text-xs text-slate-500">{pp.coordinatorPhone}</p>
                    ) : null}

                    {pp.employees.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                        {pp.employees.map((e) => (
                          <li
                            key={e.id}
                            className="flex items-center gap-2 text-sm text-slate-700"
                          >
                            <User size={14} className="text-slate-400" />
                            <span className="font-medium">{e.name}</span>
                            <span className="text-xs text-slate-500">{e.email}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">Сотрудник ПВЗ не привязан</p>
                    )}
                  </div>
                  <Badge variant="info">{pp.employees.length} сотр.</Badge>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MapPin}
          title="ПВЗ не найдены"
          description="Добавьте пункты выдачи в seed или через БД"
        />
      )}
    </div>
  )
}
