import { Link, Outlet, useLocation } from "react-router-dom"
import { LayoutDashboard, ListOrdered, PackageSearch, QrCode, User } from "lucide-react"

import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

const tabs = [
  { label: "Сводка", path: routes.employee.root, icon: LayoutDashboard },
  { label: "Сборы", path: routes.employee.procurements, icon: PackageSearch },
  { label: "Заказы", path: routes.employee.orders, icon: ListOrdered },
  { label: "Скан", path: routes.employee.scan, icon: QrCode },
  { label: "Профиль", path: routes.employee.profile, icon: User },
]

export const EmployeeLayout = () => {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4 pb-24 safe-top">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-[50vw] z-50 w-screen -translate-x-1/2 border-t border-slate-200 bg-white safe-bottom">
        <div className="mx-auto flex h-16 w-full max-w-lg items-center justify-around">
          {tabs.map((tab) => {
            const active =
              tab.path === routes.employee.root
                ? pathname === tab.path
                : pathname.startsWith(tab.path)
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex min-w-[3.5rem] flex-col items-center gap-0.5 text-[11px] font-medium",
                  active ? "text-emerald-700" : "text-slate-400",
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
