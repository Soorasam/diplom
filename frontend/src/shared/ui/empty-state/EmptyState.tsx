import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/shared/ui/button/Button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  children?: ReactNode
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) => (
  <div
    className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center"
  >
    <Icon className="text-slate-300" size={40} strokeWidth={1.25} />

    <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>

    {description ? (
      <p className="mt-1 max-w-xs text-xs text-slate-500">{description}</p>
    ) : null}

    {children}

    {actionLabel && onAction ? (
      <Button className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
)
