import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import {
  useActiveProcurementsEnriched,
  useMyProcurementMemberships,
} from "@/entities/procurement/api/useProcurements"
import { procurementsApi } from "@/entities/procurement/api/procurementsApi"
import type { Order, Procurement } from "@/shared/api/api-types"
import { queryKeys } from "@/shared/config/query-keys"

const hasRelevantOrder = (orders: Order[], procurementId: string) =>
  orders.some(
    (o) => o.procurementId === procurementId && o.status !== "cancelled",
  )

export const useResidentJoinedProcurements = (userId?: string, orders?: Order[]) => {
  const { data: memberships = [], isLoading: loadingMemberships } =
    useMyProcurementMemberships(userId)
  const { data: openProcurements = [], isLoading: loadingOpen } =
    useActiveProcurementsEnriched()

  const openJoined = useMemo(
    () => openProcurements.filter((p) => memberships.includes(p.id)),
    [openProcurements, memberships],
  )

  const closedIdsToFetch = useMemo(() => {
    const openIds = new Set(openJoined.map((p) => p.id))
    const userOrders = orders ?? []
    return memberships.filter(
      (id) => !openIds.has(id) && hasRelevantOrder(userOrders, id),
    )
  }, [memberships, openJoined, orders])

  const closedQueries = useQueries({
    queries: closedIdsToFetch.map((id) => ({
      queryKey: [...queryKeys.procurements.all, id, "resident-home"],
      queryFn: () => procurementsApi.getById(id),
      staleTime: 30_000,
    })),
  })

  const closedJoined = useMemo(
    () =>
      closedQueries
        .map((q) => q.data)
        .filter((p): p is Procurement => Boolean(p)),
    [closedQueries],
  )

  const joinedProcurements = useMemo(() => {
    const byId = new Map<string, Procurement>()
    for (const p of openJoined) byId.set(p.id, p)
    for (const p of closedJoined) byId.set(p.id, p)
    return memberships
      .map((id) => byId.get(id))
      .filter((p): p is Procurement => Boolean(p))
  }, [openJoined, closedJoined, memberships])

  const isLoading =
    loadingMemberships ||
    loadingOpen ||
    closedQueries.some((q) => q.isLoading)

  return { joinedProcurements, isLoading }
}
