import type { HTMLAttributes } from "react"



import { cn } from "@/shared/lib/cn"



type BadgeVariant = "default" | "success" | "warning" | "info" | "danger"



const variants: Record<BadgeVariant, string> = {

  default: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",

  success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",

  warning: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",

  info: "bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",

  danger: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",

}



interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {

  variant?: BadgeVariant

}



export const Badge = ({

  className,

  variant = "default",

  ...props

}: BadgeProps) => (

  <span

    className={cn(

      "inline-flex shrink-0 items-center whitespace-nowrap rounded-lg border px-2 py-0.5 text-xs font-medium leading-normal",

      variants[variant],

      className,

    )}

    {...props}

  />

)

