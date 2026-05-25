import type { LucideIcon } from "lucide-react"
import { Car, CreditCard, IdCard } from "lucide-react"

import type { DriverDocumentKey } from "./driver-application-draft-store"

export const driverDocumentMeta: Record<
  DriverDocumentKey,
  { title: string; hint: string; icon: LucideIcon }
> = {
  passport: {
    title: "Паспорт",
    hint: "Разворот с фото, без бликов",
    icon: IdCard,
  },
  license: {
    title: "Водительские права",
    hint: "Лицевая сторона",
    icon: CreditCard,
  },
  sts: {
    title: "СТС",
    hint: "Свидетельство о регистрации",
    icon: Car,
  },
}

export const driverDocumentKeys = Object.keys(driverDocumentMeta) as DriverDocumentKey[]
