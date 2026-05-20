import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, ListOrdered, PackageSearch, QrCode } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

const tabs = [
  { label: "Сводка", path: routes.employee.root, icon: LayoutDashboard },
  { label: "Сборы", path: routes.employee.procurements, icon: PackageSearch },
  { label: "Заказы", path: routes.employee.orders, icon: ListOrdered },
  { label: "Скан", path: routes.employee.scan, icon: QrCode },
]

export const EmployeeLayout = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm safe-top">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
              ПВЗ
            </p>
            <h1 className="text-lg font-bold text-slate-900">Выдача заказов</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              logout()
              navigate(routes.home, { replace: true })
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Выйти
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 overflow-y-auto px-4 py-4 pb-24">
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
                  "flex min-w-[4rem] flex-col items-center gap-0.5 text-[11px] font-medium",
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

