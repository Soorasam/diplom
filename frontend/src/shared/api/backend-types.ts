
export interface BackendUser {
  id: string
  email: string
  phone: string | null
  fullName: string | null
  role: "resident" | "coordinator" | "employee" | "admin"
  settlementId: string | null
  pickupPointId: string | null
  mustChangePassword?: boolean
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
}

export interface BackendRound {
  id: string
  routeId: string
  title: string | null
  status: "open" | "closed" | "fulfilled"
  createdAt: string
  closesAt: string
  minParticipants: number
  targetParticipants: number
  participantsCount: number
  currentWeightKg?: number
  targetWeightKg?: number
  progressPercent: number
  route: BackendRoute
}
