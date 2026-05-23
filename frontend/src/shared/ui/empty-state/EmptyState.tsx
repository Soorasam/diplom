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
  <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
      <Icon className="text-sky-500 dark:text-sky-400" size={28} strokeWidth={1.35} />
    </div>

    <p className="mt-4 text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
      {title}
    </p>

    {description ? (
      <p className="mt-2 max-w-xs text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
        {description}
      </p>
    ) : null}

    {children}

    {actionLabel && onAction ? (
      <Button className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
)
