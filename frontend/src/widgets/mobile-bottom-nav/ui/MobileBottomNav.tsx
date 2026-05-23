import { Link, useLocation } from "react-router-dom"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/cn"

export type MobileNavTab = {
  label: string
  path: string
  icon: LucideIcon
  match: (pathname: string) => boolean
  badge?: number
}

interface MobileBottomNavProps {
  tabs: MobileNavTab[]
}

export const MobileBottomNav = ({ tabs }: MobileBottomNavProps) => {
  const location = useLocation()

  return (
    <nav
      data-bottom-nav
      className="fixed bottom-0 left-[50vw] z-50 w-screen -translate-x-1/2 border-t border-slate-200/90 bg-white/90 shadow-[0_-6px_28px_-10px_rgba(15,23,42,0.12)] backdrop-blur-lg safe-bottom"
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-[480px] items-stretch justify-between gap-0.5 px-2 pt-1">
        {tabs.map((tab) => {
          const active = tab.match(location.pathname)
          const showBadge = tab.badge != null && tab.badge > 0

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 transition-all",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
              )}
            >
              <span className="relative">
                <tab.icon size={22} strokeWidth={active ? 2.25 : 1.75} />
                {showBadge ? (
                  <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {tab.badge! > 9 ? "9+" : tab.badge}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[10px] font-medium leading-none",
                  active && "font-semibold",
                )}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
