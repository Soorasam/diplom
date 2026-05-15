import { Link } from "react-router-dom"
import {
  Bell,
  ChevronRight,
  Headphones,
  LogOut,
  MapPin,
  Truck,
  User,
} from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { routes } from "@/shared/config/routes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Button } from "@/shared/ui/button/Button"

const menuLinks = [
  { to: routes.addresses, label: "Населённый пункт", icon: MapPin },
  { to: routes.notifications, label: "Уведомления", icon: Bell },
  { to: routes.support, label: "Поддержка", icon: Headphones },
  { to: routes.pickupPoints, label: "Пункты выдачи", icon: MapPin },
]

export const ProfilePage = () => {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader title="Профиль" />

      <Card className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <User size={28} />
        </span>
        <div>
          <p className="font-semibold text-slate-900">
            {user?.name ?? "Гость"}
          </p>
          <p className="text-sm text-slate-500">{user?.phone ?? "Не авторизован"}</p>
          {user ? (
            <p className="mt-0.5 text-xs text-blue-600 capitalize">
              {user.role === "client" ? "Житель" : user.role === "driver" ? "Водитель" : "Админ"}
            </p>
          ) : null}
        </div>
      </Card>

      {!isAuthenticated ? (
        <Link
          to={routes.auth}
          className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Войти
        </Link>
      ) : null}

      <ul className="flex flex-col gap-2">
        {menuLinks.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-200"
            >
              <item.icon size={20} className="text-blue-600" />
              <span className="flex-1 text-sm font-medium text-slate-800">{item.label}</span>
              <ChevronRight size={18} className="text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>

      <Card className="bg-slate-50">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Демо-режимы
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <Link
            to={routes.driver.root}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            <Truck size={16} />
            Интерфейс водителя
          </Link>
          <Link
            to={routes.admin.root}
            className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            <User size={16} />
            Панель администратора
          </Link>
        </div>
      </Card>

      {isAuthenticated ? (
        <Button variant="outline" fullWidth onClick={logout}>
          <LogOut size={18} />
          Выйти
        </Button>
      ) : null}
    </div>
  )
}
