import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/shared/lib/cn"

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  action?: ReactNode
  className?: string
}

export const PageHeader = ({
  title,
  subtitle,
  backTo,
  action,
  className,
}: PageHeaderProps) => (
  <header className={cn("mb-4", className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {backTo ? (
          <Link
            to={backTo}
            className="mb-2 inline-flex items-center gap-0.5 text-sm font-medium text-blue-600"
          >
            <ChevronLeft size={18} />
            Назад
          </Link>
        ) : null}

        <h1 className="text-xl font-bold text-slate-900">{title}</h1>

        {subtitle ? (
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  </header>
)
