import { Loader2, ShoppingBag, Truck } from "lucide-react"

import { cn } from "@/shared/lib/cn"

import { useCanUseDriverMode, type InterfaceMode } from "../hooks/useCanUseDriverMode"
import { useInterfaceModeSwitch } from "../hooks/useInterfaceModeSwitch"

type Props = {
  className?: string
  navigateOnSwitch?: boolean
}

const modes: { id: InterfaceMode; label: string; icon: typeof Truck }[] = [
  { id: "resident", label: "Житель", icon: ShoppingBag },
  { id: "driver", label: "Водитель", icon: Truck },
]

export const InterfaceModeSwitch = ({
  className,
  navigateOnSwitch = true,
}: Props) => {
  const { canUseDriverMode, activeMode, isLoading: checkingRights } = useCanUseDriverMode()
  const { loading, error, setMode } = useInterfaceModeSwitch(navigateOnSwitch)

  if (!canUseDriverMode || checkingRights) return null

  const busy = loading

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/30 to-emerald-50/40 p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <Truck size={22} className="text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Два режима в одном аккаунте</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Вы остаётесь жителем: заказы и сборы доступны всегда. Режим водителя
            добавляет маршруты и логистику — переключайтесь здесь, в профиле.
          </p>
        </div>
      </div>

      <div
        className="relative mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100/90 p-1"
        role="group"
        aria-label="Режим интерфейса"
      >
        {modes.map((mode) => {
          const selected = activeMode === mode.id
          const Icon = mode.icon
          return (
            <button
              key={mode.id}
              type="button"
              disabled={busy || selected}
              onClick={() => void setMode(mode.id)}
              className={cn(
                "flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                selected
                  ? mode.id === "driver"
                    ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/80"
                    : "bg-white text-blue-800 shadow-sm ring-1 ring-blue-200/80"
                  : "text-slate-500 hover:text-slate-800",
                busy && !selected && "opacity-60",
              )}
              aria-pressed={selected}
            >
              {busy && !selected ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Icon
                  size={18}
                  className={
                    selected
                      ? mode.id === "driver"
                        ? "text-emerald-600"
                        : "text-blue-600"
                      : "text-slate-400"
                  }
                />
              )}
              <span>{mode.label}</span>
            </button>
          )
        })}
      </div>

      {error ? (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-center text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** @deprecated используйте InterfaceModeSwitch */
export const DriverRoleSwitch = InterfaceModeSwitch
