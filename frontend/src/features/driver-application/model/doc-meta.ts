import type { DriverDocumentKey } from "./driver-application-draft-store"

export const driverDocumentMeta: Record<DriverDocumentKey, { title: string; hint: string }> = {
  passport: {
    title: "Паспорт",
    hint: "Разворот с фото, без бликов",
  },
  license: {
    title: "Водительские права",
    hint: "Лицевая сторона",
  },
  sts: {
    title: "СТС",
    hint: "Свидетельство о регистрации",
  },
}

export const driverDocumentKeys = Object.keys(driverDocumentMeta) as DriverDocumentKey[]
