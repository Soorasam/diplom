import { Truck } from "lucide-react"

import { cn } from "@/shared/lib/cn"

import { useCanUseDriverMode } from "../hooks/useCanUseDriverMode"
import { ModeSwitchControl } from "./ModeSwitchControl"

type Props = {
  className?: string
  navigateOnSwitch?: boolean
  /** Только переключатель без описания */
  compact?: boolean
}

export const InterfaceModeSwitch = ({
  className,
  navigateOnSwitch = true,
  compact = false,
}: Props) => {
  const { canUseDriverMode, isLoading: checkingRights } = useCanUseDriverMode()

  if (!canUseDriverMode || checkingRights) return null

  if (compact) {
    return (
      <ModeSwitchControl
        className={className}
        navigateOnSwitch={navigateOnSwitch}
      />
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-sky-50/40 to-slate-50 p-4 dark:border-slate-800 dark:from-[#18202C] dark:via-sky-950/20 dark:to-slate-900",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="ui-icon-well flex h-11 w-11 shrink-0">
          <Truck size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-normal text-slate-900 dark:text-slate-100">
            Два режима в одном аккаунте
          </p>
          <p className="mt-2 text-sm font-normal leading-relaxed text-slate-500 dark:text-slate-400">
            Заказы и сборы доступны всегда. Режим водителя добавляет маршруты и логистику.
          </p>
        </div>
      </div>

      <ModeSwitchControl
        className="mt-4"
        navigateOnSwitch={navigateOnSwitch}
      />
    </div>
  )
}

/** @deprecated используйте InterfaceModeSwitch */
export const DriverRoleSwitch = InterfaceModeSwitch
