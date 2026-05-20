import { apiCall } from "@/shared/api/client"
import {
  driverApplications as seed,
  users,
  type DriverApplication,
  type User,
} from "@/shared/api/mock-db"
import type { DriverApplicationStatus } from "@/shared/types"

let store: DriverApplication[] = [...seed]

export type DriverApplicationWithUser = DriverApplication & {
  user: User | null
}

export const driverApplicationsApi = {
  getByUser: (userId: string) =>
    apiCall(() => store.find((a) => a.userId === userId) ?? null),

  list: (): Promise<DriverApplicationWithUser[]> =>
    apiCall(() =>
      store
        .slice()
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
        .map<DriverApplicationWithUser>((a) => ({
          ...a,
          user: users.find((u) => u.id === a.userId) ?? null,
        })),
    ),

  submitDraft: (payload: {
    userId: string
    vehicleSummary: string
  }) =>
    apiCall(() => {
      const existing = store.find((a) => a.userId === payload.userId)
      const now = new Date().toISOString()
      if (existing) {
        store = store.map((a) =>
          a.userId === payload.userId
            ? {
                ...a,
                status: "pending",
                submittedAt: now,
                reviewedAt: undefined,
                rejectionReason: undefined,
                vehicleSummary: payload.vehicleSummary,
              }
            : a,
        )
        return store.find((a) => a.userId === payload.userId)!
      }
      const next: DriverApplication = {
        id: `da-${Date.now()}`,
        userId: payload.userId,
        status: "pending",
        submittedAt: now,
        vehicleSummary: payload.vehicleSummary,
      }
      store = [next, ...store]
      return next
    }),

  setStatus: (id: string, status: DriverApplicationStatus, rejectionReason?: string) =>
    apiCall(() => {
      store = store.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              reviewedAt: new Date().toISOString(),
              rejectionReason: status === "rejected" ? rejectionReason : undefined,
            }
          : a,
      )
      return store.find((a) => a.id === id)!
    }),
}

