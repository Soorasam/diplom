import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/shared/config/query-keys"

export const invalidateDriverWorkbench = (
  qc: QueryClient,
  driverId?: string,
) => {
  if (driverId) {
    void qc.invalidateQueries({ queryKey: queryKeys.routes.driver(driverId) })
  } else {
    void qc.invalidateQueries({ queryKey: ["routes", "driver"] })
  }
  void qc.invalidateQueries({ queryKey: ["driver", "procurement-checklist"] })
  void qc.invalidateQueries({ queryKey: ["driver", "active-procurement"] })
  void qc.invalidateQueries({ queryKey: ["driver", "delivery-procurement"] })
}
