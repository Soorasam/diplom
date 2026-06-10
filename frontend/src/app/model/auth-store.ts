import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { AuthResponse, BackendUser } from "@/shared/api/backend-types"
import type { User } from "@/shared/api/api-types"
import { clearApiSession, http, resetAuthSession } from "@/shared/api/client"
import { clearTokens, saveTokens } from "@/shared/api/auth-storage"
import { mapUser } from "@/shared/api/mappers"
import { routes } from "@/shared/config/routes"
import { useCartStore } from "@/features/cart/model/cart-store"
import { useOfflineQueueStore } from "@/features/offline/model/offline-queue-store"
import { useDriverApplicationDraftStore } from "@/features/driver-application/model/driver-application-draft-store"
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
  updateProfile: (payload: {
    fullName?: string
    phone?: string
    deliveryAddress?: string
  }) => Promise<void>
  setPassword: (payload: { newPassword: string; currentPassword?: string }) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: () => set({ _hasHydrated: true }),

      login: async (email, password) => {
        const res = await http.post<AuthResponse>("/auth/login", {
          email: email.trim().toLowerCase(),
          password,
        })
        saveTokens(res.access_token, res.refresh_token)
        resetAuthSession()
        const user = mapUser(res.user)
        const prevUserId = get().user?.id
        if (prevUserId && prevUserId !== user.id) {
          useCartStore.getState().reset()
          useOfflineQueueStore.getState().reset()
          useDriverApplicationDraftStore.getState().clear()
        }
        set({ user, isAuthenticated: true })
      },

      register: async (payload) => {
        const res = await http.post<AuthResponse>("/auth/register", {
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          ...(payload.fullName ? { fullName: payload.fullName.trim() } : {}),
          ...(payload.phone ? { phone: payload.phone.trim() } : {}),
          ...(payload.settlementId ? { settlementId: payload.settlementId } : {}),
          ...(payload.pickupPointId ? { pickupPointId: payload.pickupPointId } : {}),
        })
        saveTokens(res.access_token, res.refresh_token)
        resetAuthSession()
        const user = mapUser(res.user)
        const prevUserId = get().user?.id
        if (prevUserId && prevUserId !== user.id) {
          useCartStore.getState().reset()
          useOfflineQueueStore.getState().reset()
          useDriverApplicationDraftStore.getState().clear()
        }
        set({ user, isAuthenticated: true })
      },

      refreshUser: async () => {
        const res = await http.get<BackendUser>("/auth/me", true)
        const user = mapUser(res)
        const prevUserId = get().user?.id
        if (prevUserId && prevUserId !== user.id) {
          useCartStore.getState().reset()
          useOfflineQueueStore.getState().reset()
          useDriverApplicationDraftStore.getState().clear()
        }
        set({ user, isAuthenticated: true })
      },

      switchRole: async (role) => {
        const backendRole = role === "driver" ? "coordinator" : "resident"
        const res = await http.patch<BackendUser>("/profile/role", { role: backendRole }, true)
        const user = mapUser(res)
        set({ user })
      },

      logout: () => {
        clearTokens()
        clearApiSession()
        useCartStore.getState().reset()
        useOfflineQueueStore.getState().reset()
        useDriverApplicationDraftStore.getState().clear()
        set({ user: null, isAuthenticated: false })
      },

      updateSettlement: async (settlementId) => {
        const prevLocationId =
          get().user?.pickupPointId ?? get().user?.settlementId
        const res = await http.patch<BackendUser>(
          "/profile",
          { settlementId, pickupPointId: settlementId },
          true,
        )
        const user = mapUser(res)
        if (prevLocationId && prevLocationId !== settlementId) {
          useCartStore.getState().clearProcurement()
        }
        set({ user })
      },

      updateProfile: async (payload) => {
        const res = await http.patch<BackendUser>("/profile", payload, true)
        const user = mapUser(res)
        set({ user })
      },

      setPassword: async (payload) => {
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
  if (role === "admin") return routes.admin.root
  return routes.user.root
}
