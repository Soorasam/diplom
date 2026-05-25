import type { NavigateFunction } from "react-router-dom"

import { routes } from "@/shared/config/routes"


export const participateInProcurement = (
  navigate: NavigateFunction,
  setProcurement: (id: string) => void,
  procurementId: string,
) => {
  setProcurement(procurementId)
  navigate(`${routes.user.catalog}?round=${procurementId}`)
}
