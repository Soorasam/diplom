import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/shared/lib/cn"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: "none" | "sm" | "md"
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-4",
}

export const Card = ({
  children,
  className,
  padding = "md",
  ...props
}: CardProps) => (
  <div
    className={cn(
      "ui-card",
      paddingMap[padding],
      className,
    )}
    {...props}
  >
    {children}
  </div>
)
