import { useMemo } from "react"
import { useLocation } from "react-router-dom"

import {
  profileRoutesFromPathname,
  type ProfileRouteSet,
} from "@/shared/lib/profile-routes"

export function useProfileRoutes(): ProfileRouteSet {
  const { pathname } = useLocation()
  return useMemo(() => profileRoutesFromPathname(pathname), [pathname])
}
