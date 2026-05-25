import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

import { logEvent } from "@/shared/lib/event-log"


export const RouteEventLogger = () => {
  const location = useLocation()
  const prev = useRef(location.pathname)

  useEffect(() => {
    logEvent("navigation", {
      ...(prev.current !== location.pathname ? { from: prev.current } : {}),
      to: location.pathname,
      search: location.search || undefined,
    })
    prev.current = location.pathname
  }, [location.pathname, location.search])

  return null
}
