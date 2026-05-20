import { useEffect } from "react"
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
import { DriverRoleSwitch } from "@/features/auth/ui/DriverRoleSwitch"
import { useMyDriverApplication } from "@/features/driver-application/api/useDriverApplications"
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
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: myApp } = useMyDriverApplication()

  const isDriverApproved = myApp?.status === "approved"
  const canSwitchDriverRole = isDriverApproved || user?.role === "driver"

  useEffect(() => {
    if (isDriverApproved) {
      void refreshUser()
    }
  }, [isDriverApproved, refreshUser])

  return (
    <div className="flex flex-col gap-4 p-4">
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
              {user.role === "client"
                ? "Житель"
                : user.role === "driver"
                  ? "Водитель"
                  : user.role === "employee"
                    ? "ПВЗ"
                    : "Админ"}
            </p>
          ) : null}
        </div>
      </Card>

      {isAuthenticated && canSwitchDriverRole ? (
        <DriverRoleSwitch navigateOnSwitch />
      ) : isAuthenticated && user?.role === "client" ? (
        <Card className="border-blue-100 bg-blue-50/40">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Стать водителем</p>
              <p className="mt-1 text-sm text-slate-600">
                {myApp
                  ? myApp.status === "pending"
                    ? "Заявка на проверке"
                    : "Заявка отклонена — исправьте и отправьте заново"
                  : "Заполните заявку и загрузите документы"}
              </p>
              {myApp?.status === "rejected" && myApp.rejectionReason ? (
                <p className="mt-2 text-sm font-medium text-amber-800">
                  Причина: {myApp.rejectionReason}
                </p>
              ) : null}
            </div>
            <Truck className="text-blue-700" size={22} />
          </div>
          <div className="mt-3">
            {myApp?.status === "pending" ? (
              <p className="rounded-xl bg-white/80 px-4 py-3 text-sm text-slate-600">
                Дождитесь решения администратора — после одобрения появится переключатель роли.
              </p>
            ) : (
              <Link
                to={routes.driverApply}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                {myApp?.status === "rejected" ? "Исправить заявку" : "Открыть заявку"}
              </Link>
            )}
          </div>
        </Card>
      ) : null}

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
          {user?.role === "driver" ? (
            <Link
              to={routes.driver.root}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
            >
              <Truck size={16} />
              Интерфейс водителя
            </Link>
          ) : canSwitchDriverRole ? (
            <p className="text-xs text-slate-500">
              Переключитесь в режим водителя выше, чтобы открыть интерфейс.
            </p>
          ) : null}
          {user?.role === "admin" ? (
            <Link
              to={routes.admin.root}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
            >
              <User size={16} />
              Панель администратора
            </Link>
          ) : null}
          {user?.role === "employee" ? (
            <Link
              to={routes.employee.root}
              className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
            >
              <MapPin size={16} />
              Интерфейс ПВЗ
            </Link>
          ) : null}

          {user?.role === "client" && !canSwitchDriverRole ? (
            <p className="text-xs text-slate-500">
              Рольные интерфейсы откроются после одобрения/назначения роли.
            </p>
          ) : null}
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
