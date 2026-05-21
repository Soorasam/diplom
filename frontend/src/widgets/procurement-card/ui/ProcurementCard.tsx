import { Calendar, Truck } from "lucide-react"

import type { Procurement } from "@/shared/api/mock-db"
import { formatShortDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge/Badge"
import { Card } from "@/shared/ui/card/Card"
import { ProcurementProgress } from "@/widgets/procurement-progress/ui/ProcurementProgress"
import type { DeliveryMode } from "@/shared/types"
import { cn } from "@/shared/lib/cn"

const deliveryLabels: Record<DeliveryMode, string> = {
  winter_road: "Зимник",
  river: "Река",
  air: "Авиа",
  mixed: "Смешанный",
}

interface ProcurementCardProps {
  procurement: Procurement
  compact?: boolean
  /** Без обёртки Card — для вложения в список */
  embedded?: boolean
}

export const ProcurementCard = ({
  procurement,
  compact,
  embedded = false,
}: ProcurementCardProps) => {
  const progress = procurement.currentVolumePercent
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "font-semibold text-slate-900",
              compact ? "text-sm" : "text-base",
            )}
          >
            {procurement.title}
          </h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Truck size={13} className="text-slate-400" />
            {deliveryLabels[procurement.deliveryMode]}
            <span className="text-slate-300">·</span>
            <Calendar size={12} className="inline" />
            {formatShortDate(procurement.closesAt)}
          </p>
        </div>
        <Badge variant={progress >= procurement.minVolumePercent ? "success" : "warning"}>
          {progress}%
        </Badge>
      </div>
      <div className={compact ? "mt-2" : "mt-4"}>
        <ProcurementProgress procurement={procurement} size={compact ? "sm" : "md"} />
      </div>
    </>
  )

  if (embedded) return <div className={compact ? "space-y-2" : "space-y-3"}>{body}</div>

  return <Card className={compact ? "!p-3.5" : "!p-4"}>{body}</Card>
}
