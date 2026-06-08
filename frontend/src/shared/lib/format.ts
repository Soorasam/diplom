export const formatPrice = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value)

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))

export const formatShortDate = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso))

export const formatShortDateTime = (iso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

export const formatWeightKg = (kg: number) => {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} т`
  if (kg >= 10) return `${kg.toFixed(0)} кг`
  if (kg >= 1) return `${kg.toFixed(1)} кг`
  return `${kg.toFixed(2)} кг`
}
