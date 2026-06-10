import { useEffect } from "react"

/** Подтягивает данные при возврате в PWA/вкладку (типичный сценарий на телефоне) */
export const useRefetchOnVisible = (refetch: () => void) => {
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [refetch])
}
