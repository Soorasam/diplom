import type { OrderStatus } from "@/shared/types"

type BadgeVariant = "default" | "success" | "warning" | "info" | "danger"

export const orderStatusLabel: Record<OrderStatus, string> = {
  draft: "Черновик",
  pending: "Ожидает",
  collecting: "В сборе",
  confirmed: "Подтверждён",
  in_transit: "В пути",
  at_pickup: "В пункте выдачи",
  delivered: "Выдан",
  cancelled: "Отменён",
}

export const orderStatusVariant: Record<OrderStatus, BadgeVariant> = {
  draft: "default",
  pending: "warning",
  collecting: "info",
  confirmed: "info",
  in_transit: "info",
  at_pickup: "success",
  delivered: "success",
  cancelled: "danger",
}
