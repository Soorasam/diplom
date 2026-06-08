
export interface BackendUser {
  id: string
  email: string
  phone: string | null
  fullName: string | null
  role: "resident" | "coordinator" | "employee" | "admin"
  settlementId: string | null
  pickupPointId: string | null
  mustChangePassword?: boolean
  deliveryAddress?: string | null
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: BackendUser
}

export interface BackendCategory {
  id: string
  title: string
  hint: string | null
  sortOrder: number
}

export interface BackendProduct {
  id: string
  categoryId: string
  name: string
  description: string | null
  unit: string
  priceEstimate: number
  weightKg?: number
  imageUrl: string | null
  requiresPrescription: boolean
}

export interface BackendRoute {
  id: string
  title: string
  transportType: "winter_road" | "river" | "highway"
  createdByUserId?: string | null
}

export interface BackendRoundWaypoint {
  pickupPointId: string
  sortOrder: number
  isProcurementPoint: boolean
  pickupPoint?: { id: string; name: string }
}

export interface BackendRound {
  id: string
  routeId: string
  waypoints?: BackendRoundWaypoint[]
  title: string | null
  routeTitle?: string | null
  routeChainTitle?: string | null
  driverName?: string | null
  driverPhone?: string | null
  vehicleSummary?: string | null
  transportType?: "winter_road" | "river" | "highway"
  createdByUserId?: string | null
  status: "open" | "closed" | "fulfilled"
  createdAt: string
  closesAt: string
  emergencyCloseAt?: string | null
  minParticipants: number
  targetParticipants: number
  participantsCount: number
  currentWeightKg?: number
  targetWeightKg?: number
  progressPercent: number
  route: BackendRoute
  activeOrdersCount?: number
}
