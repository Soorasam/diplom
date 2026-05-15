import { Outlet, Link, useLocation } from "react-router-dom"
import { LayoutDashboard, ListOrdered, Map, Route } from "lucide-react"

import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

const tabs = [
  { label: "Сводка", path: routes.driver.root, icon: LayoutDashboard },
  { label: "Маршрут", path: routes.driver.route, icon: Route },
  { label: "Заказы", path: routes.driver.orders, icon: ListOrdered },
  { label: "Карта", path: routes.driver.map, icon: Map },
]

export const DriverLayout = () => {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm safe-top">
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
          Водитель
        </p>
        <h1 className="text-lg font-bold text-slate-900">Логистика маршрутов</h1>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white safe-bottom">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
          {tabs.map((tab) => {
            const active =
              tab.path === routes.driver.root
                ? pathname === tab.path
                : pathname.startsWith(tab.path)
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex min-w-[4rem] flex-col items-center gap-0.5 text-[11px] font-medium",
                  active ? "text-blue-600" : "text-slate-400",
                )}
              >
                <tab.icon size={22} />
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
