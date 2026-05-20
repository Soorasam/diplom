import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { AuthResponse } from "@/shared/api/backend-types"
import type { User } from "@/shared/api/mock-db"
import { clearApiSession, http } from "@/shared/api/client"
import { clearTokens, saveTokens } from "@/shared/api/auth-storage"
import { mapUser } from "@/shared/api/mappers"
import { routes } from "@/shared/config/routes"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setSettlement: (settlementId: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const res = await http.post<AuthResponse>("/auth/login", {
          email: email.trim().toLowerCase(),
          password,
        })
        saveTokens(res.access_token, res.refresh_token)
        const user = mapUser(res.user)
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        clearTokens()
        clearApiSession()
        set({ user: null, isAuthenticated: false })
      },

      setSettlement: (settlementId) =>
        set((s) =>
          s.user ? { user: { ...s.user, settlementId } } : s,
        ),
    }),
    { name: "coop-auth" },
  ),
)

/** Куда редиректить после входа по роли с бэкенда */
export const homeRouteForRole = (role: User["role"]) => {
  if (role === "driver") return routes.driver.root
  if (role === "admin") return routes.admin.root
  return routes.home
}
