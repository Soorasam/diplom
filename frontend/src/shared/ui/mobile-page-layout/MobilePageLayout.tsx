import type { ReactNode } from "react"

/** Фон и контейнер как у жительского AppLayout (без нижнего навбара) */
export const MobilePageLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh bg-gradient-to-b from-slate-100 via-blue-50/30 to-slate-50">
    {children}
  </div>
)
