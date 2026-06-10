import { Truck } from "lucide-react"

import type { Procurement } from "@/shared/api/api-types"
import { formatShortDate, formatWeightKg } from "@/shared/lib/format"
import { Card } from "@/shared/ui/card/Card"
import { getRemainingMs } from "@/shared/lib/countdown"
import { getProcurementCloseDeadline } from "@/shared/lib/procurement-poll-interval"
import { ProcurementClosingCountdown } from "@/widgets/procurement-closing-countdown/ui/ProcurementClosingCountdown"
import { ProcurementProgress } from "@/widgets/procurement-progress/ui/ProcurementProgress"

interface ActiveProcurementBannerProps {
  procurement: Procurement
  embedded?: boolean
}

export const ActiveProcurementBanner = ({
  procurement,
  embedded,
}: ActiveProcurementBannerProps) => {
  const leftKg = Math.max(procurement.targetWeightKg - procurement.currentWeightKg, 0)
  const closeDeadline = getProcurementCloseDeadline(procurement)
  const closeCountdownMs = closeDeadline ? getRemainingMs(closeDeadline) : null
  const showCloseCountdown =
    closeDeadline != null &&
    closeCountdownMs != null &&
    closeCountdownMs > 0 &&
    (Boolean(procurement.emergencyCloseAt) || closeCountdownMs <= 60 * 60 * 1000)

  const body = (
    <>
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
          {showCloseCountdown && closeDeadline ? (
            <div className="mt-2">
              <ProcurementClosingCountdown deadlineAt={closeDeadline} compact />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <ProcurementProgress procurement={procurement} size="sm" />
      </div>
    </>
  )

  if (embedded) {
    return <div aria-label="Активный сбор">{body}</div>
  }

  return (
    <Card className="p-4" aria-label="Активный сбор">
      {body}
    </Card>
  )
}
