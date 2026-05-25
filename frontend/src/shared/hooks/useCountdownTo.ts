import { useEffect, useState } from "react"

import { getRemainingMs } from "@/shared/lib/countdown"

export const useCountdownTo = (targetIso: string | null | undefined) => {
  const [remainingMs, setRemainingMs] = useState<number | null>(() =>
    getRemainingMs(targetIso),
  )

  useEffect(() => {
    const tick = () => setRemainingMs(getRemainingMs(targetIso))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetIso])

  return {
    remainingMs,
    isActive: remainingMs != null && remainingMs > 0,
    isExpired: remainingMs != null && remainingMs <= 0,
  }
}
