import { useEffect } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import {
  useActiveProcurementsEnriched,
  useMyProcurementMemberships,
} from "@/entities/procurement/api/useProcurements"
import { useCartStore } from "@/features/cart/model/cart-store"
import { useUserDeliverySettlement } from "@/shared/hooks/useUserDeliverySettlement"
import { isProcurementEligibleForUser } from "@/shared/lib/procurement-eligibility"


export const useSyncSelectedProcurement = (roundFromUrl?: string) => {
  const user = useAuthStore((s) => s.user)
  const { settlementName } = useUserDeliverySettlement()
  const procurementId = useCartStore((s) => s.procurementId)
  const setProcurement = useCartStore((s) => s.setProcurement)
  const clearProcurement = useCartStore((s) => s.clearProcurement)

  const { data: memberships = [] } = useMyProcurementMemberships(user?.id)
  const { data: openProcurements } = useActiveProcurementsEnriched()

  useEffect(() => {
    const eligibleOpen = (openProcurements ?? []).filter((p) =>
      isProcurementEligibleForUser(p, user, settlementName),
    )
    const eligibleIds = new Set(eligibleOpen.map((p) => p.id))

    if (roundFromUrl) {
      if (eligibleIds.has(roundFromUrl)) {
        setProcurement(roundFromUrl)
      } else {
        clearProcurement()
      }
      return
    }

    if (procurementId && !eligibleIds.has(procurementId)) {
      clearProcurement()
      return
    }

    if (procurementId) return

    const joinedOpen = eligibleOpen.filter((p) => memberships.includes(p.id))
    if (joinedOpen.length === 0) return

    const preferred =
      joinedOpen.find((p) => p.id === memberships[0]) ?? joinedOpen[0]
    setProcurement(preferred.id)
  }, [
    roundFromUrl,
    procurementId,
    memberships,
    openProcurements,
    user,
    settlementName,
    setProcurement,
    clearProcurement,
  ])
}
