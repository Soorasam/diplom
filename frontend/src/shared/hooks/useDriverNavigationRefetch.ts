import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

import { useProcurementCloseRefresh } from "@/shared/hooks/useProcurementCloseRefresh"

/** Рефреш при переключении вкладок нижней навигации */
export const useDriverNavigationRefetch = () => {
  const location = useLocation()
  const refresh = useProcurementCloseRefresh()
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname
    void refresh()
  }, [location.pathname, refresh])
}
