import type {
  DeliveryMode,
  DriverApplicationStatus,
  OrderStatus,
  PaymentStatus,
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
  deliveryAddress?: string
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
  phone?: string
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
  isActive?: boolean
}

export interface ProcurementRouteProgressStop {
  pickupPointId: string
  label: string
  status: "pending" | "in_progress" | "completed"
  isProcurementStop: boolean
}

export interface ProcurementWaypoint {
  pickupPointId: string
  settlementId: string
  settlementName?: string
  sortOrder: number
  isProcurementPoint: boolean
  pickupPoint?: { id: string; name: string }
}

export interface Procurement {
  id: string
  title: string
  /** Цепочка посёлков по waypoints — не зависит от названия сбора */
  routeTitle?: string
  routeId: string
  waypoints?: ProcurementWaypoint[]
  status: ProcurementStatus
  createdAt: string
  closesAt: string
  emergencyCloseAt?: string | null
  organizerUserId?: string | null
  driverName?: string | null
  driverPhone?: string | null
  vehicleSummary?: string | null
  minVolumePercent: number
  currentVolumePercent: number
  participantsCount: number
  targetParticipants: number
  currentWeightKg: number
  targetWeightKg: number
  deliveryMode: DeliveryMode
  estimatedDelivery: string
  /** Заказов не отменено и не доставлено (0 — сбор не состоялся). */
  activeOrdersCount?: number
  routeProgress?: ProcurementRouteProgressStop[]
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
  publicNumber?: string
  title?: string
  userName?: string
  userPhone?: string
  deliveryAddress?: string | null
  settlementName?: string | null
  paymentStatus?: PaymentStatus
  paymentStatusLabel?: string
  statusLabel?: string
  refundAmount?: number
  netTotal?: number
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
