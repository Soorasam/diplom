import { useEffect, useMemo, useState } from "react"

import { Link, useLocation } from "react-router-dom"

import {
  Bell,
  Car,
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
import { ModeSwitchControl } from "@/features/auth/ui/ModeSwitchControl"
import { ThemeToggle } from "@/features/ui/ThemeToggle"
import { useMyDriverApplication } from "@/features/driver-application/api/useDriverApplications"
import { useUnreadNotificationsCount } from "@/entities/notification/api/useNotifications"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import { useUnreadDisputesCount } from "@/entities/ticket/api/useTickets"
import { routes } from "@/shared/config/routes"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { PageShell } from "@/shared/ui/page-shell/PageShell"
import { Card } from "@/shared/ui/card/Card"
import { Button } from "@/shared/ui/button/Button"

export const ProfilePage = () => {
  const { pathname } = useLocation()
  const profileRoutes = useProfileRoutes()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const refreshUser = useAuthStore((s) => s.refreshUser)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { data: myApp } = useMyDriverApplication()
  const { canUseDriverMode } = useCanUseDriverMode()
  const { data: settlements } = useSettlements()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const settlementName = useMemo(
    () => settlements?.find((s) => s.id === user?.settlementId)?.name,
    [settlements, user?.settlementId],
  )

  const isAdmin = user?.role === "admin"
  const isAdminWorkspace = isAdmin && pathname.startsWith(routes.admin.root)
  const isUserWorkspace =
    pathname === routes.user.root || pathname.startsWith(`${routes.user.root}/`)
  const isDriverInterface = user?.role === "driver"
  const isSimpleResident =
    isAuthenticated && user?.role === "client" && !canUseDriverMode
  const isDriverApproved = myApp?.status === "approved"

  const showDisputesMenu = isAuthenticated && !isAdminWorkspace
  const unreadNotifications = useUnreadNotificationsCount()
  const unreadDisputes = useUnreadDisputesCount(showDisputesMenu)

  const menuLinks = isAdminWorkspace
    ? []
    : isDriverInterface
      ? [
          ...(isAdmin
            ? []
            : [{ to: profileRoutes.profileEdit, label: "Редактировать данные", icon: Pencil }]),
          { to: profileRoutes.disputes, label: "Мои споры", icon: MessageSquare },
          { to: profileRoutes.notifications, label: "Уведомления", icon: Bell },
          { to: profileRoutes.support, label: "Поддержка", icon: Headphones },
        ]
      : [
          { to: profileRoutes.orders, label: "Мои заказы", icon: Package },
          ...(isAdmin
            ? []
            : [{ to: profileRoutes.profileEdit, label: "Редактировать данные", icon: Pencil }]),
          { to: profileRoutes.disputes, label: "Мои споры", icon: MessageSquare },
          { to: profileRoutes.addresses, label: "Населённый пункт", icon: MapPin },
          { to: profileRoutes.notifications, label: "Уведомления", icon: Bell },
          { to: profileRoutes.support, label: "Поддержка", icon: Headphones },
        ]

  const vehicleLines = useMemo(() => {
    if (!myApp?.vehicleSummary) return []
    return myApp.vehicleSummary
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  }, [myApp?.vehicleSummary])

  useEffect(() => {
    if (isDriverApproved) {
      void refreshUser()
    }
  }, [isDriverApproved, refreshUser])

  const workspaceLink = isAdmin
    ? isAdminWorkspace
      ? {
          to: routes.user.root,
          label: "Интерфейс жителя",
          icon: LayoutDashboard,
        }
      : isUserWorkspace
        ? {
            to: routes.admin.root,
            label: "Панель администратора",
            icon: LayoutDashboard,
          }
        : null
    : null

  return (
    <PageShell>
      <PageHeader title="Профиль" />

      <Card className="flex items-center gap-4 p-4">
        <span className="ui-avatar h-14 w-14">
          <User size={28} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-normal text-slate-900 dark:text-slate-100">
            {user?.name ?? "Гость"}
          </p>
          {isAuthenticated ? (
            <>
              <p className="mt-1 text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-300">
                {user?.phone}
              </p>
              {isAdminWorkspace ? (
                <>
                  {user?.email ? (
                    <p className="mt-0.5 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                      {user.email}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-sm font-normal leading-relaxed text-sky-700 dark:text-cyan-300">
                    Администратор
                  </p>
                </>
              ) : !isDriverInterface ? (
                <p className="mt-0.5 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                  {settlementName ?? "Населённый пункт не выбран"}
                </p>
              ) : (
                <p className="mt-0.5 text-sm font-normal leading-relaxed text-sky-700 dark:text-cyan-300">
                  Режим водителя
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
              Не авторизован
            </p>
          )}
        </div>
        {isAuthenticated ? <ThemeToggle /> : null}
      </Card>

      {!isAdminWorkspace && canUseDriverMode && !isDriverInterface ? (
        <Card className="w-full p-4">
          <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
            Режим интерфейса
          </p>
          <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
            Переключение между заказами жителя и маршрутами водителя.
          </p>
          <ModeSwitchControl className="mt-4" navigateOnSwitch />
        </Card>
      ) : null}

      {!isAdminWorkspace && canUseDriverMode && isDriverInterface ? (
        <Card className="w-full p-4">
          <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
            Режим интерфейса
          </p>
          <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
            Переключение между заказами жителя и маршрутами водителя.
          </p>
          <ModeSwitchControl className="mt-4" navigateOnSwitch />
        </Card>
      ) : null}

      {isDriverInterface && (vehicleLines.length > 0 || isDriverApproved) ? (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <span className="ui-icon-well flex h-10 w-10 shrink-0">
              <Car size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Транспорт
              </p>
              {vehicleLines.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {vehicleLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Данные из одобренной заявки
                </p>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {workspaceLink ? (
        <Link to={workspaceLink.to} className="ui-menu-link">
          <workspaceLink.icon size={20} className="text-sky-600 dark:text-sky-400" />
          <span className="flex-1 text-sm font-medium leading-normal text-slate-900 dark:text-slate-100">
            {workspaceLink.label}
          </span>
          <ChevronRight size={18} className="text-slate-400" />
        </Link>
      ) : null}

      {!isAdminWorkspace && isSimpleResident ? (
        <Card className="ui-panel p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
                Стать водителем
              </p>
              <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                {myApp
                  ? myApp.status === "pending"
                    ? "Заявка на проверке"
                    : "Заявка отклонена — исправьте и отправьте заново"
                  : "Согласие, документы и данные авто"}
              </p>
              {myApp?.status === "rejected" && myApp.rejectionReason ? (
                <p className="mt-2 text-sm font-medium leading-normal text-amber-800 dark:text-amber-300">
                  Причина: {myApp.rejectionReason}
                </p>
              ) : null}
            </div>
            <Truck className="text-sky-600 dark:text-sky-400" size={22} />
          </div>
          <div className="mt-3">
            {myApp?.status === "pending" ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal leading-relaxed text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Дождитесь решения администратора — после одобрения переключатель режимов
                появится здесь.
              </p>
            ) : (
              <Link to={routes.driverApply} className="ui-cta ui-cta-primary ui-cta-block">
                {myApp?.status === "rejected" ? "Исправить заявку" : "Открыть заявку"}
              </Link>
            )}
          </div>
        </Card>
      ) : null}

      {!isAuthenticated ? (
        <Link to={routes.auth} className="ui-cta ui-cta-primary ui-cta-block">
          Войти
        </Link>
      ) : null}

      {isAuthenticated && menuLinks.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {menuLinks.map((item) => {
            const hasNew =
              item.label === "Уведомления"
                ? unreadNotifications > 0
                : item.label === "Мои споры"
                  ? unreadDisputes > 0
                  : false

            return (
              <li key={item.to}>
                <Link to={item.to} className="ui-menu-link">
                  <item.icon size={20} className="text-sky-600 dark:text-sky-400" />
                  <span className="flex-1 text-sm font-medium leading-normal text-slate-900 dark:text-slate-100">
                    {item.label}
                  </span>
                  {hasNew ? (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"
                      aria-label="Есть новое"
                    />
                  ) : null}
                  <ChevronRight size={18} className="text-slate-400" />
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}

      {isAuthenticated ? (
        <Button variant="outline" fullWidth onClick={() => setLogoutOpen(true)}>
          <LogOut size={18} />
          Выйти
        </Button>
      ) : null}

      {logoutOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          onClick={() => setLogoutOpen(false)}
        >
          <Card
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="logout-dialog-title"
              className="text-lg font-bold text-slate-900 dark:text-slate-100"
            >
              Выйти из аккаунта?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Потребуется снова войти по телефону или email.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setLogoutOpen(false)}>
                Отмена
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  setLogoutOpen(false)
                  logout()
                }}
              >
                Выйти
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
