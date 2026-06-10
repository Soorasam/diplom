import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

import { invalidateDriverWorkbench } from "./invalidate-driver-workbench"

type Options = {
  driverId?: string
  userId?: string
}

/** Смена статуса сбора: закрытие, экстренное закрытие, переход в рейс */
const invalidateOpts = { refetchType: "all" as const }

export const invalidateProcurementState = (
  qc: QueryClient,
  opts?: Options,
) => {
  void qc.invalidateQueries({ queryKey: queryKeys.procurements.all, ...invalidateOpts })
  void qc.invalidateQueries({ queryKey: queryKeys.procurements.active, ...invalidateOpts })
  void qc.invalidateQueries({ queryKey: queryKeys.orders.all, ...invalidateOpts })
  invalidateDriverWorkbench(qc, opts?.driverId)

  if (opts?.userId) {
    void qc.invalidateQueries({
      queryKey: queryKeys.procurements.memberships(opts.userId),
      ...invalidateOpts,
    })
    void qc.invalidateQueries({
      queryKey: queryKeys.orders.list(opts.userId),
      ...invalidateOpts,
    })
  }
}

export const refetchProcurementState = async (
  qc: QueryClient,
  opts?: Options,
) => {
  invalidateProcurementState(qc, opts)
  const refetchOpts = { type: "all" as const }
  await Promise.all([
    qc.refetchQueries({ queryKey: queryKeys.procurements.active, ...refetchOpts }),
    qc.refetchQueries({ queryKey: queryKeys.procurements.all, ...refetchOpts }),
    qc.refetchQueries({ queryKey: ["driver", "active-procurement"], ...refetchOpts }),
    qc.refetchQueries({ queryKey: ["driver", "delivery-procurement"], ...refetchOpts }),
    opts?.driverId
      ? qc.refetchQueries({
          queryKey: queryKeys.routes.driver(opts.driverId),
          ...refetchOpts,
        })
      : Promise.resolve(),
    opts?.driverId
      ? qc.refetchQueries({
          queryKey: [...queryKeys.routes.driver(opts.driverId), "orders"],
          ...refetchOpts,
        })
      : Promise.resolve(),
    opts?.userId
      ? qc.refetchQueries({
          queryKey: queryKeys.orders.list(opts.userId),
          ...refetchOpts,
        })
      : Promise.resolve(),
  ])
}
