import { Link } from "react-router-dom"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/shared/lib/cn"

type BackLinkProps = {
  to: string
  label?: string
  className?: string
}

export const BackLink = ({ to, label = "Назад", className }: BackLinkProps) => (
  <Link to={to} className={cn("back-link", className)}>
    <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
    <span>{label}</span>
  </Link>
)
