import { Check } from "lucide-react"

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
          />
          <Input
            label="Модель"
            value={vehicle.model}
            onChange={(e) => {
              setVehicle({ model: e.target.value })
              touchSaved()
            }}
            placeholder="HiAce"
          />
        </div>
        <Input
          label="Госномер"
          value={vehicle.plate}
          onChange={(e) => {
            setVehicle({ plate: e.target.value.toUpperCase() })
            touchSaved()
          }}
          placeholder="А123ВС14"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Грузоподъемность (кг)"
            inputMode="numeric"
            value={vehicle.capacityKg}
            onChange={(e) => {
              setVehicle({ capacityKg: e.target.value })
              touchSaved()
            }}
            placeholder="1200"
          />
          <Input
            label="Объем кузова (м³)"
            inputMode="decimal"
            value={vehicle.volumeM3}
            onChange={(e) => {
              setVehicle({ volumeM3: e.target.value })
              touchSaved()
            }}
            placeholder="6.5"
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
