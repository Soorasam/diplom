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
    box: "border-blue-200/80 bg-blue-50/90 text-blue-950",
    icon: "text-blue-600",
    Icon: Info,
  },
  warning: {
    box: "border-amber-200/80 bg-amber-50/90 text-amber-950",
    icon: "text-amber-600",
    Icon: AlertTriangle,
  },
  success: {
    box: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
    icon: "text-emerald-600",
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
        "flex gap-3 rounded-2xl border px-4 py-3.5 shadow-sm",
        box,
        className,
      )}
      role="status"
    >
      <Icon size={20} className={cn("mt-0.5 shrink-0", icon)} aria-hidden />
      <div className="min-w-0 text-sm leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? "mt-0.5 opacity-90" : undefined}>{children}</div>
      </div>
    </div>
  )
}
