import type { ReactNode } from "react"



import { BackLink } from "@/shared/ui/page-header/BackLink"

import { cn } from "@/shared/lib/cn"



interface PageHeaderProps {

  title: string

  subtitle?: string

  backTo?: string

  backLabel?: string

  action?: ReactNode

  className?: string

  /** Без липкой панели (редкие полноэкранные экраны) */

  static?: boolean

}



export const PageHeader = ({

  title,

  subtitle,

  backTo,

  backLabel,

  action,

  className,

  static: isStatic,

}: PageHeaderProps) => (

  <div className={cn("page-header-wrap -mx-4 -mt-4", className)}>

    <header

      className={cn(

        "page-header-glass px-4 pb-4",

        isStatic ? "relative" : "sticky top-0 z-30",

      )}

    >

      {backTo ? <BackLink to={backTo} label={backLabel} /> : null}



      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0 flex-1">

          <div className="page-header-accent" aria-hidden />

          <h1 className="text-xl font-bold leading-normal tracking-tight text-slate-900 dark:text-slate-100">

            {title}

          </h1>

          {subtitle ? (

            <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">

              {subtitle}

            </p>

          ) : null}

        </div>

        {action ? <div className="shrink-0 pt-1">{action}</div> : null}

      </div>

    </header>

  </div>

)

