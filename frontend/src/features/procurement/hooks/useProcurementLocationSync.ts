import { useEffect, useRef } from "react"

import {
  useActiveProcurementsEnriched,
  useLeaveProcurement,
  useMyProcurementMemberships,
} from "@/entities/procurement/api/useProcurements"
import { useAuthStore } from "@/app/model/auth-store"
import { useCartStore } from "@/features/cart/model/cart-store"
import { useUserDeliverySettlement } from "@/shared/hooks/useUserDeliverySettlement"
import { isProcurementEligibleForUser } from "@/shared/lib/procurement-eligibility"

/** Сбрасывает сбор в корзине и выходит из него, если НП жителя не на маршруте. */
export const useProcurementLocationSync = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { user, settlementName, locationIds } = useUserDeliverySettlement()
  const procurementId = useCartStore((s) => s.procurementId)
  const clearProcurement = useCartStore((s) => s.clearProcurement)

  const { data: memberships = [] } = useMyProcurementMemberships(user?.id)
  const { data: openProcurements } = useActiveProcurementsEnriched()
  const leave = useLeaveProcurement(user?.id)
  const leaveRound = leave.mutateAsync

  const locationKey = [...locationIds].sort().join("|")
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !user || syncingRef.current) return
    if (!openProcurements) return

    const ineligibleIds = memberships.filter((roundId) => {
      const procurement = openProcurements.find((p) => p.id === roundId)
      if (!procurement) return false
      return !isProcurementEligibleForUser(procurement, user, settlementName)
    })

    const cartIneligible =
      Boolean(procurementId) &&
      !openProcurements.some(
        (p) =>
          p.id === procurementId &&
          isProcurementEligibleForUser(p, user, settlementName),
      )

    if (ineligibleIds.length === 0 && !cartIneligible) return

    syncingRef.current = true
    void (async () => {
      try {
        for (const roundId of ineligibleIds) {
          try {
            await leaveRound(roundId)
          } catch {
            /* заказ уже оформлен — выход запрещён, только убираем из корзины */
          }
        }
        if (cartIneligible || (procurementId && ineligibleIds.includes(procurementId))) {
          clearProcurement()
        }
      } finally {
        syncingRef.current = false
      }
    })()
  }, [
    isAuthenticated,
    user,
    settlementName,
    locationKey,
    memberships,
    openProcurements,
    procurementId,
    leaveRound,
    clearProcurement,
  ])
}