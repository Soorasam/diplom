import { Minus, Plus } from "lucide-react"



import { cn } from "@/shared/lib/cn"



interface QuantityStepperProps {

  quantity: number

  onDecrease: () => void

  onIncrease: () => void

  size?: "sm" | "md"

  className?: string

}



export const QuantityStepper = ({

  quantity,

  onDecrease,

  onIncrease,

  size = "md",

  className,

}: QuantityStepperProps) => (

  <div

    className={cn(

      "flex w-[7.25rem] shrink-0 items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800",

      className,

    )}

  >

    <button

      type="button"

      onClick={onDecrease}

      className={cn(

        "flex items-center justify-center rounded-lg text-sky-700 transition-colors hover:bg-white active:scale-95 dark:text-sky-400 dark:hover:bg-slate-700",

        size === "sm" ? "h-8 w-8" : "h-9 w-9",

      )}

      aria-label="Уменьшить"

    >

      <Minus size={size === "sm" ? 14 : 16} />

    </button>

    <span

      className={cn(

        "w-8 shrink-0 text-center font-bold tabular-nums text-slate-900 dark:text-slate-100",

        size === "sm" ? "text-xs" : "text-sm",

      )}

    >

      {quantity}

    </span>

    <button

      type="button"

      onClick={onIncrease}

      className={cn(

        "flex items-center justify-center rounded-lg text-sky-700 transition-colors hover:bg-white active:scale-95 dark:text-sky-400 dark:hover:bg-slate-700",

        size === "sm" ? "h-8 w-8" : "h-9 w-9",

      )}

      aria-label="Увеличить"

    >

      <Plus size={size === "sm" ? 14 : 16} />

    </button>

  </div>

)

