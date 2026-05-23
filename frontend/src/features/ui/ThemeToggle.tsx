import { useSyncExternalStore } from "react"
import { Moon, Sun } from "lucide-react"

import { useUiStore } from "@/features/ui/model/ui-store"
import { cn } from "@/shared/lib/cn"

function subscribeSystemTheme(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

type ThemeToggleProps = {
  className?: string
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const systemDark = useSyncExternalStore(
    subscribeSystemTheme,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  )
  const isDark = theme === "dark" || (theme === "system" && systemDark)

  const toggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sky-700 transition-colors hover:border-sky-200 hover:bg-sky-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-cyan-300 dark:hover:border-slate-600 dark:hover:bg-slate-800",
        className,
      )}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
    </button>
  )
}
