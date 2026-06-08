import type { Procurement, ProcurementWaypoint } from "@/shared/api/api-types"

export const buildProcurementRouteTitle = (
  waypoints?: ProcurementWaypoint[],
): string =>
  [...(waypoints ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((w) => w.settlementName ?? w.pickupPoint?.name)
    .filter(Boolean)
    .join(" → ")

export const resolveProcurementRouteTitle = (procurement: Procurement): string =>
  procurement.routeTitle?.trim() ||
  buildProcurementRouteTitle(procurement.waypoints) ||
  procurement.title
