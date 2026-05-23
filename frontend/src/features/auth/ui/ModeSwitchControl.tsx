import { Loader2, ShoppingBag, Truck } from "lucide-react"

import { cn } from "@/shared/lib/cn"

import { useCanUseDriverMode, type InterfaceMode } from "../hooks/useCanUseDriverMode"
import { useInterfaceModeSwitch } from "../hooks/useInterfaceModeSwitch"

type ModeSwitchControlProps = {
  className?: string
  navigateOnSwitch?: boolean
}

const modes: { id: InterfaceMode; label: string; icon: typeof Truck }[] = [
  { id: "resident", label: "Житель", icon: ShoppingBag },
  { id: "driver", label: "Водитель", icon: Truck },
]

/** Сегментированный переключатель житель / водитель (единые скругления) */
export const ModeSwitchControl = ({
  className,
  navigateOnSwitch = true,
}: ModeSwitchControlProps) => {
  const { activeMode } = useCanUseDriverMode()
  const { loading, error, setMode } = useInterfaceModeSwitch(navigateOnSwitch)

  return (
    <div className={cn("w-full", className)}>
      <div
        className="ui-segment-track"
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
              disabled={loading || selected}
              onClick={() => void setMode(mode.id)}
              className={cn(
                "ui-segment-btn",
                selected && "ui-segment-btn--active",
              )}
              aria-pressed={selected}
            >
              {loading && !selected ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Icon size={18} className={selected ? "text-sky-600 dark:text-cyan-300" : ""} />
              )}
              <span>{mode.label}</span>
            </button>
          )
        })}
      </div>
      {error ? (
        <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-center text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}
