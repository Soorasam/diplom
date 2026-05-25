import { Clock } from "lucide-react"

import { useCountdownTo } from "@/shared/hooks/useCountdownTo"
import { formatCountdownMs } from "@/shared/lib/countdown"
import { cn } from "@/shared/lib/cn"

type Props = {
  emergencyCloseAt: string
  compact?: boolean
  className?: string
}

export const ProcurementClosingCountdown = ({
  emergencyCloseAt,
  compact,
  className,
}: Props) => {
  const { remainingMs, isActive } = useCountdownTo(emergencyCloseAt)

  if (!isActive || remainingMs == null) return null

  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-200",
        compact ? "text-xs" : "text-sm",
        className,
      )}
    >
      <Clock size={compact ? 12 : 14} className="shrink-0" />
      Закрытие через {formatCountdownMs(remainingMs)}
    </p>
  )
}
