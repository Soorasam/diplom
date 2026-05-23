import { cn } from "@/shared/lib/cn"

export const Spinner = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-400",
      className,
    )}
    role="status"
    aria-label="Загрузка"
  />
)
