import { useEffect, useMemo, useState } from "react"

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

import { ModeSwitchControl } from "@/features/auth/ui/ModeSwitchControl"
import { ThemeToggle } from "@/features/ui/ThemeToggle"

import { useMyDriverApplication } from "@/features/driver-application/api/useDriverApplications"
import { useSettlements } from "@/entities/settlement/api/useSettlements"

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
  const { data: settlements } = useSettlements()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const settlementName = useMemo(
    () => settlements?.find((s) => s.id === user?.settlementId)?.name,
    [settlements, user?.settlementId],
  )



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
              <p className="mt-0.5 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
                {settlementName ?? "Населённый пункт не выбран"}
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
              Не авторизован
            </p>
          )}

        </div>

        {isAuthenticated ? <ThemeToggle /> : null}

      </Card>

      {canUseDriverMode ? (
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



      {workspaceLink ? (

        <Link to={workspaceLink.to} className="ui-menu-link">

          <workspaceLink.icon size={20} className="text-sky-600 dark:text-sky-400" />

          <span className="flex-1 text-sm font-medium leading-normal text-slate-900 dark:text-slate-100">

            {workspaceLink.label}

          </span>

          <ChevronRight size={18} className="text-slate-400" />

        </Link>

      ) : null}



      {isSimpleResident ? (

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

                  : "Заполните заявку и загрузите документы"}

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



      {user?.role === "client" || user?.role === "driver" ? (

        <ul className="flex flex-col gap-2">

          {menuLinks.map((item) => (

            <li key={item.to}>

              <Link to={item.to} className="ui-menu-link">

                <item.icon size={20} className="text-sky-600 dark:text-sky-400" />

                <span className="flex-1 text-sm font-medium leading-normal text-slate-900 dark:text-slate-100">

                  {item.label}

                </span>

                <ChevronRight size={18} className="text-slate-400" />

              </Link>

            </li>

          ))}

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
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          onClick={() => setLogoutOpen(false)}
        >
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <p id="logout-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
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

