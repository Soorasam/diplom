import type { Procurement } from "@/shared/api/mock-db"
import { formatWeightKg } from "@/shared/lib/format"
import { cn } from "@/shared/lib/cn"

interface ProcurementProgressProps {
  procurement: Pick<
    Procurement,
    "currentVolumePercent" | "currentWeightKg" | "targetWeightKg" | "minVolumePercent"
  >
  size?: "sm" | "md"
  showHint?: boolean
  showPercent?: boolean
  tone?: "default" | "inverse"
}

export const ProcurementProgress = ({
  procurement,
  size = "md",
  showHint = false,
  showPercent = true,
  tone = "default",
}: ProcurementProgressProps) => {
  const progress = procurement.currentVolumePercent
  const barH = size === "sm" ? "h-2" : "h-2.5"
  const inverse = tone === "inverse"
  const metMin = progress >= procurement.minVolumePercent

  return (
    <div className="relative space-y-2">
      {showPercent ? (
        <span
          className={cn(
            "absolute right-0 top-0 z-[1] text-xs font-semibold tabular-nums leading-none",
            inverse ? "text-white" : "text-sky-800 dark:text-cyan-300",
          )}
        >
          {progress}%
        </span>
      ) : null}
      <p
        className={cn(
          "pr-10 text-xs font-medium leading-normal",
          inverse ? "text-white/90" : "text-slate-500 dark:text-slate-400",
        )}
      >
        {formatWeightKg(procurement.currentWeightKg)}
        <span className={inverse ? "text-white/55" : "text-slate-400 dark:text-slate-500"}>
          {" "}
          / {formatWeightKg(procurement.targetWeightKg)}
        </span>
      </p>
      <div
        className={cn(
          "overflow-hidden rounded-lg",
          barH,
          inverse ? "bg-white/25" : "bg-slate-200 dark:bg-slate-700",
        )}
      >
        <div
          className={cn(
            "rounded-lg transition-all duration-500",
            barH,
            inverse
              ? "bg-white"
              : metMin
                ? "ui-progress-fill--ok"
                : "ui-progress-fill--low",
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showHint ? (
        <p
          className={cn(
            "text-[11px] font-normal leading-relaxed",
            inverse ? "text-white/75" : "text-slate-500 dark:text-slate-400",
          )}
        >
          Вес вашего заказа добавится к сбору после оплаты
        </p>
      ) : null}
    </div>
  )
}
