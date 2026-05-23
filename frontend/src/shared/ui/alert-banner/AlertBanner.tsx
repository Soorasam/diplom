import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertTriangle, Info } from "lucide-react"

import { cn } from "@/shared/lib/cn"

type AlertVariant = "info" | "warning" | "success"

const styles: Record<
  AlertVariant,
  { box: string; icon: string; Icon: LucideIcon }
> = {
  info: {
    box: "border-sky-200 bg-sky-50 text-slate-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-slate-100",
    icon: "text-sky-600 dark:text-sky-400",
    Icon: Info,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: Info,
  },
}

interface AlertBannerProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
}

export const AlertBanner = ({
  variant = "info",
  title,
  children,
  className,
}: AlertBannerProps) => {
  const { box, icon, Icon } = styles[variant]
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        box,
        className,
      )}
      role="status"
    >
      <Icon size={20} className={cn("mt-0.5 shrink-0", icon)} aria-hidden />
      <div className="min-w-0 text-sm font-normal leading-relaxed">
        {title ? <p className="font-semibold leading-normal">{title}</p> : null}
        <div className={title ? "mt-1 opacity-90" : undefined}>{children}</div>
      </div>
    </div>
  )
}
