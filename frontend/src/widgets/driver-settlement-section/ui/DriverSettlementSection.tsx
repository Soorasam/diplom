import type { ReactNode } from "react"
import { MapPin } from "lucide-react"

import { cn } from "@/shared/lib/cn"

type Props = {
  index: number
  label: string
  meta?: string
  children: ReactNode
  active?: boolean
}

export const DriverSettlementSection = ({
  index,
  label,
  meta,
  children,
  active,
}: Props) => (
  <section>
    <div
      className={cn(
        "ui-settlement-header",
        active && "ui-settlement-header--active",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          active
            ? "bg-sky-500 text-white"
            : "bg-slate-900 text-white dark:bg-slate-700",
        )}
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-bold">{label}</h2>
        {meta ? (
          <p
            className={cn(
              "text-xs",
              active ? "text-slate-300" : "text-slate-500 dark:text-slate-400",
            )}
          >
            {meta}
          </p>
        ) : null}
      </div>
      <MapPin
        size={18}
        className={active ? "text-sky-300" : "text-slate-400 dark:text-slate-500"}
      />
    </div>
    {children}
  </section>
)
