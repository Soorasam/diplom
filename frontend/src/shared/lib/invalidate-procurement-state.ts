import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { invalidateDriverWorkbench } from "./invalidate-driver-workbench"

type Options = {
  driverId?: string
  userId?: string
}

/** Смена статуса сбора: закрытие, экстренное закрытие, переход в рейс */
export const invalidateProcurementState = (
  qc: QueryClient,
  opts?: Options,
) => {
  void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
  void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
  void qc.invalidateQueries({ queryKey: queryKeys.orders.all })
  invalidateDriverWorkbench(qc, opts?.driverId)

  if (opts?.userId) {
    void qc.invalidateQueries({
      queryKey: queryKeys.procurements.memberships(opts.userId),
    })
    void qc.invalidateQueries({ queryKey: queryKeys.orders.list(opts.userId) })
  }
}

export const refetchProcurementState = async (
  qc: QueryClient,
  opts?: Options,
) => {
  invalidateProcurementState(qc, opts)
  await Promise.all([
    qc.refetchQueries({ queryKey: queryKeys.procurements.active }),
    qc.refetchQueries({ queryKey: ["driver", "active-procurement"] }),
    qc.refetchQueries({ queryKey: ["driver", "delivery-procurement"] }),
    opts?.driverId
      ? qc.refetchQueries({ queryKey: queryKeys.routes.driver(opts.driverId) })
      : Promise.resolve(),
    opts?.userId
      ? qc.refetchQueries({ queryKey: queryKeys.orders.list(opts.userId) })
      : Promise.resolve(),
  ])
}
