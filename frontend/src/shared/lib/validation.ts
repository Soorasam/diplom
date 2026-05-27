const FULL_NAME_PART_RE = /^[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)?$/

export const getRuPhoneDigits = (value: string): string => {
  let raw = value.replace(/\D/g, "")
  if (!raw) return ""

  if (raw.length === 10 && raw.startsWith("9")) {
    raw = `7${raw}`
  } else if (raw.length === 11 && raw.startsWith("8")) {
    raw = `7${raw.slice(1)}`
  } else if (!raw.startsWith("7")) {
    raw = `7${raw}`
  }

  return raw.slice(0, 11)
}

export type RuPhoneValidateOptions = {
  required?: boolean
}

export const getRuPhoneValidationMessage = (
  value: string,
  options: RuPhoneValidateOptions = {},
): string | null => {
  const trimmed = value.trim()
  if (!trimmed) {
    return options.required ? "Укажите номер телефона" : null
  }

  const digits = getRuPhoneDigits(trimmed)
  if (!digits.startsWith("7")) {
    return "Номер должен начинаться с +7"
  }

  if (digits.length < 11) {
    const missing = 11 - digits.length
    const word = missing === 1 ? "цифры" : "цифр"
    return `В номере не хватает ${missing} ${word}`
  }

  if (digits.length > 11) {
    return "Номер содержит лишние цифры"
  }

  return null
}

export const normalizeRuPhone = (value: string): string | null => {
  const err = getRuPhoneValidationMessage(value)
  if (err) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return `+${getRuPhoneDigits(trimmed)}`
}

export const formatRuPhoneInput = (value: string): string => {
  const raw = value.replace(/\D/g, "")
  if (!raw) return ""

  const digits = getRuPhoneDigits(value)
  const local = digits.slice(1)
  const p1 = local.slice(0, 3)
  const p2 = local.slice(3, 6)
  const p3 = local.slice(6, 8)
  const p4 = local.slice(8, 10)

  let out = "+7"
  if (p1) out += ` (${p1}`
  if (p1.length === 3) out += ")"
  if (p2) out += ` ${p2}`
  if (p3) out += `-${p3}`
  if (p4) out += `-${p4}`
  return out
}

export const isValidFullName = (value: string): boolean =>
  (() => {
    const parts = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)
    return parts.length >= 2 && parts.length <= 3 && parts.every((part) => FULL_NAME_PART_RE.test(part))
  })()

export const CLOSES_AT_DATETIME_ERROR = "Выберите корректную дату"

export const MAX_CLOSES_AT_YEARS_AHEAD = 2

const pad2 = (n: number) => String(n).padStart(2, "0")

const toDatetimeLocal = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`

export const getClosesAtDatetimeMin = (): string => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return toDatetimeLocal(d)
}

export const getClosesAtDatetimeMax = (): string => {
  const d = new Date()
  d.setFullYear(d.getFullYear() + MAX_CLOSES_AT_YEARS_AHEAD)
  d.setHours(23, 59, 0, 0)
  return toDatetimeLocal(d)
}

export const getClosesAtValidationMessage = (value: string): string | null => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(trimmed)
  if (!match) return CLOSES_AT_DATETIME_ERROR

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  const now = new Date()
  const minYear = now.getFullYear()
  const maxYear = minYear + MAX_CLOSES_AT_YEARS_AHEAD

  if (year < minYear || year > maxYear) return CLOSES_AT_DATETIME_ERROR
  if (month < 1 || month > 12 || day < 1 || day > 31) return CLOSES_AT_DATETIME_ERROR
  if (hour > 23 || minute > 59) return CLOSES_AT_DATETIME_ERROR

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return CLOSES_AT_DATETIME_ERROR

  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return CLOSES_AT_DATETIME_ERROR
  }

  if (date.getTime() <= Date.now()) return CLOSES_AT_DATETIME_ERROR

  const max = new Date(getClosesAtDatetimeMax())
  if (date.getTime() > max.getTime()) return CLOSES_AT_DATETIME_ERROR

  return null
}
