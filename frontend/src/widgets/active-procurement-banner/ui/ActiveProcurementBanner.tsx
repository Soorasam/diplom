import { Truck } from "lucide-react"

import type { Procurement } from "@/shared/api/mock-db"
import { formatShortDate, formatWeightKg } from "@/shared/lib/format"
import { Card } from "@/shared/ui/card/Card"
import { ProcurementProgress } from "@/widgets/procurement-progress/ui/ProcurementProgress"

interface ActiveProcurementBannerProps {
  procurement: Procurement
}

export const ActiveProcurementBanner = ({ procurement }: ActiveProcurementBannerProps) => {
  const leftKg = Math.max(procurement.targetWeightKg - procurement.currentWeightKg, 0)

  return (
    <Card className="p-4" aria-label="Активный сбор">
      <div className="flex items-start gap-3">
        <span className="ui-icon-well flex h-9 w-9 shrink-0">
          <Truck size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-normal text-slate-500 dark:text-slate-400">
            Ваш сбор
          </p>
          <p className="line-clamp-2 text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
            {procurement.title}
          </p>
          <p className="mt-1 text-xs font-normal leading-relaxed text-slate-500 dark:text-slate-400">
            до {formatShortDate(procurement.closesAt)} · свободно {formatWeightKg(leftKg)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <ProcurementProgress procurement={procurement} size="sm" />
      </div>
    </Card>
  )
}
