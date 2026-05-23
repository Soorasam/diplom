import { useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  Bell,
  ChevronRight,
  Headphones,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Pencil,
  Truck,
  User,
} from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useCanUseDriverMode } from "@/features/auth/hooks/useCanUseDriverMode"
import { InterfaceModeSwitch } from "@/features/auth/ui/InterfaceModeSwitch"
import { useMyDriverApplication } from "@/features/driver-application/api/useDriverApplications"
import { routes } from "@/shared/config/routes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Card } from "@/shared/ui/card/Card"
import { Button } from "@/shared/ui/button/Button"

const menuLinks = [
  { to: routes.orders, label: "Мои заказы", icon: Package },
  { to: routes.profileEdit, label: "Редактировать данные", icon: Pencil },
  { to: routes.disputes, label: "Мои споры", icon: MessageSquare },
  { to: routes.addresses, label: "Населённый пункт", icon: MapPin },
  { to: routes.notifications, label: "Уведомления", icon: Bell },
  { to: routes.support, label: "Поддержка", icon: Headphones },
  { to: routes.pickupPoints, label: "Пункты выдачи", icon: MapPin },
]

export const ProfilePage = () => {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: myApp } = useMyDriverApplication()
  const { canUseDriverMode } = useCanUseDriverMode()

  const isDriverApproved = myApp?.status === "approved"
  const isSimpleResident =
    isAuthenticated && user?.role === "client" && !canUseDriverMode

  useEffect(() => {
    if (isDriverApproved) {
      void refreshUser()
    }
  }, [isDriverApproved, refreshUser])

  const workspaceLink =
    user?.role === "admin"
      ? pathname.startsWith(routes.admin.root)
        ? {
            to: routes.home,
            label: "Переключиться на клиентский интерфейс",
            icon: LayoutDashboard,
          }
        : {
            to: routes.admin.root,
            label: "Панель администратора",
            icon: LayoutDashboard,
          }
      : user?.role === "employee"
        ? { to: routes.employee.root, label: "Интерфейс ПВЗ", icon: MapPin }
        : null

  return (
    <PageShell>
      <PageHeader title="Профиль" />

      <Card className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          <User size={28} />
        </span>
        <div>
          <p className="font-semibold text-slate-900">{user?.name ?? "Гость"}</p>
          <p className="text-sm text-slate-500">{user?.phone ?? "Не авторизован"}</p>
        </div>
      </Card>

      {canUseDriverMode ? <InterfaceModeSwitch navigateOnSwitch /> : null}

      {workspaceLink ? (
        <Link
          to={workspaceLink.to}
          className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-200"
        >
          <workspaceLink.icon size={20} className="text-blue-600" />
          <span className="flex-1 text-sm font-medium text-slate-800">
            {workspaceLink.label}
          </span>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
      ) : null}

      {isSimpleResident ? (
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
                Дождитесь решения администратора — после одобрения переключатель режимов
                появится здесь.
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

      {user?.role === "client" || user?.role === "driver" ? (
        <ul className="flex flex-col gap-2">
          {menuLinks.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-200"
              >
                <item.icon size={20} className="text-blue-600" />
                <span className="flex-1 text-sm font-medium text-slate-800">
                  {item.label}
                </span>
                <ChevronRight size={18} className="text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {isAuthenticated ? (
        <Button variant="outline" fullWidth onClick={logout}>
          <LogOut size={18} />
          Выйти
        </Button>
      ) : null}
    </PageShell>
  )
}
