import type {
  Category,
  Order,
  PickupPoint,
  Product,
  Procurement,
  Settlement,
  User,
} from "@/shared/api/api-types"
import type {
  BackendCategory,
  BackendProduct,
  BackendRound,
  BackendUser,
} from "@/shared/api/backend-types"
import type { DeliveryMode, OrderStatus, PaymentStatus, UserRole } from "@/shared/types"
import { normalizeProductImageUrl } from "@/shared/lib/normalize-media-url"

export const parseApiNumber = (
  value: number | string | { toNumber(): number } | null | undefined,
): number => {
  if (value == null) return 0
  if (typeof value === "number") return value
  if (typeof value === "string") return parseFloat(value) || 0
  return value.toNumber()
}

export const mapBackendRole = (role: BackendUser["role"]): UserRole => {
  if (role === "admin") return "admin"
  if (role === "employee") return "client"
  if (role === "coordinator") return "driver"
  return "client"
}

const BACKEND_TO_FRONT_STATUS: Record<string, OrderStatus> = {
  submitted: "pending",
  confirmed: "confirmed",
  in_transit: "in_transit",
  at_pickup: "at_pickup",
  delivered: "delivered",
  cancelled: "cancelled",
}

const FRONT_TO_BACKEND_STATUS: Partial<Record<OrderStatus, string>> = {
  pending: "submitted",
  confirmed: "confirmed",
  in_transit: "in_transit",
  at_pickup: "at_pickup",
  delivered: "delivered",
  cancelled: "cancelled",
}

export const mapBackendOrderStatus = (status: string): OrderStatus =>
  BACKEND_TO_FRONT_STATUS[status] ?? "pending"

export const mapFrontOrderStatusToBackend = (status: OrderStatus): string =>
  FRONT_TO_BACKEND_STATUS[status] ?? status

export const mapBackendOrder = (o: {
  id: string
  userId: string
  roundId?: string
  procurementId?: string
  pickupPointId: string | null
  status: string
  total?: number
  totalEstimate?: number
  comment?: string | null
  createdAt: string | Date
  items?: {
    productId: string
    productName?: string
    quantity: number
    price?: number
    priceSnapshot?: number
  }[]
  publicNumber?: string
  title?: string
  timeline?: Order["timeline"]
  paymentStatus?: PaymentStatus
  paymentStatusLabel?: string
  statusLabel?: string
  refundAmount?: number | string | { toNumber(): number } | null
  netTotal?: number | string | { toNumber(): number } | null
}): Order => ({
  id: o.id,
  userId: o.userId,
  procurementId: o.procurementId ?? o.roundId ?? "",
  pickupPointId: o.pickupPointId ?? "",
  status: mapBackendOrderStatus(o.status),
  total: o.total ?? o.totalEstimate ?? 0,
  comment: o.comment ?? undefined,
  createdAt: typeof o.createdAt === "string" ? o.createdAt : o.createdAt.toISOString(),
  items: (o.items ?? []).map((i) => ({
    productId: i.productId,
    productName: i.productName,
    quantity: i.quantity,
    price: parseApiNumber(i.price ?? i.priceSnapshot),
  })),
  timeline:
    o.timeline ??
    [
      {
        status: mapBackendOrderStatus(o.status),
        at: typeof o.createdAt === "string" ? o.createdAt : o.createdAt.toISOString(),
        label: o.status,
      },
    ],
  publicNumber: o.publicNumber,
  title: o.title,
  userName: (o as { userName?: string }).userName,
  userPhone: (o as { userPhone?: string }).userPhone,
  deliveryAddress: (o as { deliveryAddress?: string | null }).deliveryAddress ?? undefined,
  settlementName: (o as { settlementName?: string | null }).settlementName ?? undefined,
  paymentStatus: o.paymentStatus,
  paymentStatusLabel: o.paymentStatusLabel,
  statusLabel: o.statusLabel,
  refundAmount: parseApiNumber(o.refundAmount),
  netTotal: parseApiNumber(o.netTotal),
})

export const mapSettlement = (s: {
  id: string
  name: string
  district?: string | null
  ulus?: string | null
}): Settlement => ({
  id: s.id,
  name: s.name,
  ulus: s.ulus ?? s.district ?? "",
  population: 0,
  coordinates: { lat: 0, lng: 0 },
})

