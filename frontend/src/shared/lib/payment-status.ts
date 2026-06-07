import type { PaymentStatus } from "@/shared/types"

type BadgeVariant = "default" | "success" | "warning" | "info" | "danger"

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: "Ожидает оплаты",
  held: "Зарезервировано на платформе",
  released: "Выплачено координатору",
  refunded: "Возвращено заказчику",
}

export const paymentStatusVariant: Record<PaymentStatus, BadgeVariant> = {
  pending: "warning",
  held: "info",
  released: "success",
  refunded: "default",
}
