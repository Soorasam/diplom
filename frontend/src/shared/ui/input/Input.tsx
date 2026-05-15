import { forwardRef, type InputHTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <label className="block w-full">
      {label ? (
        <span className="mb-1.5 block text-xs font-medium text-slate-600">
          {label}
        </span>
      ) : null}

      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full min-h-11 rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900",
          "placeholder:text-slate-400 outline-none transition-colors",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          error ? "border-red-400" : "border-slate-200",
          className,
        )}
        {...props}
      />

      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  ),
)

Input.displayName = "Input"
