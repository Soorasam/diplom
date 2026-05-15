import { useEffect } from "react"

import { useUiStore } from "@/features/ui/model/ui-store"

export const useThemeEffect = () => {
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark =
      theme === "dark" || (theme === "system" && prefersDark)

    root.classList.toggle("dark", isDark)
  }, [theme])
}
