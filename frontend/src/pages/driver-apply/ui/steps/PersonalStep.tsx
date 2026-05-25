import { Check } from "lucide-react"

import { useDriverApplicationDraftStore } from "@/features/driver-application/model/driver-application-draft-store"
import { formatRuPhoneInput, getRuPhoneValidationMessage } from "@/shared/lib/validation"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"

type Props = {
  canContinue: boolean
  onContinue: () => void
}

export const PersonalStep = ({ canContinue, onContinue }: Props) => {
  const draft = useDriverApplicationDraftStore((s) => s.draft)
  const setPersonal = useDriverApplicationDraftStore((s) => s.setPersonal)
  const touchSaved = useDriverApplicationDraftStore((s) => s.touchSaved)
  const phoneError = getRuPhoneValidationMessage(draft.personal.phone, { required: true })

  return (
    <Card className="border-slate-200">
      <div className="grid gap-3">
        <Input
          label="ФИО"
          value={draft.personal.fullName}
          onChange={(e) => {
            setPersonal({ fullName: e.target.value })
            touchSaved()
          }}
          placeholder="Иванов Иван Иванович"
          autoComplete="name"
        />
        <Input
          label="Дата рождения"
          type="date"
          value={draft.personal.birthDate}
          onChange={(e) => {
            setPersonal({ birthDate: e.target.value })
            touchSaved()
          }}
        />
        <Input
          label="Телефон"
          value={draft.personal.phone}
          onChange={(e) => {
            setPersonal({ phone: formatRuPhoneInput(e.target.value) })
            touchSaved()
          }}
          placeholder="+7 (999) 000-00-00"
          autoComplete="tel"
          error={phoneError ?? undefined}
        />
        <Input
          label="Email"
          type="email"
          value={draft.personal.email}
          onChange={(e) => {
            setPersonal({ email: e.target.value })
            touchSaved()
          }}
          placeholder="name@example.com"
          autoComplete="email"
        />
      </div>

      <div className="mt-4">
        <Button
          type="button"
          fullWidth
          disabled={!canContinue}
          rightIcon={<Check size={16} />}
          onClick={onContinue}
        >
          Продолжить
        </Button>
      </div>
    </Card>
  )
}
