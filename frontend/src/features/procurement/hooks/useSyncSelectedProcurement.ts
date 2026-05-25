import { useEffect } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurements,
  useMyProcurementMemberships,
} from "@/entities/procurement/api/useProcurements"
import { useCartStore } from "@/features/cart/model/cart-store"


export const useSyncSelectedProcurement = (roundFromUrl?: string) => {
  const user = useAuthStore((s) => s.user)
  const procurementId = useCartStore((s) => s.procurementId)
  const setProcurement = useCartStore((s) => s.setProcurement)
  const clearProcurement = useCartStore((s) => s.clearProcurement)

  const { data: memberships = [] } = useMyProcurementMemberships(user?.id)
  const { data: openProcurements } = useActiveProcurements()

  useEffect(() => {
    const openIds = new Set((openProcurements ?? []).map((p) => p.id))

    if (roundFromUrl) {
      if (openIds.has(roundFromUrl)) {
        setProcurement(roundFromUrl)
      } else {
        clearProcurement()
      }
      return
    }

    if (procurementId && !openIds.has(procurementId)) {
      clearProcurement()
      return
    }

    if (procurementId) return

    const joinedOpen = (openProcurements ?? []).filter((p) =>
      memberships.includes(p.id),
    )
    if (joinedOpen.length === 0) return

    const preferred =
      joinedOpen.find((p) => p.id === memberships[0]) ?? joinedOpen[0]
    setProcurement(preferred.id)
  }, [
    roundFromUrl,
    procurementId,
    memberships,
    openProcurements,
    setProcurement,
    clearProcurement,
  ])
}