export const mapPickupPoint = (p: {
  id: string
  name: string
  settlementId?: string
  address?: string | null
  phone?: string | null
}): PickupPoint => ({
  id: p.id,
  settlementId: p.settlementId ?? p.id,
  name: p.name ?? "",
  address: p.address ?? "",
  phone: p.phone ?? undefined,
  coordinates: { lat: 0, lng: 0 },
})

export const mapUser = (u: BackendUser): User => {
  const locationId = u.pickupPointId ?? u.settlementId ?? ""
  return {
    id: u.id,
    name: u.fullName ?? u.email,
    phone: u.phone ?? "",
    email: u.email,
    role: mapBackendRole(u.role),
    settlementId: locationId,
    pickupPointId: locationId || undefined,
    mustChangePassword: u.mustChangePassword ?? false,
    deliveryAddress: u.deliveryAddress ?? undefined,
  }
}

export const mapCategory = (c: BackendCategory): Category => ({
  id: c.id,
  name: c.title,
  slug: c.title.toLowerCase().replace(/\s+/g, "-").slice(0, 40),
  icon: "package",
})

export const mapProduct = (p: BackendProduct): Product => ({
  id: p.id,
  name: p.name,
  description: p.description ?? "",
  price: parseApiNumber(p.priceEstimate as number | string),
  categoryId: p.categoryId,
  imageUrl: normalizeProductImageUrl(p.imageUrl),
  weightKg: parseApiNumber(p.weightKg ?? 0),
  unit: p.unit,
})

const mapTransport = (t: BackendRound["route"]["transportType"]): DeliveryMode => {
  if (t === "river") return "river"
  if (t === "winter_road") return "winter_road"
  return "mixed"
}

const resolveRoundChainTitle = (r: BackendRound): string =>
  r.routeChainTitle?.trim() ||
  r.routeTitle?.trim() ||
  r.route.title?.trim() ||
  "Маршрут"

export const mapRound = (r: BackendRound): Procurement => {
  const routeTitle = resolveRoundChainTitle(r)
  return {
  id: r.id,
  title: r.title?.trim() || routeTitle,
  routeTitle,
  routeId: r.routeId,
  waypoints: (r.waypoints ?? []).map((w) => {
    const raw = w as typeof w & {
      settlementId?: string
      settlementName?: string
      pickup_point_id?: string
      pickupPoint?: { id?: string; name?: string }
    }
    const pickupPointId =
      raw.pickupPointId ?? raw.pickupPoint?.id ?? raw.pickup_point_id ?? ""
    return {
      pickupPointId,
      settlementId: raw.settlementId ?? pickupPointId,
      settlementName: raw.settlementName ?? raw.pickupPoint?.name,
      sortOrder: w.sortOrder,
      isProcurementPoint: w.isProcurementPoint,
      pickupPoint: raw.pickupPoint?.id
        ? { id: raw.pickupPoint.id, name: raw.pickupPoint.name ?? "" }
        : undefined,
    }
  }),
  status:
    r.status === "open" && r.emergencyCloseAt
      ? "closing"
      : r.status === "open"
        ? "open"
        : r.status === "fulfilled"
          ? "shipped"
          : r.status === "closed"
            ? "closed"
            : "closing",
  createdAt: r.createdAt ?? r.closesAt,
  closesAt: r.closesAt,
  emergencyCloseAt: r.emergencyCloseAt ?? null,
  organizerUserId: r.route.createdByUserId ?? r.createdByUserId ?? null,
  minVolumePercent: Math.max(
    10,
    Math.round((r.minParticipants / Math.max(r.targetParticipants, 1)) * 100),
  ),
  currentVolumePercent: r.progressPercent,
  participantsCount: r.participantsCount,
  targetParticipants: r.targetParticipants,
  currentWeightKg: parseApiNumber(r.currentWeightKg ?? r.participantsCount * 10),
  targetWeightKg: parseApiNumber(r.targetWeightKg ?? r.targetParticipants * 10),
  deliveryMode: mapTransport(r.route.transportType),
  estimatedDelivery: r.closesAt,
  activeOrdersCount: r.activeOrdersCount,
  driverName: r.driverName ?? null,
  driverPhone: r.driverPhone ?? null,
  vehicleSummary: r.vehicleSummary ?? null,
  }
}
