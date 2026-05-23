import type { CSSProperties, ReactNode } from "react"
import { useSyncExternalStore } from "react"

import { cn } from "@/shared/lib/cn"
import { useRoleTheme } from "@/shared/ui/role-theme/RoleThemeProvider"

const ornamentImports = import.meta.glob<string>(
  "../../assets/ornament-*.svg",
  { eager: true, import: "default" },
)

function ornamentUrl(filename: string) {
  const key = Object.keys(ornamentImports).find((k) => k.endsWith(filename))
  return key ? ornamentImports[key] : ""
}

function subscribeDark(cb: () => void) {
  const el = document.documentElement
  const obs = new MutationObserver(cb)
  obs.observe(el, { attributes: true, attributeFilter: ["class"] })
  return () => obs.disconnect()
}

function getDark() {
  return document.documentElement.classList.contains("dark")
}

type OrnamentBgProps = {
  children: ReactNode
  className?: string
}

export const OrnamentBg = ({ children, className }: OrnamentBgProps) => {
  const theme = useRoleTheme()
  const dark = useSyncExternalStore(subscribeDark, getDark, () => false)

  const file = dark ? theme.ornamentDark : theme.ornamentLight
  const url = ornamentUrl(file)

  const patternStyle: CSSProperties | undefined = url
    ? {
        backgroundImage: `url("${url}")`,
        backgroundSize: "96px 96px",
        backgroundRepeat: "repeat",
      }
    : undefined

  return (
    <div
      className={cn("relative min-h-full", className)}
      style={{ backgroundColor: dark ? theme.darkBase : theme.base }}
    >
      {patternStyle ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] dark:opacity-[0.06]"
          style={patternStyle}
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1] min-h-full">{children}</div>
    </div>
  )
}
