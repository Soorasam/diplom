export type DeliveryAddressParts = {
  street: string
  house: string
  building: string
}

export type DeliveryAddressFieldErrors = Partial<
  Record<keyof DeliveryAddressParts, string>
>

const STREET_MIN_LEN = 2
const HOUSE_RE = /^[0-9]+[а-яА-ЯёЁa-zA-Z\-/]*$/
const BUILDING_RE = /^[0-9]+[а-яА-ЯёЁa-zA-Z\-/]*$/

export const formatDeliveryAddress = (parts: DeliveryAddressParts): string => {
  const street = parts.street.trim().replace(/\s+/g, " ")
  const house = parts.house.trim()
  const building = parts.building.trim()
  let result = `улица ${street}, дом ${house}`
  if (building) result += `, корпус ${building}`
  return result
}

export const parseDeliveryAddress = (
  value: string | null | undefined,
): DeliveryAddressParts => {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) {
    return { street: "", house: "", building: "" }
  }

  const structured = /^(?:ул\.?\s*|улица\s+)(.+?),\s*(?:д\.?\s*|дом\s+)([^\s,]+)(?:,\s*(?:корп\.?\s*|корпус\s+)(.+))?$/i.exec(
    trimmed,
  )
  if (structured) {
    return {
      street: structured[1].trim(),
      house: structured[2].trim(),
      building: structured[3]?.trim() ?? "",
    }
  }

  return { street: trimmed, house: "", building: "" }
}

export const validateDeliveryAddressParts = (
  parts: DeliveryAddressParts,
): DeliveryAddressFieldErrors => {
  const errors: DeliveryAddressFieldErrors = {}
  const street = parts.street.trim().replace(/\s+/g, " ")
  const house = parts.house.trim()
  const building = parts.building.trim()

  if (!street) {
    errors.street = "Укажите улицу"
  } else if (street.length < STREET_MIN_LEN) {
    errors.street = "Название улицы слишком короткое"
  }

  if (!house) {
    errors.house = "Укажите номер дома"
  } else if (!HOUSE_RE.test(house)) {
    errors.house = "Номер дома: цифры, при необходимости буква или дробь (например 32 или 12А)"
  }

  if (building && !BUILDING_RE.test(building)) {
    errors.building = "Корпус: цифры, при необходимости буква (например 1 или 2Б)"
  }

  return errors
}

export const hasDeliveryAddressErrors = (errors: DeliveryAddressFieldErrors) =>
  Object.keys(errors).length > 0
