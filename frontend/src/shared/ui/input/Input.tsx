import type { ReactNode } from "react"
import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, leftIcon, rightIcon, ...props }, ref) => (
    <label className="block w-full">
      {label ? (
        <span className="mb-2 block text-xs font-medium leading-normal text-slate-500 dark:text-slate-400">
          {label}
        </span>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full min-h-11 rounded-2xl border bg-white px-3 py-2.5 text-sm font-normal leading-normal text-slate-900",
            "placeholder:text-slate-400 outline-none transition-colors duration-200",
            "focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20",
            "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400 dark:focus:ring-sky-400/20",
            leftIcon ? "pl-10" : "pl-3",
            rightIcon ? "pr-10" : "pr-3",
            error ? "border-red-400" : "border-slate-200 dark:border-slate-700",
            className,
          )}
          {...props}
        />

        {rightIcon ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {error ? (
        <span className="mt-2 block text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
    </label>
  ),
)

Input.displayName = "Input"
