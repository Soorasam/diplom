import type { ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

interface StickyActionBarProps {
  children: ReactNode
  className?: string
}

/** Панель над нижним таб-баром (bottom ~4.5rem) */
export const StickyActionBar = ({ children, className }: StickyActionBarProps) => (
  <div
    className={cn(
      "fixed bottom-[4.75rem] left-[50vw] z-40 w-full max-w-[480px] -translate-x-1/2 px-4",
      className,
    )}
  >
    <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_-8px_32px_-12px_rgba(15,23,42,0.18)] backdrop-blur-md">
      {children}
    </div>
  </div>
)
