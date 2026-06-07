import { http } from "@/shared/api/client"
import type { DeliveryMode } from "@/shared/types"

export type LocationCatalogItem = {
  id: string
  name: string
  district?: string | null
  ulus?: string | null
  address?: string | null
  phone?: string | null
}

export type RouteWaypointInput = {
  pickupPointId: string
  settlementId?: string
  sortOrder: number
  isProcurementPoint: boolean
}

export type RouteWaypointView = RouteWaypointInput & {
  id: string
  settlementName: string
  pickupPoint: {
    id: string
    name: string
    address?: string | null
    phone?: string | null
  } | null
}

export type DriverRoutePlan = {
  id: string
  title: string
  description?: string | null
  seasonNote?: string | null
  transportType: string
  isTemplate: boolean
  waypoints: RouteWaypointView[]
}

export type CreateRoutePlanPayload = {
  title: string
  transportType: "winter_road" | "river" | "highway"
  description?: string
  seasonNote?: string
  waypoints: RouteWaypointInput[]
  isTemplate?: boolean
}

export const driverRoutesApi = {
  getSettlementsCatalog: () =>
    http.get<LocationCatalogItem[]>("/settlements/catalog"),

  getTemplates: () => http.get<DriverRoutePlan[]>("/driver/route-templates", true),

  saveTemplate: (payload: CreateRoutePlanPayload) =>
    http.post<DriverRoutePlan>("/driver/route-templates", payload, true),

  deleteTemplate: (id: string) =>
    http.delete<{ ok: boolean }>(`/driver/route-templates/${id}`, true),
}

export const transportToDeliveryMode = (t: string): DeliveryMode => {
  if (t === "river") return "river"
  if (t === "winter_road") return "winter_road"
  return "mixed"
}
