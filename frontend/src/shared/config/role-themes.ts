export type AppRole = "resident" | "driver" | "employee" | "admin"

export type RoleTheme = {
  id: AppRole
  label: string
  primary: string
  primaryDark: string
  primaryLight: string
  surface: string
  muted: string
  base: string
  darkBase: string
  ornamentLight: string
  ornamentDark: string
}

export const ROLE_THEMES: Record<AppRole, RoleTheme> = {
  resident: {
    id: "resident",
    label: "Житель",
    primary: "#0284c7",
    primaryDark: "#0369a1",
    primaryLight: "#e0f2fe",
    surface: "#ffffff",
    muted: "#f1f5f9",
    base: "#f8fafc",
    darkBase: "#0F141C",
    ornamentLight: "ornament-resident.svg",
    ornamentDark: "ornament-resident-dark.svg",
  },
  driver: {
    id: "driver",
    label: "Водитель",
    primary: "#0891b2",
    primaryDark: "#0e7490",
    primaryLight: "#ecfeff",
    surface: "#ffffff",
    muted: "#f0fdfa",
    base: "#f8fafc",
    darkBase: "#0F141C",
    ornamentLight: "ornament-driver.svg",
    ornamentDark: "ornament-driver-dark.svg",
  },
  employee: {
    id: "employee",
    label: "ПВЗ",
    primary: "#0d9488",
    primaryDark: "#0f766e",
    primaryLight: "#ccfbf1",
    surface: "#ffffff",
    muted: "#f0fdfa",
    base: "#f8fafc",
    darkBase: "#0F141C",
    ornamentLight: "ornament-employee.svg",
    ornamentDark: "ornament-employee-dark.svg",
  },
  admin: {
    id: "admin",
    label: "Админ",
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    primaryLight: "#dbeafe",
    surface: "#ffffff",
    muted: "#f1f5f9",
    base: "#f8fafc",
    darkBase: "#0F141C",
    ornamentLight: "ornament-resident.svg",
    ornamentDark: "ornament-resident-dark.svg",
  },
}
