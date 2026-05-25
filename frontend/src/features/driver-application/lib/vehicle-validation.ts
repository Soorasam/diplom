export type VehicleField =
  | "brand"
  | "model"
  | "plate"
  | "capacityKg"
  | "volumeM3"
  | "bodyType"

export type VehicleDraft = {
  brand: string
  model: string
  plate: string
  capacityKg: string
  volumeM3: string
  bodyType: string
}

const NAME_RE = /^[\p{L}\d][\p{L}\d\s\-]{0,48}[\p{L}\d]$/u
const PLATE_RE = /^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/
const PLATE_LETTERS = "АВЕКМНОРСТУХ"
const LATIN_TO_CYRILLIC: Record<string, string> = {
  A: "А",
  B: "В",
  E: "Е",
  K: "К",
  M: "М",
  H: "Н",
  O: "О",
  P: "Р",
  C: "С",
  T: "Т",
  Y: "У",
  X: "Х",
}

const toPlateLetter = (ch: string): string | null => {
  const upper = ch.toUpperCase()
  if (PLATE_LETTERS.includes(upper)) return upper
  return LATIN_TO_CYRILLIC[upper] ?? null
}

export const normalizeVehiclePlate = (value: string) =>
  formatVehiclePlateInput(value)

export const formatVehiclePlateInput = (value: string): string => {
  const chars = value.replace(/\s/g, "").toUpperCase().split("")
  let out = ""
  for (const ch of chars) {
    if (out.length >= 9) break
    const pos = out.length
    if (pos === 0) {
      const letter = toPlateLetter(ch)
      if (letter) out += letter
    } else if (pos >= 1 && pos <= 3) {
      if (/\d/.test(ch)) out += ch
    } else if (pos >= 4 && pos <= 5) {
      const letter = toPlateLetter(ch)
      if (letter) out += letter
    } else if (pos >= 6) {
      if (/\d/.test(ch)) out += ch
    }
  }
  return out
}

export const formatCapacityKgInput = (value: string) => value.replace(/\D/g, "").slice(0, 5)

export const formatVolumeM3Input = (value: string) => {
  const normalized = value.replace(/,/g, ".").replace(/[^\d.]/g, "")
  const dot = normalized.indexOf(".")
  if (dot === -1) return normalized.slice(0, 5)
  const intPart = normalized.slice(0, dot).slice(0, 3)
  const fracPart = normalized.slice(dot + 1).replace(/\./g, "").slice(0, 2)
  if (!intPart && !fracPart) return ""
  if (!fracPart) return intPart ? `${intPart}.` : ""
  return `${intPart || "0"}.${fracPart}`
}

export const getVehicleFieldError = (
  field: VehicleField,
  vehicle: VehicleDraft,
): string | null => {
  switch (field) {
    case "brand": {
      const v = vehicle.brand.trim()
      if (!v) return "Укажите марку"
      if (!NAME_RE.test(v)) return "Марка: 2–50 символов, буквы и цифры"
      return null
    }
    case "model": {
      const v = vehicle.model.trim()
      if (!v) return "Укажите модель"
      if (!NAME_RE.test(v)) return "Модель: 2–50 символов, буквы и цифры"
      return null
    }
    case "plate": {
      const v = normalizeVehiclePlate(vehicle.plate)
      if (!v) return "Укажите госномер"
      if (!PLATE_RE.test(v)) return "Формат: А123ВС14 (без пробелов)"
      return null
    }
    case "capacityKg": {
      const v = vehicle.capacityKg.trim().replace(",", ".")
      if (!v) return "Укажите грузоподъёмность"
      if (!/^\d+$/.test(v)) return "Только целое число, кг"
      const n = Number(v)
      if (n < 100 || n > 50000) return "От 100 до 50 000 кг"
      return null
    }
    case "volumeM3": {
      const v = vehicle.volumeM3.trim().replace(",", ".")
      if (!v) return "Укажите объём кузова"
      if (!/^\d+(\.\d+)?$/.test(v)) return "Число, например 6.5"
      const n = Number(v)
      if (n < 0.1 || n > 100) return "От 0,1 до 100 м³"
      return null
    }
    case "bodyType": {
      const v = vehicle.bodyType.trim()
      if (!v) return "Укажите тип кузова"
      if (v.length < 2 || v.length > 80) return "От 2 до 80 символов"
      return null
    }
    default:
      return null
  }
}

export const isVehicleValid = (vehicle: VehicleDraft): boolean =>
  (
    [
      "brand",
      "model",
      "plate",
      "capacityKg",
      "volumeM3",
      "bodyType",
    ] as VehicleField[]
  ).every((f) => !getVehicleFieldError(f, vehicle))
