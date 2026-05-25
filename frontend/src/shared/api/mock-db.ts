import type {
  DeliveryMode,
  DriverApplicationStatus,
  OrderStatus,
  ProcurementStatus,
  UserRole,
} from "@/shared/types"

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  role: UserRole
  settlementId: string
  pickupPointId?: string
  avatarUrl?: string
  
  mustChangePassword?: boolean
}

export interface DriverApplicationDocument {
  id: string
  type: string
  url: string
  fileName?: string | null
  mimeType?: string | null
}

export interface DriverApplication {
  id: string
  userId: string
  status: DriverApplicationStatus
  submittedAt: string
  reviewedAt?: string
  rejectionReason?: string
  vehicleSummary?: string
  documents?: DriverApplicationDocument[]
}

export interface PvzEmployeeProfile {
  userId: string
  pickupPointId: string
}

export interface Settlement {
  id: string
  name: string
  ulus: string
  population: number
  coordinates: { lat: number; lng: number }
}

export interface PickupPoint {
  id: string
  settlementId: string
  name: string
  address: string
  coordinatorName: string
  coordinatorPhone: string
  coordinates: { lat: number; lng: number }
}

export interface Category {
  id: string
  name: string
  slug: string
  icon: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  imageUrl: string
  weightKg: number
  unit: string
  popular?: boolean
}

export interface Procurement {
  id: string
  title: string
  routeId: string
  status: ProcurementStatus
  createdAt: string
  closesAt: string
  minVolumePercent: number
  currentVolumePercent: number
  participantsCount: number
  targetParticipants: number
  currentWeightKg: number
  targetWeightKg: number
  deliveryMode: DeliveryMode
  estimatedDelivery: string
}

export interface DeliveryRoute {
  id: string
  name: string
  fromSettlementId: string
  toSettlementIds: string[]
  deliveryMode: DeliveryMode
  driverId?: string
  status: "planned" | "active" | "completed"
  points: { lat: number; lng: number }[]
}

export interface OrderItem {
  productId: string
  productName?: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  userId: string
  procurementId: string
  status: OrderStatus
  items: OrderItem[]
  pickupPointId: string
  total: number
  comment?: string
  createdAt: string
  timeline: { status: OrderStatus; at: string; label: string }[]
}

export interface Notification {
  id: string
  userId: string
  ticketId?: string | null
  title: string
  body: string
  read: boolean
  createdAt: string
}
