import { useState } from "react"
import { UserPlus, Copy, Check } from "lucide-react"

import {
  useAdminPickupPoints,
  useCreatePvzEmployee,
} from "@/entities/admin/api/useAdmin"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { getApiErrorMessage } from "@/shared/lib/api-form-errors"
import { Spinner } from "@/shared/ui/spinner/Spinner"

type CreatedEmployee = {
  email: string
  temporaryPassword: string
  pickupPointName: string
}

export const AdminPvzEmployeesPage = () => {
  const { data: points = [], isLoading } = useAdminPickupPoints()
  const create = useCreatePvzEmployee()

  const [email, setEmail] = useState("")
  const [pickupPointId, setPickupPointId] = useState("")
  const [fullName, setFullName] = useState("")
  const [created, setCreated] = useState<CreatedEmployee | null>(null)
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const canSubmit =
    email.trim().includes("@") && Boolean(pickupPointId) && !create.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setCopied(false)
    if (!canSubmit) return

    try {
      const res = await create.mutateAsync({
        email: email.trim().toLowerCase(),
        pickupPointId,
        ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
      })
      setCreated({
        email: res.user.email,
        temporaryPassword: res.temporaryPassword,
        pickupPointName: `${res.pickupPoint.name} (${res.pickupPoint.settlementName})`,
      })
      setEmail("")
      setFullName("")
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Не удалось создать сотрудника"))
    }
  }

  const copyCredentials = async () => {
    if (!created) return
    const text = `Вход в систему «Коопзакупки»
Email: ${created.email}
Временный пароль: ${created.temporaryPassword}
ПВЗ: ${created.pickupPointName}

При первом входе система попросит задать свой пароль.`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Добавить сотрудника ПВЗ"
        subtitle="Временный пароль передайте сотруднику вручную (почта, мессенджер)"
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <Card className="border-blue-100 bg-blue-50/30">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              label="Email сотрудника"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pvz@example.com"
              required
            />

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">
                Пункт выдачи
              </span>
              <select
                value={pickupPointId}
                onChange={(e) => setPickupPointId(e.target.value)}
                required
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Выберите ПВЗ</option>
                {points.map((pp) => (
                  <option key={pp.id} value={pp.id}>
                    {pp.name}
                    {pp.settlementName ? ` — ${pp.settlementName}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="ФИО (необязательно)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иванов Иван"
            />

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <Button
              type="submit"
              leftIcon={<UserPlus size={16} />}
              disabled={!canSubmit}
            >
              {create.isPending ? "Создание…" : "Создать и получить пароль"}
            </Button>
          </form>
        </Card>
      )}

      {created ? (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <p className="text-sm font-semibold text-emerald-900">Сотрудник создан</p>
          <p className="mt-2 text-sm text-slate-700">
            <span className="text-slate-500">Email:</span> {created.email}
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-slate-900">
            {created.temporaryPassword}
          </p>
          <p className="mt-1 text-xs text-slate-500">{created.pickupPointName}</p>
          <p className="mt-2 text-xs text-amber-800">
            Пароль показывается один раз. Скопируйте и отправьте сотруднику.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
              onClick={() => void copyCredentials()}
            >
              {copied ? "Скопировано" : "Скопировать данные для входа"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
