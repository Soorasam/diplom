export type DriverApplyStep = "personal" | "documents" | "vehicle" | "review"

export const driverApplyStepLabels: Record<DriverApplyStep, string> = {
  personal: "Личные данные",
  documents: "Документы",
  vehicle: "Авто",
  review: "Проверка",
}

export const prevDriverApplyStep = (step: DriverApplyStep): DriverApplyStep | null => {
  if (step === "documents") return "personal"
  if (step === "vehicle") return "documents"
  if (step === "review") return "vehicle"
  return null
}
