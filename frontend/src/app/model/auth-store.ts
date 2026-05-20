import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { User } from "@/shared/api/mock-db"
import { users } from "@/shared/api/mock-db"
import type { UserRole } from "@/shared/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loginByEmail: (email: string, role?: UserRole) => Promise<void>
  logout: () => void
  setSettlement: (settlementId: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      loginByEmail: async (email, role = "client") => {
        await new Promise((r) => setTimeout(r, 500))
        const normalized = email.trim().toLowerCase()
        const found =
          users.find(
            (u) =>
              (u.email?.toLowerCase() ?? "") === normalized &&
              (role ? u.role === role : true),
          ) ?? users.find((u) => u.role === role)!

        set({ user: found, isAuthenticated: true })
      },

      logout: () => set({ user: null, isAuthenticated: false }),

      setSettlement: (settlementId) =>
        set((s) =>
          s.user ? { user: { ...s.user, settlementId } } : s,
        ),
    }),
    { name: "coop-auth" },
  ),
)
