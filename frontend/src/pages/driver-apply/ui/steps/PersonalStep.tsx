import { Check } from "lucide-react"

import { useDriverApplicationDraftStore } from "@/features/driver-application/model/driver-application-draft-store"
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
            setPersonal({ phone: e.target.value })
            touchSaved()
          }}
          placeholder="+7 (___) ___-__-__"
          autoComplete="tel"
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
