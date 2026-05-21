import type { NavigateFunction } from "react-router-dom"

import { routes } from "@/shared/config/routes"

/** Выбор сбора → каталог (прогресс сбора растёт только после оплаты заказа) */
export const participateInProcurement = (
  navigate: NavigateFunction,
  setProcurement: (id: string) => void,
  procurementId: string,
) => {
  setProcurement(procurementId)
  navigate(`${routes.catalog}?round=${procurementId}`)
}
