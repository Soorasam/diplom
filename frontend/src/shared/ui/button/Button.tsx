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
    "border border-sky-600/30 text-white active:scale-[0.99] transition-all duration-200 [background:linear-gradient(135deg,rgb(3_105_161),rgb(8_145_178))] hover:[background:linear-gradient(135deg,rgb(7_89_133),rgb(14_116_144))] dark:border-cyan-500/20 dark:[background:linear-gradient(135deg,rgb(14_165_233),rgb(34_211_238))]",

  secondary:

    "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 transition-colors duration-200",

  ghost:

    "text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:active:bg-slate-700 transition-colors duration-200",

  danger: "bg-red-600 text-white hover:bg-red-700 transition-colors",

  outline:

    "border border-slate-200 bg-white text-sky-700 hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-slate-800 transition-colors duration-200",

}



const sizes: Record<Size, string> = {

  sm: "min-h-9 px-3 text-sm rounded-2xl",

  md: "min-h-11 px-4 text-sm rounded-2xl",

  lg: "min-h-11 px-5 text-sm rounded-2xl",

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

        "inline-flex items-center justify-center gap-2 font-semibold leading-normal",

        "disabled:pointer-events-none disabled:opacity-45",

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

