import { useMemo } from "react"

import { useDriverActiveProcurement } from "@/entities/procurement/api/useProcurements"
import { useCountdownTo } from "@/shared/hooks/useCountdownTo"
import { isOpenCollectionRound } from "@/shared/lib/driver-round-workload"
import { getProcurementCloseDeadline } from "@/shared/lib/procurement-poll-interval"

/**
 * Активный сбор с учётом дедлайна closesAt на клиенте.
 * Если iOS не успел опросить API, скрываем плашку после истечения таймера.
 */
export const useDriverEffectiveActiveRound = (userId?: string) => {
  const query = useDriverActiveProcurement(userId)

  const deadline =
    query.data && isOpenCollectionRound(query.data)
      ? getProcurementCloseDeadline(query.data)
      : null

  const { isExpired } = useCountdownTo(deadline)

  const data = useMemo(() => {
    if (!query.data) return null
    if (isExpired && isOpenCollectionRound(query.data)) return null
    return query.data
  }, [query.data, isExpired])

  return { ...query, data }
}
