import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftRight, Truck, User } from "lucide-react"

import { homeRouteForRole, useAuthStore } from "@/app/model/auth-store"
import { ApiError } from "@/shared/api/client"
import { routes } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { cn } from "@/shared/lib/cn"

type Props = {
  className?: string
  navigateOnSwitch?: boolean
}

function useRoleSwitch(navigateOnSwitch: boolean) {
  const navigate = useNavigate()
  const switchRole = useAuthStore((s) => s.switchRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = async (isDriver: boolean) => {
    setError(null)
    setLoading(true)
    try {
      const nextRole = isDriver ? "client" : "driver"
      await switchRole(nextRole)
      if (navigateOnSwitch) {
        navigate(homeRouteForRole(nextRole), { replace: true })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сменить роль")
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, toggle }
}

/** Компактная кнопка в шапке интерфейса водителя */
export const SwitchToResidentButton = ({ className }: { className?: string }) => {
  const user = useAuthStore((s) => s.user)
  const { loading, toggle } = useRoleSwitch(true)

  if (!user || user.role !== "driver") return null

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void toggle(true)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-60",
        className,
      )}
      title="Переключиться на режим жителя"
    >
      <User size={16} />
      {loading ? "…" : "Житель"}
    </button>
  )
}

export const DriverRoleSwitch = ({ className, navigateOnSwitch = false }: Props) => {
  const user = useAuthStore((s) => s.user)
  const { loading, error, toggle } = useRoleSwitch(navigateOnSwitch)

  if (!user) return null

  const isDriver = user.role === "driver"

  return (
    <Card className={cn("border-emerald-200 bg-emerald-50/40", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Режим интерфейса</p>
          <p className="mt-1 text-sm text-slate-600">
            Заявка одобрена. Переключайтесь между заказами жителя и работой водителя.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-700">
            {isDriver ? (
              <>
                <Truck size={14} className="text-emerald-700" />
                Сейчас: водитель
              </>
            ) : (
              <>
                <User size={14} className="text-blue-700" />
                Сейчас: житель
              </>
            )}
          </p>
        </div>
        <ArrowLeftRight className="shrink-0 text-emerald-700" size={22} />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          fullWidth
          loading={loading}
          onClick={() => void toggle(isDriver)}
          leftIcon={isDriver ? <User size={16} /> : <Truck size={16} />}
        >
          {isDriver ? "Переключиться на жителя" : "Переключиться на водителя"}
        </Button>

        {isDriver ? (
          <Link
            to={routes.driver.root}
            className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            Открыть интерфейс водителя
          </Link>
        ) : (
          <Link
            to={routes.home}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Вернуться к заказам
          </Link>
        )}
      </div>

      {error ? (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}
    </Card>
  )
}
