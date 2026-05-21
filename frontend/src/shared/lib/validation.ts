const FULL_NAME_PART_RE = /^[A-ZА-ЯЁ][a-zа-яё]+(?:-[A-ZА-ЯЁ][a-zа-яё]+)?$/

export const normalizeRuPhone = (value: string): string | null => {
  const raw = value.replace(/\D/g, "")
  if (!raw) return null

  let digits = raw
  if (digits.length === 10 && digits.startsWith("9")) {
    digits = `7${digits}`
  } else if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`
  }

  if (digits.length !== 11 || !digits.startsWith("7")) return null
  return `+${digits}`
}

export const formatRuPhoneInput = (value: string): string => {
  const raw = value.replace(/\D/g, "")
  if (!raw) return ""

  let digits = raw
  if (digits.startsWith("8")) digits = `7${digits.slice(1)}`
  if (digits.startsWith("9")) digits = `7${digits}`
  if (!digits.startsWith("7")) digits = `7${digits}`
  digits = digits.slice(0, 11)

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
