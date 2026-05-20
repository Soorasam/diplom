import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  BarChart3,
  LayoutDashboard,
  Map,
  MessageSquare,
  Package,
  Route,
  Truck,
  Users,
  MapPin,
  FileText,
  LogOut,
} from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

const nav = [
  { label: "Дашборд", path: routes.admin.root, icon: LayoutDashboard },
  { label: "Заказы", path: routes.admin.orders, icon: Package },
  { label: "Товары", path: routes.admin.products, icon: Package },
  { label: "Маршруты", path: routes.admin.routes, icon: Route },
  { label: "Сборы", path: routes.admin.procurements, icon: Package },
  { label: "Водители", path: routes.admin.drivers, icon: Truck },
  { label: "Заявки", path: routes.admin.driverApplications, icon: FileText },
  { label: "ПВЗ", path: routes.admin.pvz, icon: MapPin },
  { label: "Споры", path: routes.admin.tickets, icon: MessageSquare },
  { label: "Насел. пункты", path: routes.admin.settlements, icon: MapPin },
  { label: "Пользователи", path: routes.admin.users, icon: Users },
  { label: "Аналитика", path: routes.admin.analytics, icon: BarChart3 },
]

export const AdminLayout = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-xs font-semibold uppercase text-blue-600">Админ</p>
          <p className="font-bold text-slate-900">Коопзакупки Якутия</p>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === item.path || (item.path !== routes.admin.root && pathname.startsWith(item.path))
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          to={routes.home}
          className="m-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <Map size={16} />
          К клиенту
        </Link>

        <button
          type="button"
          onClick={() => {
            logout()
            navigate(routes.home, { replace: true })
          }}
          className="m-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          <LogOut size={16} />
          Выйти
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 py-3 md:hidden safe-top">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-slate-900">Админ-панель</p>
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

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
