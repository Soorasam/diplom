import { useMemo } from "react"

import { useAuthStore } from "@/app/model/auth-store"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import {
  getUserDeliveryLocationId,
  getUserDeliveryLocationIds,
} from "@/shared/lib/procurement-eligibility"

export const useUserDeliverySettlement = () => {
  const user = useAuthStore((s) => s.user)
  const { data: settlements } = useSettlements()

  const locationIds = useMemo(() => getUserDeliveryLocationIds(user), [user])
  const locationId = useMemo(() => getUserDeliveryLocationId(user), [user])

  const settlement = useMemo(
    () =>
      settlements?.find(
        (s) => locationIds.has(s.id.trim().toLowerCase()) || s.id === locationId,
      ),
    [settlements, locationIds, locationId],
  )

  return {
    user,
    locationId,
    locationIds,
    settlement,
    settlementName: settlement?.name,
  }
}
