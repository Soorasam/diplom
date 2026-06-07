import { useMemo } from "react"
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"
import type { UserRole } from "@/shared/types"

import { procurementsApi } from "./procurementsApi"

export const useActiveProcurements = () =>
  useQuery({
    queryKey: queryKeys.procurements.active,
    queryFn: () => procurementsApi.getActive(),
    refetchInterval: (query) => {
      const list = query.state.data
      if (list?.some((p) => p.emergencyCloseAt)) return 5000
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
      if (p?.emergencyCloseAt) return 5000
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
  return useMutation({
    mutationFn: procurementsApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({ queryKey: ["driver", "active-procurement"] })
      void qc.invalidateQueries({ queryKey: ["driver", "delivery-procurement"] })
    },
  })
}

export const useScheduleEmergencyClose = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => procurementsApi.scheduleEmergencyClose(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({ queryKey: ["driver", "active-procurement"] })
      void qc.invalidateQueries({ queryKey: ["driver", "delivery-procurement"] })
      void qc.invalidateQueries({ queryKey: ["routes", "driver"] })
    },
  })
}

export const useCloseProcurement = (actorRole: UserRole) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => procurementsApi.close(id, actorRole),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({ queryKey: ["driver", "active-procurement"] })
      void qc.invalidateQueries({ queryKey: ["driver", "delivery-procurement"] })
      void qc.invalidateQueries({ queryKey: ["routes", "driver"] })
    },
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
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      if (userId) {
        void qc.invalidateQueries({
          queryKey: queryKeys.procurements.memberships(userId),
        })
      }
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
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
      if (userId) {
        void qc.invalidateQueries({
          queryKey: queryKeys.procurements.memberships(userId),
        })
      }
    },
  })
}

export const useProcurementReceiptApprovals = (procurementId?: string) =>
  useQuery({
    queryKey: ["procurements", "receipt-approvals", procurementId],
    queryFn: () => procurementsApi.getReceiptApprovals(procurementId!),
    enabled: Boolean(procurementId),
  })

export const useApproveProcurementReceipt = (actorRole: UserRole) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (procurementId: string) =>
      procurementsApi.approveReceipt(procurementId, actorRole),
    onSuccess: (_, procurementId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({
        queryKey: ["procurements", "receipt-approvals", procurementId],
      })
    },
  })
}
