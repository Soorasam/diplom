import type { ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

type ContentBlockProps = {
  children: ReactNode
  className?: string
  innerClassName?: string
  withBottomNav?: boolean
}


export const ContentBlock = ({
  children,
  className,
  innerClassName,
  withBottomNav = true,
}: ContentBlockProps) => (
  <div
    className={cn(
      "content-block relative left-1/2 z-10 -mt-8 w-[100vw] max-w-[100vw] -translate-x-1/2 rounded-t-2xl",
      className,
    )}
  >
    <div
      className={cn(
        "mx-auto flex w-full max-w-[480px] flex-col gap-4 p-4",
        withBottomNav ? "pb-28" : "pb-4",
        innerClassName,
      )}
    >
      {children}
    </div>
  </div>
)
