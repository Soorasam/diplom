import type { ReactNode } from "react"
import { forwardRef, type ButtonHTMLAttributes } from "react"

import { cn } from "@/shared/lib/cn"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline"
type Size = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:bg-blue-800",
  secondary:
    "bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
  outline:
    "border border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50",
}

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm rounded-lg",
  md: "min-h-11 px-4 text-sm rounded-xl",
  lg: "min-h-12 px-5 text-base rounded-xl",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        "touch-manipulation select-none",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : leftIcon ? (
        <span className="-ml-0.5">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon ? <span className="-mr-0.5">{rightIcon}</span> : null}
    </button>
  ),
)

Button.displayName = "Button"
