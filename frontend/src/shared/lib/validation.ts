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
