import { Outlet } from "react-router-dom"

import { RouteEventLogger } from "@/app/providers/RouteEventLogger"

/** Обёртка для всех маршрутов — логирует навигацию в любой зоне приложения */
export const RootShell = () => (
  <>
    <RouteEventLogger />
    <Outlet />
  </>
)
