import type { Procurement } from "@/shared/api/api-types"
import type { ProcurementStatus } from "@/shared/types"

type BadgeVariant = "default" | "success" | "warning" | "info" | "danger"

export const procurementStatusLabel: Record<ProcurementStatus, string> = {
  open: "Открыт",
  closing: "Закрывается",
  closed: "Закрыт",
  shipped: "Завершён",
}

export const procurementStatusVariant: Record<ProcurementStatus, BadgeVariant> = {
  open: "info",
  closing: "warning",
  closed: "success",
  shipped: "success",
}

/** Сбор закрыт, но активных заказов нет — не состоялся (мало участников / все отменены). */
export const isProcurementFailed = (procurement: Pick<Procurement, "status" | "activeOrdersCount">) =>
  procurement.status === "closed" &&
  typeof procurement.activeOrdersCount === "number" &&
  procurement.activeOrdersCount === 0

const procurementStatusShortLabel: Record<ProcurementStatus, string> = {
  open: "Открыт",
  closing: "Закр.",
  closed: "Закрыт",
  shipped: "Готов",
}

export const getProcurementDisplayStatus = (
  procurement: Pick<Procurement, "status" | "activeOrdersCount">,
) => {
  if (isProcurementFailed(procurement)) {
    return {
      label: "Не состоялся",
      shortLabel: "Срыв",
      variant: "danger" as const,
    }
  }
  return {
    label: procurementStatusLabel[procurement.status],
    shortLabel: procurementStatusShortLabel[procurement.status],
    variant: procurementStatusVariant[procurement.status],
  }
}
