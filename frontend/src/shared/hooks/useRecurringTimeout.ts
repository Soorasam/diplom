import { useEffect, useRef } from "react"

/** setTimeout-цепочка вместо setInterval — надёжнее в iOS PWA */
export const useRecurringTimeout = (
  callback: () => void,
  intervalMs: number,
  enabled = true,
) => {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return

    let cancelled = false
    let timeoutId = 0

    const tick = () => {
      if (cancelled) return
      if (document.visibilityState === "visible") {
        callbackRef.current()
      }
      timeoutId = window.setTimeout(tick, intervalMs)
    }

    timeoutId = window.setTimeout(tick, intervalMs)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [intervalMs, enabled])
}
