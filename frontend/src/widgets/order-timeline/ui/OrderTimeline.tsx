import { Check } from "lucide-react"

import type { Order } from "@/shared/api/mock-db"
import { formatShortDate } from "@/shared/lib/format"
import { cn } from "@/shared/lib/cn"

interface OrderTimelineProps {
  timeline: Order["timeline"]
}

export const OrderTimeline = ({ timeline }: OrderTimelineProps) => (
  <ol className="relative space-y-0">
    {timeline.map((step, index) => {
      const isLast = index === timeline.length - 1

      return (
        <li key={`${step.status}-${step.at}`} className="flex gap-3 pb-5 last:pb-0">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                isLast
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-blue-200 bg-blue-50 text-blue-600",
              )}
            >
              <Check size={14} />
            </span>
            {!isLast ? <span className="mt-1 w-0.5 flex-1 bg-blue-100" /> : null}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-900">{step.label}</p>
            <p className="text-xs text-slate-500">{formatShortDate(step.at)}</p>
          </div>
        </li>
      )
    })}
  </ol>
)
