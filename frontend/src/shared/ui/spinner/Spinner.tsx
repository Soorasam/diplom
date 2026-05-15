import { cn } from "@/shared/lib/cn"

export const Spinner = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent",
      className,
    )}
    role="status"
    aria-label="Загрузка"
  />
)
