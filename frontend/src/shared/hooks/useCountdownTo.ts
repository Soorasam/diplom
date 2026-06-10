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
    const onVisible = () => {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [targetIso])

  return {
    remainingMs,
    isActive: remainingMs != null && remainingMs > 0,
    isExpired: remainingMs != null && remainingMs <= 0,
  }
}
