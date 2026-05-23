import type { ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

type PatternHeroProps = {
  children: ReactNode
  className?: string
  /** Внутри колонки приложения, без выхода за max-w */
  contained?: boolean
}

/** Хедер главной и похожих экранов */
export const PatternHero = ({
  children,
  className,
  contained = false,
}: PatternHeroProps) => (
  <header
    className={cn(
      contained
        ? "home-hero overflow-hidden rounded-2xl border border-slate-700/40"
        : "pattern-hero relative left-1/2 z-0 w-[100vw] max-w-[100vw] -translate-x-1/2",
      className,
    )}
  >
    <div
      className={cn(
        "mx-auto w-full max-w-[480px]",
        contained
          ? "p-4"
          : "px-4 pb-10 pt-[max(1.25rem,calc(env(safe-area-inset-top,0px)+1rem))]",
      )}
    >
      {children}
    </div>
  </header>
)
