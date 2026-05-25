import { Link, Outlet, useLocation } from "react-router-dom"
import {
  BarChart3,
  LayoutDashboard,
  MessageSquare,
  Package,
  Route,
  Truck,
  User,
  UserPlus,
  Users,
  MapPin,
  FileText,
} from "lucide-react"

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
  { label: "Сотрудник ПВЗ", path: routes.admin.pvzEmployees, icon: UserPlus },
  { label: "Споры", path: routes.admin.tickets, icon: MessageSquare },
  { label: "Насел. пункты", path: routes.admin.settlements, icon: MapPin },
  { label: "Пользователи", path: routes.admin.users, icon: Users },
  { label: "Аналитика", path: routes.admin.analytics, icon: BarChart3 },
  { label: "Профиль", path: routes.admin.profile, icon: User },
]

export const AdminLayout = () => {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans dark:bg-[#0F141C]">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-[#18202C]">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase leading-normal tracking-wide text-sky-600 dark:text-sky-400">
            Админ
          </p>
          <p className="font-bold leading-normal text-slate-900 dark:text-slate-100">
            Коопзакупки Якутия
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {nav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.path ||
                  (item.path !== routes.admin.root && pathname.startsWith(item.path))
                  ? "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 pb-24 safe-top md:p-6 md:pb-6">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white safe-bottom md:hidden dark:border-slate-800 dark:bg-[#18202C]">
          <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
            <Link
              to={routes.admin.root}
              className={cn(
                "flex min-w-[4rem] flex-col items-center gap-1 text-[11px] font-medium",
                pathname === routes.admin.root
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              <LayoutDashboard size={22} />
              Дашборд
            </Link>
            <Link
              to={routes.admin.profile}
              className={cn(
                "flex min-w-[4rem] flex-col items-center gap-1 text-[11px] font-medium",
                pathname.startsWith(routes.admin.profile)
                  ? "text-sky-600 dark:text-sky-400"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              <User size={22} />
              Профиль
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
