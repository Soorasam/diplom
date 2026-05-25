import { Outlet } from "react-router-dom"

import { RouteEventLogger } from "@/app/providers/RouteEventLogger"


export const RootShell = () => (
  <>
    <RouteEventLogger />
    <Outlet />
  </>
)
