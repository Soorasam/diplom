import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { queryKeys } from "@/shared/config/query-keys"

import { driverApplicationsApi } from "./driverApplicationsApi"

export const driverAppKeys = {
  all: ["driver-applications"] as const,
  me: (userId: string) => ["driver-applications", "me", userId] as const,
  list: ["driver-applications", "list"] as const,
}

export function useMyDriverApplication() {
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: driverAppKeys.me(userId ?? ""),
    queryFn: () => driverApplicationsApi.getByUser(userId!),
    enabled: Boolean(userId),
  })
}

export function useAdminDriverApplications() {
  return useQuery({
    queryKey: driverAppKeys.list,
    queryFn: () => driverApplicationsApi.list(),
  })
}

export function useSubmitDriverApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: driverApplicationsApi.submitDraft,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: driverAppKeys.list })
      void qc.invalidateQueries({ queryKey: driverAppKeys.me(data.userId) })
      void qc.invalidateQueries({ queryKey: queryKeys.notifications(data.userId) })
    },
  })
}

export function useSetDriverApplicationStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; status: "approved" | "rejected"; reason?: string }) =>
      driverApplicationsApi.setStatus(vars.id, vars.status, vars.reason),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: driverAppKeys.list })
      void qc.invalidateQueries({ queryKey: driverAppKeys.me(data.userId) })
      void qc.invalidateQueries({ queryKey: queryKeys.notifications(data.userId) })
    },
  })
}

