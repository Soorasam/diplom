import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { AuthResponse, BackendUser } from "@/shared/api/backend-types"
import type { User } from "@/shared/api/mock-db"
import { clearApiSession, http } from "@/shared/api/client"
import { clearTokens, saveTokens } from "@/shared/api/auth-storage"
import { mapUser } from "@/shared/api/mappers"
import { routes } from "@/shared/config/routes"
import { useCartStore } from "@/features/cart/model/cart-store"
import { logEvent } from "@/shared/lib/event-log"
import type { UserRole } from "@/shared/types"

export interface RegisterPayload {
  email: string
  password: string
  fullName?: string
  phone?: string
  settlementId?: string
  pickupPointId?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  
  _hasHydrated: boolean
  setHasHydrated: () => void
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  refreshUser: () => Promise<void>
  switchRole: (role: Extract<UserRole, "client" | "driver">) => Promise<void>
  logout: () => void
  updateSettlement: (settlementId: string) => Promise<void>
  updateProfile: (payload: { fullName?: string; phone?: string }) => Promise<void>
  setPassword: (payload: { newPassword: string; currentPassword?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: () => set({ _hasHydrated: true }),

      login: async (email, password) => {
        logEvent("auth:login:start", { email })
        const res = await http.post<AuthResponse>("/auth/login", {
          email: email.trim().toLowerCase(),
          password,
        })
        saveTokens(res.access_token, res.refresh_token)
        const user = mapUser(res.user)
        set({ user, isAuthenticated: true })
        logEvent("auth:login:ok", { userId: user.id, role: user.role })
      },

      register: async (payload) => {
        logEvent("auth:register:start", { email: payload.email })
        const res = await http.post<AuthResponse>("/auth/register", {
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          ...(payload.fullName ? { fullName: payload.fullName.trim() } : {}),
          ...(payload.phone ? { phone: payload.phone.trim() } : {}),
          ...(payload.settlementId ? { settlementId: payload.settlementId } : {}),
          ...(payload.pickupPointId ? { pickupPointId: payload.pickupPointId } : {}),
        })
        saveTokens(res.access_token, res.refresh_token)
        const user = mapUser(res.user)
        set({ user, isAuthenticated: true })
        logEvent("auth:register:ok", { userId: user.id, role: user.role })
      },

      refreshUser: async () => {
        const res = await http.get<BackendUser>("/auth/me", true)
        const user = mapUser(res)
        set({ user, isAuthenticated: true })
        logEvent("auth:refreshUser", { userId: user.id, role: user.role })
      },

      switchRole: async (role) => {
        const backendRole = role === "driver" ? "coordinator" : "resident"
        logEvent("auth:switchRole:start", { role })
        const res = await http.patch<BackendUser>("/profile/role", { role: backendRole }, true)
        const user = mapUser(res)
        set({ user })
        logEvent("auth:switchRole:ok", { role: user.role })
      },

      logout: () => {
        logEvent("auth:logout")
        clearTokens()
        clearApiSession()
        useCartStore.getState().reset()
        set({ user: null, isAuthenticated: false })
      },

      updateSettlement: async (settlementId) => {
        logEvent("auth:updateSettlement", { settlementId })
        const res = await http.patch<BackendUser>(
          "/profile",
          { settlementId },
          true,
        )
        const user = mapUser(res)
        set({ user })
      },

      updateProfile: async (payload) => {
        logEvent("auth:updateProfile")
        const res = await http.patch<BackendUser>("/profile", payload, true)
        const user = mapUser(res)
        set({ user })
      },

      setPassword: async (payload) => {
        logEvent("auth:setPassword")
        const res = await http.patch<BackendUser>("/profile/password", payload, true)
        const user = mapUser(res)
        set({ user })
      },
    }),
    {
      name: "coop-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated()
      },
    },
  ),
)


export const homeRouteForRole = (role: User["role"]) => {
  if (role === "driver") return routes.driver.root
  if (role === "employee") return routes.employee.root
  if (role === "admin") return routes.admin.root
  return routes.user.root
}
