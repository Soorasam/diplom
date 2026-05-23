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

      className="fixed bottom-0 left-[50vw] z-50 w-screen -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur-md safe-bottom dark:border-slate-800 dark:bg-[#18202C]/95"

    >

      <div className="mx-auto flex h-[4.5rem] w-full max-w-[480px] items-stretch justify-between gap-1 p-2">

        {tabs.map((tab) => {

          const active = tab.match(location.pathname)

          const showBadge = tab.badge != null && tab.badge > 0



          return (

            <Link

              key={tab.path}

              to={tab.path}

              className={cn(

                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border p-2 transition-colors duration-200",

                active

                  ? "border-cyan-400/50 bg-gradient-to-b from-sky-100 to-cyan-100 text-sky-900 dark:border-cyan-700/50 dark:from-sky-950/60 dark:to-cyan-950/40 dark:text-cyan-300"

                  : "border-transparent text-slate-500 hover:bg-sky-50/80 hover:text-sky-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-300",

              )}

            >

              <span className="relative">

                <tab.icon size={22} strokeWidth={active ? 2.25 : 1.65} />

                {showBadge ? (

                  <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-lg bg-sky-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:bg-sky-500 dark:ring-[#18202C]">

                    {tab.badge! > 9 ? "9+" : tab.badge}

                  </span>

                ) : null}

              </span>

              <span

                className="max-w-full truncate text-[10px] font-medium leading-none"

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

