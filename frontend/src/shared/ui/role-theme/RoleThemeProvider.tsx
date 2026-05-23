import { createContext, useContext, type CSSProperties, type ReactNode } from "react"

import {
  ROLE_THEMES,
  type AppRole,
  type RoleTheme,
} from "@/shared/config/role-themes"

const RoleThemeContext = createContext<RoleTheme>(ROLE_THEMES.resident)

export const useRoleTheme = () => useContext(RoleThemeContext)

type RoleThemeProviderProps = {
  role: AppRole
  children: ReactNode
  className?: string
}

export const RoleThemeProvider = ({
  role,
  children,
  className,
}: RoleThemeProviderProps) => {
  const theme = ROLE_THEMES[role]

  const style = {
    "--role-primary": theme.primary,
    "--role-primary-dark": theme.primaryDark,
    "--role-primary-light": theme.primaryLight,
    "--role-surface": theme.surface,
    "--role-muted": theme.muted,
    "--role-base": theme.base,
  } as CSSProperties

  return (
    <RoleThemeContext.Provider value={theme}>
      <div data-role={role} className={className} style={style}>
        {children}
      </div>
    </RoleThemeContext.Provider>
  )
}
