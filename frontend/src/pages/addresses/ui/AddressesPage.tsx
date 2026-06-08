import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Check, MapPin } from "lucide-react"

import { useAuthStore } from "@/app/model/auth-store"
import { useSettlements } from "@/entities/settlement/api/useSettlements"
import { queryKeys } from "@/shared/config/query-keys"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Card } from "@/shared/ui/card/Card"
import { Input } from "@/shared/ui/input/Input"
import { Button } from "@/shared/ui/button/Button"
import { Spinner } from "@/shared/ui/spinner/Spinner"
import { cn } from "@/shared/lib/cn"

export const AddressesPage = () => {
  const profileRoutes = useProfileRoutes()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const updateSettlement = useAuthStore((s) => s.updateSettlement)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const { data: settlements, isLoading } = useSettlements()
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [address, setAddress] = useState(user?.deliveryAddress ?? "")
  const [savingAddress, setSavingAddress] = useState(false)

  useEffect(() => {
    setAddress(user?.deliveryAddress ?? "")
  }, [user?.deliveryAddress])

  const handleSelect = async (settlementId: string) => {
    setError(null)
    setSavingId(settlementId)
    try {
      await updateSettlement(settlementId)
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.active })
      void qc.invalidateQueries({ queryKey: queryKeys.procurements.all })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить посёлок")
    } finally {
      setSavingId(null)
    }
  }

  const handleSaveAddress = async () => {
    const trimmed = address.trim()
    if (!trimmed) {
      setError("Укажите адрес дома — водитель привезёт заказ лично")
      return
    }
    setError(null)
    setSavingAddress(true)
    try {
      await updateProfile({ deliveryAddress: trimmed })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить адрес")
    } finally {
      setSavingAddress(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <PageHeader
        title="Доставка"
        backTo={profileRoutes.profile}
        subtitle="Посёлок и адрес дома — водитель обходит жителей по адресам"
      />

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <Card className="!p-4">
        <Input
          label="Адрес дома"
          placeholder="Улица, дом, ориентир для водителя"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button
          type="button"
          fullWidth
          className="mt-3"
          loading={savingAddress}
          onClick={() => void handleSaveAddress()}
        >
          Сохранить адрес
        </Button>
      </Card>

      <p className="text-sm font-semibold text-slate-800">Населённый пункт</p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {settlements?.map((s) => {
            const selected =
              user?.settlementId === s.id || user?.pickupPointId === s.id
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={savingId === s.id}
                  onClick={() => void handleSelect(s.id)}
                  className="w-full text-left"
                >
                  <Card
                    className={cn(
                      "transition",
                      selected && "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={20}
                        className={selected ? "text-blue-600" : "text-slate-400"}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.ulus} улус</p>
                      </div>
                      {selected ? (
                        <Check size={20} className="shrink-0 text-blue-600" />
                      ) : null}
                    </div>
                  </Card>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
