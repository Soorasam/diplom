import { Minus, Plus } from "lucide-react"

import { cn } from "@/shared/lib/cn"

interface QuantityStepperProps {
  quantity: number
  onDecrease: () => void
  onIncrease: () => void
  size?: "sm" | "md"
  className?: string
}

export const QuantityStepper = ({
  quantity,
  onDecrease,
  onIncrease,
  size = "md",
  className,
}: QuantityStepperProps) => (
  <div
    className={cn(
      "flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-0.5",
      size === "sm" && "rounded-lg",
      className,
    )}
  >
    <button
      type="button"
      onClick={onDecrease}
      className={cn(
        "flex items-center justify-center rounded-lg text-slate-600 transition hover:bg-white",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
      )}
      aria-label="Уменьшить"
    >
      <Minus size={size === "sm" ? 14 : 16} />
    </button>
    <span
      className={cn(
        "min-w-8 text-center font-bold tabular-nums text-slate-900",
        size === "sm" ? "text-xs" : "text-sm",
      )}
    >
      {quantity}
    </span>
    <button
      type="button"
      onClick={onIncrease}
      className={cn(
        "flex items-center justify-center rounded-lg text-slate-600 transition hover:bg-white",
        size === "sm" ? "h-7 w-7" : "h-9 w-9",
      )}
      aria-label="Увеличить"
    >
      <Plus size={size === "sm" ? 14 : 16} />
    </button>
  </div>
)
