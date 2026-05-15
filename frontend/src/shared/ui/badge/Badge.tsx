import type { HTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

type BadgeVariant = "default" | "success" | "warning" | "info" | "danger"

const variants: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200",
  success: "bg-emerald-50 text-emerald-800 border-emerald-100",
  warning: "bg-amber-50 text-amber-900 border-amber-100",
  info: "bg-blue-50 text-blue-800 border-blue-100",
  danger: "bg-red-50 text-red-800 border-red-100",
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export const Badge = ({
  className,
  variant = "default",
  ...props
}: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      variants[variant],
      className,
    )}
    {...props}
  />
)
