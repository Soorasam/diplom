import type { ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

interface PageShellProps {
  children: ReactNode
  /** Доп. отступ снизу под фиксированную панель (корзина, оплата) */
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
      "mx-auto flex w-full max-w-[480px] flex-col gap-6 px-4 pt-4",
      withStickyFooter ? "pb-[13.5rem]" : "pb-28",
      className,
    )}
  >
    {children}
  </div>
)
