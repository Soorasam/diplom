import type { ReactNode } from "react"



import { cn } from "@/shared/lib/cn"



interface PageShellProps {

  children: ReactNode

  withStickyFooter?: boolean

  className?: string

}



export const PageShell = ({

  children,

  withStickyFooter = false,

  className,

}: PageShellProps) => (

  <div

    className={cn(

      "mx-auto flex w-full max-w-[480px] flex-col gap-4 p-4 font-sans text-slate-900 dark:text-slate-100",

      withStickyFooter ? "pb-[14rem]" : "pb-28",

      className,

    )}

  >

    {children}

  </div>

)

