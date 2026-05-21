import type { DriverApplicationDraft } from "../model/driver-application-draft-store"

export const buildVehicleSummary = (vehicle: DriverApplicationDraft["vehicle"]) => {
  const parts = [
    [vehicle.brand, vehicle.model].filter(Boolean).join(" "),
    vehicle.plate,
    vehicle.capacityKg ? `${vehicle.capacityKg}кг` : "",
    vehicle.volumeM3 ? `${vehicle.volumeM3}м³` : "",
    vehicle.bodyType,
  ].filter(Boolean)
  return parts.join(" · ")
}
