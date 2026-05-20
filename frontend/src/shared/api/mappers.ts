import type { Category, Product, Procurement, User } from "@/shared/api/mock-db"
import type {
  BackendCategory,
  BackendProduct,
  BackendRound,
  BackendUser,
} from "@/shared/api/backend-types"
import type { DeliveryMode, UserRole } from "@/shared/types"

export const mapBackendRole = (role: BackendUser["role"]): UserRole => {
  if (role === "admin") return "admin"
  if (role === "coordinator") return "driver"
  return "client"
}

export const mapUser = (u: BackendUser): User => ({
  id: u.id,
  name: u.fullName ?? u.email,
  phone: u.phone ?? "",
  role: mapBackendRole(u.role),
  settlementId: u.settlementId ?? "",
})

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
  price: p.priceEstimate,
  categoryId: p.categoryId,
  imageUrl: p.imageUrl ?? "",
  weightKg: 0,
  unit: p.unit,
})

const mapTransport = (t: BackendRound["route"]["transportType"]): DeliveryMode => {
  if (t === "river") return "river"
  if (t === "winter_road") return "winter_road"
  return "mixed"
}

export const mapRound = (r: BackendRound): Procurement => ({
  id: r.id,
  title: r.title ?? r.route.title,
  routeId: r.routeId,
  status: r.status === "open" ? "open" : "closed",
  closesAt: r.closesAt,
  minVolumePercent: Math.max(
    10,
    Math.round((r.minParticipants / Math.max(r.targetParticipants, 1)) * 100),
  ),
  currentVolumePercent: r.progressPercent,
  deliveryMode: mapTransport(r.route.transportType),
  estimatedDelivery: r.closesAt,
})
