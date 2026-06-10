import { useEffect } from "react"

/** Рефреш при возврате в PWA: visibility, focus и pageshow (важно для iOS) */
export const usePwaResumeRefetch = (refetch: () => void) => {
  useEffect(() => {
    const run = () => refetch()

    const onVisibility = () => {
      if (document.visibilityState === "visible") run()
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted || document.visibilityState === "visible") run()
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", run)
    window.addEventListener("pageshow", onPageShow)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", run)
      window.removeEventListener("pageshow", onPageShow)
    }
  }, [refetch])
}
