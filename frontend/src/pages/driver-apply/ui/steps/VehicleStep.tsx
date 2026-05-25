import { Check } from "lucide-react"

import {
  formatCapacityKgInput,
  formatVehiclePlateInput,
  formatVolumeM3Input,
  getVehicleFieldError,
  type VehicleField,
} from "@/features/driver-application/lib/vehicle-validation"
import { useDriverApplicationDraftStore } from "@/features/driver-application/model/driver-application-draft-store"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"

type Props = {
  canContinue: boolean
  onContinue: () => void
  onBack: () => void
}

export const VehicleStep = ({ canContinue, onContinue, onBack }: Props) => {
  const vehicle = useDriverApplicationDraftStore((s) => s.draft.vehicle)
  const setVehicle = useDriverApplicationDraftStore((s) => s.setVehicle)
  const touchSaved = useDriverApplicationDraftStore((s) => s.touchSaved)

  const fieldError = (field: VehicleField) => {
    const v = vehicle[field]
    if (!v.trim()) return undefined
    return getVehicleFieldError(field, vehicle) ?? undefined
  }

  return (
    <Card className="border-slate-200">
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Марка"
            value={vehicle.brand}
            onChange={(e) => {
              setVehicle({ brand: e.target.value })
              touchSaved()
            }}
            placeholder="Toyota"
            error={fieldError("brand")}
          />
          <Input
            label="Модель"
            value={vehicle.model}
            onChange={(e) => {
              setVehicle({ model: e.target.value })
              touchSaved()
            }}
            placeholder="HiAce"
            error={fieldError("model")}
          />
        </div>
        <Input
          label="Госномер"
          value={vehicle.plate}
          onChange={(e) => {
            setVehicle({ plate: formatVehiclePlateInput(e.target.value) })
            touchSaved()
          }}
          placeholder="А123ВС14"
          maxLength={9}
          autoCapitalize="characters"
          spellCheck={false}
          error={fieldError("plate")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Грузоподъемность (кг)"
            inputMode="numeric"
            pattern="[0-9]*"
            value={vehicle.capacityKg}
            onChange={(e) => {
              setVehicle({ capacityKg: formatCapacityKgInput(e.target.value) })
              touchSaved()
            }}
            placeholder="1200"
            maxLength={5}
            error={fieldError("capacityKg")}
          />
          <Input
            label="Объем кузова (м³)"
            inputMode="decimal"
            value={vehicle.volumeM3}
            onChange={(e) => {
              setVehicle({ volumeM3: formatVolumeM3Input(e.target.value) })
              touchSaved()
            }}
            placeholder="6.5"
            maxLength={6}
            error={fieldError("volumeM3")}
          />
        </div>
        <Input
          label="Тип кузова"
          value={vehicle.bodyType}
          onChange={(e) => {
            setVehicle({ bodyType: e.target.value })
            touchSaved()
          }}
          placeholder="фургон / бортовой / рефрижератор"
          error={fieldError("bodyType")}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          type="button"
          fullWidth
          disabled={!canContinue}
          rightIcon={<Check size={16} />}
          onClick={onContinue}
        >
          Продолжить
        </Button>
        <Button type="button" fullWidth variant="secondary" onClick={onBack}>
          Назад
        </Button>
      </div>
    </Card>
  )
}
