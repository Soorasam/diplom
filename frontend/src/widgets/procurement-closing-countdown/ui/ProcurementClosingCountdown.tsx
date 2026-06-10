import { useEffect, useRef } from "react"
import { Clock } from "lucide-react"

import { useCountdownTo } from "@/shared/hooks/useCountdownTo"
import { useProcurementCloseRefresh } from "@/shared/hooks/useProcurementCloseRefresh"
import { formatCountdownMs } from "@/shared/lib/countdown"
import { cn } from "@/shared/lib/cn"

type Props = {
  /** Дедлайн закрытия: экстренный таймер или плановое closesAt */
  deadlineAt: string
  compact?: boolean
  className?: string
  onExpired?: () => void
}

export const ProcurementClosingCountdown = ({
  deadlineAt,
  compact,
  className,
  onExpired,
}: Props) => {
  const refreshAfterClose = useProcurementCloseRefresh()
  const { remainingMs, isActive, isExpired } = useCountdownTo(deadlineAt)
  const expiredHandled = useRef(false)

  useEffect(() => {
    if (!isExpired || expiredHandled.current) return
    expiredHandled.current = true
    void refreshAfterClose().then(() => onExpired?.())
  }, [isExpired, refreshAfterClose, onExpired])

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
