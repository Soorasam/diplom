import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

const invalidateOpts = { refetchType: "all" as const }

export const invalidateDriverWorkbench = (
  qc: QueryClient,
  driverId?: string,
) => {
  if (driverId) {
    void qc.invalidateQueries({
      queryKey: queryKeys.routes.driver(driverId),
      ...invalidateOpts,
    })
    void qc.invalidateQueries({
      queryKey: [...queryKeys.routes.driver(driverId), "orders"],
      ...invalidateOpts,
    })
  } else {
    void qc.invalidateQueries({ queryKey: ["routes", "driver"], ...invalidateOpts })
  }
  void qc.invalidateQueries({
    queryKey: ["driver", "procurement-checklist"],
    ...invalidateOpts,
  })
  void qc.invalidateQueries({
    queryKey: ["driver", "active-procurement"],
    ...invalidateOpts,
  })
  void qc.invalidateQueries({
    queryKey: ["driver", "delivery-procurement"],
    ...invalidateOpts,
  })
}
