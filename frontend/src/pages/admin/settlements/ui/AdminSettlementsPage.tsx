import { useState } from "react"
import { MapPin, Plus } from "lucide-react"

import { useAdminSettlements, useCreateSettlement } from "@/entities/admin/api/useAdmin"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { EmptyState } from "@/shared/ui/empty-state/EmptyState"
import { Input } from "@/shared/ui/input/Input"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { getApiErrorMessage } from "@/shared/lib/api-form-errors"

export const AdminSettlementsPage = () => {
  const { data: settlementsList, isLoading } = useAdminSettlements()
  const create = useCreateSettlement()

  const [name, setName] = useState("")
  const [ulus, setUlus] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const canSubmit = name.trim().length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!canSubmit) return

    try {
      await create.mutateAsync({
        name: name.trim(),
        ...(ulus.trim() ? { ulus: ulus.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      })
      setName("")
      setUlus("")
      setAddress("")
      setPhone("")
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Не удалось добавить населённый пункт"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Населённые пункты"
        subtitle="Населённые пункты на маршрутах кооперативной доставки"
      />

      <Card className="border-blue-100 bg-blue-50/30">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-900">Добавить населённый пункт</p>

          <Input
            label="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="с. Троицкий"
            required
          />

          <Input
            label="Улус / район"
            value={ulus}
            onChange={(e) => setUlus(e.target.value)}
            placeholder="Томпонский"
          />

          <Input
            label="Адрес"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ул. Ленина, 12"
          />

          <Input
            label="Телефон"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (914) 000-00-00"
          />

          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

          <Button
            type="submit"
            leftIcon={<Plus size={16} />}
            disabled={!canSubmit || create.isPending}
          >
            {create.isPending ? "Сохранение…" : "Добавить"}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : settlementsList && settlementsList.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {settlementsList.map((location) => (
            <li key={location.id}>
              <Card>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{location.name}</p>
                    {location.ulus ? (
                      <p className="text-xs text-slate-500">{location.ulus}</p>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={MapPin} title="Населённых пунктов нет" />
      )}
    </div>
  )
}
