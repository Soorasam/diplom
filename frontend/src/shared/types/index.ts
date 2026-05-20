export type UserRole = "client" | "driver" | "employee" | "admin"

export type DriverApplicationStatus = "pending" | "approved" | "rejected"

export type OrderStatus =
  | "draft"
  | "pending"
  | "collecting"
  | "confirmed"
  | "in_transit"
  | "at_pickup"
  | "delivered"
  | "cancelled"

export type ProcurementStatus = "open" | "closing" | "closed" | "shipped"

export type DeliveryMode = "winter_road" | "river" | "air" | "mixed"

export interface Coordinates {
  lat: number
  lng: number
}

export interface MapMarker {
  id: string
  title: string
  coordinates: Coordinates
  type: "pickup" | "settlement" | "driver" | "route"
  description?: string
}

export interface MapRoute {
  id: string
  name: string
  points: Coordinates[]
  color?: string
}
