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
  tone?: "default" | "inverse"
}

export const ProcurementProgress = ({
  procurement,
  size = "md",
  showHint = false,
  tone = "default",
}: ProcurementProgressProps) => {
  const progress = procurement.currentVolumePercent
  const barH = size === "sm" ? "h-1.5" : "h-2.5"
  const inverse = tone === "inverse"

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span
          className={cn(
            "font-medium",
            inverse ? "text-blue-50" : "text-slate-600",
          )}
        >
          {formatWeightKg(procurement.currentWeightKg)}
          <span className={inverse ? "text-blue-200/80" : "text-slate-400"}> / </span>
          {formatWeightKg(procurement.targetWeightKg)}
        </span>
        <span
          className={cn(
            "tabular-nums font-bold",
            inverse
              ? "text-white"
              : progress >= procurement.minVolumePercent
                ? "text-emerald-700"
                : "text-blue-700",
          )}
        >
          {progress}%
        </span>
      </div>
      <div
        className={cn(
          "overflow-hidden rounded-full",
          barH,
          inverse ? "bg-white/25" : "bg-slate-200/80",
        )}
      >
        <div
          className={cn(
            "rounded-full transition-all duration-500",
            barH,
            inverse
              ? "bg-white"
              : "bg-gradient-to-r from-blue-500 to-blue-600",
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {showHint ? (
        <p
          className={cn(
            "text-[11px] leading-snug",
            inverse ? "text-blue-100" : "text-slate-500",
          )}
        >
          Вес вашего заказа добавится к сбору после оплаты
        </p>
      ) : null}
    </div>
  )
}
