import { MapPin, Truck, User } from "lucide-react"

import type { Procurement } from "@/shared/api/api-types"
import { resolveProcurementRouteTitle } from "@/shared/lib/procurement-route-title"
import { Card } from "@/shared/ui/card/Card"

type Props = {
  procurement: Procurement
  embedded?: boolean
}

export const ProcurementLogisticsCard = ({ procurement, embedded }: Props) => {
  const routeTitle = resolveProcurementRouteTitle(procurement)
  const showCustomTitle =
    procurement.title.trim() !== routeTitle.trim() && Boolean(procurement.title)

  const body = (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <MapPin size={14} />
          Маршрут сбора
        </dt>
        <dd className="mt-1 font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {routeTitle}
        </dd>
        {showCustomTitle ? (
          <p className="mt-1 text-xs text-slate-500">
            Название сбора: {procurement.title}
          </p>
        ) : null}
      </div>

      {procurement.driverName || procurement.driverPhone ? (
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <User size={14} />
            Водитель
          </dt>
          <dd className="mt-1 text-slate-800 dark:text-slate-200">
            {procurement.driverName ?? "—"}
            {procurement.driverPhone ? (
              <span className="block text-xs text-slate-500">
                {procurement.driverPhone}
              </span>
            ) : null}
          </dd>
        </div>
      ) : null}

      {procurement.vehicleSummary ? (
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Truck size={14} />
            Транспорт
          </dt>
          <dd className="mt-1 leading-snug text-slate-800 dark:text-slate-200">
            {procurement.vehicleSummary}
          </dd>
        </div>
      ) : null}
    </dl>
  )

  if (embedded) return body

  return <Card className="!p-4">{body}</Card>
}
