import { Link } from "react-router-dom"
import { Check } from "lucide-react"

import { routes } from "@/shared/config/routes"
import { cn } from "@/shared/lib/cn"

export type CheckoutStepId = "cart" | "checkout" | "payment"

const STEPS: { id: CheckoutStepId; label: string; path: string }[] = [
  { id: "cart", label: "Корзина", path: routes.cart },
  { id: "checkout", label: "Оформление", path: routes.checkout },
  { id: "payment", label: "Оплата", path: routes.payment },
]

type CheckoutStepsProps = {
  current: CheckoutStepId
  className?: string
}

export const CheckoutSteps = ({ current, className }: CheckoutStepsProps) => {
  const currentIndex = STEPS.findIndex((s) => s.id === current)

  return (
    <nav
      className={cn("mx-auto w-full max-w-[300px]", className)}
      aria-label="Шаги оформления заказа"
    >
      <ol className="flex items-start justify-center">
        {STEPS.map((step, index) => {
          const done = index < currentIndex
          const active = step.id === current
          const upcoming = index > currentIndex

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-start">
              <div className="flex w-full flex-col items-center gap-1.5">
                {done ? (
                  <Link
                    to={step.path}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                    aria-label={`${step.label} — пройдено`}
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold tabular-nums",
                      active &&
                        "border-cyan-400/50 bg-gradient-to-br from-sky-500 to-cyan-500 text-white dark:border-cyan-400/40 dark:from-sky-400 dark:to-cyan-400",
                      upcoming &&
                        "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    {index + 1}
                  </span>
                )}
                <span
                  className={cn(
                    "w-full px-0.5 text-center text-[11px] font-semibold leading-tight",
                    active && "text-sky-700 dark:text-cyan-300",
                    done && "text-emerald-700 dark:text-emerald-400",
                    upcoming && "text-slate-400 dark:text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mt-[18px] h-0.5 min-w-[12px] flex-1 shrink-0 rounded-full",
                    index < currentIndex
                      ? "bg-emerald-400 dark:bg-emerald-600"
                      : "bg-slate-200 dark:bg-slate-700",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
