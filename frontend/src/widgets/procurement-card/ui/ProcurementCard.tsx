import { Calendar, Truck } from "lucide-react"

import type { Procurement } from "@/shared/api/mock-db"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import type { DeliveryMode } from "@/shared/types"

const deliveryLabels: Record<DeliveryMode, string> = {
  winter_road: "Зимник",
  river: "Река",
  air: "Авиа",
  mixed: "Смешанный",
}

interface ProcurementCardProps {
  procurement: Procurement
  compact?: boolean
}

export const ProcurementCard = ({ procurement, compact }: ProcurementCardProps) => {
  const progress = procurement.currentVolumePercent

  return (
    <Card className={compact ? "!p-3" : undefined}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{procurement.title}</h3>
          {!compact ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Truck size={12} />
              {deliveryLabels[procurement.deliveryMode]}
            </p>
          ) : null}
        </div>
        <Badge variant={progress >= procurement.minVolumePercent ? "success" : "warning"}>
          {progress}%
        </Badge>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Calendar size={12} />
          Закрытие: {formatShortDate(procurement.closesAt)}
        </span>
        <span>Доставка: {formatShortDate(procurement.estimatedDelivery)}</span>
      </div>
    </Card>
  )
}
