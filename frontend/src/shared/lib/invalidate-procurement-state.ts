import type { QueryClient } from "@tanstack/react-query"

import { ordersApi } from "@/entities/order/api/ordersApi"
import { procurementsApi } from "@/entities/procurement/api/procurementsApi"
import { routesApi } from "@/entities/route/api/routesApi"
import { queryKeys } from "@/shared/config/query-keys"

import { invalidateDriverWorkbench } from "./invalidate-driver-workbench"

const forceFetchOpts = { staleTime: 0 }

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

  const fetches: Promise<unknown>[] = [
    qc.fetchQuery({
      queryKey: queryKeys.procurements.active,
      queryFn: () => procurementsApi.getActive(),
      ...forceFetchOpts,
    }),
    qc.fetchQuery({
      queryKey: queryKeys.procurements.all,
      queryFn: () => procurementsApi.getAll(),
      ...forceFetchOpts,
    }),
    qc.fetchQuery({
      queryKey: ["driver", "active-procurement", opts?.userId ?? "anon"],
      queryFn: () => procurementsApi.getDriverActive(),
      ...forceFetchOpts,
    }),
    qc.fetchQuery({
      queryKey: ["driver", "delivery-procurement", opts?.userId ?? "anon"],
      queryFn: () => procurementsApi.getDriverDelivery(),
      ...forceFetchOpts,
    }),
  ]

  if (opts?.driverId) {
    fetches.push(
      qc.fetchQuery({
        queryKey: queryKeys.routes.driver(opts.driverId),
        queryFn: () => routesApi.getByDriver(opts.driverId!),
        ...forceFetchOpts,
      }),
      qc.fetchQuery({
        queryKey: [...queryKeys.routes.driver(opts.driverId), "orders"],
        queryFn: () => routesApi.getDriverOrders(opts.driverId!),
        ...forceFetchOpts,
      }),
    )
  }

  if (opts?.userId) {
    fetches.push(
      qc.fetchQuery({
        queryKey: queryKeys.orders.list(opts.userId),
        queryFn: () => ordersApi.getByUser(opts.userId!),
        ...forceFetchOpts,
      }),
    )
  }

  await Promise.all([
    ...fetches,
    qc.refetchQueries({ queryKey: queryKeys.procurements.active, ...refetchOpts }),
    qc.refetchQueries({ queryKey: queryKeys.procurements.all, ...refetchOpts }),
    qc.refetchQueries({ queryKey: ["driver", "active-procurement"], ...refetchOpts }),
    qc.refetchQueries({ queryKey: ["driver", "delivery-procurement"], ...refetchOpts }),
  ])
}
