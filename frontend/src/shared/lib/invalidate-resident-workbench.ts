import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { invalidateDriverWorkbench } from "./invalidate-driver-workbench"

/** Заказы, сборы и прогресс рейса у жителя */
export const invalidateResidentWorkbench = (
  qc: QueryClient,
  userId?: string,
  driverId?: string,
) => {
  void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
  void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
  void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
  void qc.invalidateQueries({ queryKey: queryKeys.cart })

  if (userId) {
    void qc.invalidateQueries({ queryKey: queryKeys.orders.list(userId) })
    void qc.invalidateQueries({
      queryKey: queryKeys.procurements.memberships(userId),
    })
  }

  if (driverId) {
    invalidateDriverWorkbench(qc, driverId)
  }
}
