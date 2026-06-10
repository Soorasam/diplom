import { useMemo } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "@/app/model/auth-store"
import { queryKeys } from "@/shared/config/query-keys"
import { refetchProcurementState } from "@/shared/lib/invalidate-procurement-state"
import { invalidateResidentWorkbench } from "@/shared/lib/invalidate-resident-workbench"
import type { UserRole } from "@/shared/types"

import { procurementsApi } from "./procurementsApi"

const procurementActorIds = (user: ReturnType<typeof useAuthStore.getState>["user"]) => ({
  driverId: user?.role === "driver" ? user.id : undefined,
  userId: user?.id,
})

export const useActiveProcurements = () =>
  useQuery({
    queryKey: queryKeys.procurements.active,
    queryFn: () => procurementsApi.getActive(),
    refetchInterval: (query) => {
      const list = query.state.data
      if (
        list?.some((p) => p.emergencyCloseAt || p.status === "closing")
      ) {
        return 3000
      }
      return false
    },
  })

/** Подгружает waypoints из деталки, если в списке их нет */
export const useActiveProcurementsEnriched = () => {
  const query = useActiveProcurements()
  const procurements = query.data

  const missingWaypointIds = useMemo(
    () =>
      (procurements ?? [])
        .filter((p) => !p.waypoints?.length)
        .map((p) => p.id),
    [procurements],
  )

  const detailQueries = useQueries({
    queries: missingWaypointIds.map((id) => ({
      queryKey: [...queryKeys.procurements.all, id, "waypoints"],
      queryFn: () => procurementsApi.getById(id),
      staleTime: 60_000,
    })),
  })

  const enrichedData = useMemo(() => {
    if (!procurements) return undefined
    const detailById = new Map(
      missingWaypointIds.map((id, index) => [id, detailQueries[index]?.data]),
    )
    return procurements.map((p) => {
      const detail = detailById.get(p.id)
      if (detail?.waypoints?.length) {
        return { ...p, waypoints: detail.waypoints }
      }
      return p
    })
  }, [procurements, missingWaypointIds, detailQueries])

  return { ...query, data: enrichedData }
}

export const useDriverActiveProcurement = (userId?: string) =>
  useQuery({
    queryKey: ["driver", "active-procurement", userId ?? "anon"],
    queryFn: () => procurementsApi.getDriverActive(),
    enabled: Boolean(userId),
    refetchInterval: (query) => {
      const p = query.state.data
      if (p?.emergencyCloseAt || p?.status === "closing") return 3000
      return false
    },
  })

export const useDriverDeliveryProcurement = (userId?: string) =>
  useQuery({
    queryKey: ["driver", "delivery-procurement", userId ?? "anon"],
    queryFn: () => procurementsApi.getDriverDelivery(),
    enabled: Boolean(userId),
    refetchInterval: 10000,
  })

export const useProcurement = (id: string) =>
  useQuery({
    queryKey: [...queryKeys.procurements.all, id],
    queryFn: () => procurementsApi.getById(id),
    enabled: Boolean(id),
  })

export const useAllProcurements = () =>
  useQuery({
    queryKey: queryKeys.procurements.all,
    queryFn: () => procurementsApi.getAll(),
  })

export const useCreateProcurement = () => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: procurementsApi.create,
    onSuccess: () => {
      void refetchProcurementState(qc, procurementActorIds(user))
    },
  })
}

export const useScheduleEmergencyClose = () => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: (id: string) => procurementsApi.scheduleEmergencyClose(id),
    onSuccess: () => refetchProcurementState(qc, procurementActorIds(user)),
  })
}

export const useCloseProcurement = (actorRole: UserRole) => {
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: (id: string) => procurementsApi.close(id, actorRole),
    onSuccess: () => refetchProcurementState(qc, procurementActorIds(user)),
  })
}

export const useMyProcurementMemberships = (userId?: string) =>
  useQuery({
    queryKey: queryKeys.procurements.memberships(userId),
    queryFn: () => procurementsApi.getMemberships(userId!),
    enabled: Boolean(userId),
  })

export const useJoinProcurement = (userId?: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (procurementId: string) => {
      if (!userId) throw new Error("Требуется авторизация")
      return procurementsApi.join(userId, procurementId)
    },
    onSuccess: () => {
      invalidateResidentWorkbench(qc, userId)
    },
  })
}

export const useLeaveProcurement = (userId?: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (procurementId: string) => {
      if (!userId) throw new Error("Требуется авторизация")
      return procurementsApi.leave(userId, procurementId)
    },
    onSuccess: () => {
      invalidateResidentWorkbench(qc, userId)
    },
  })
}
