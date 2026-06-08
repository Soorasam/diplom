import { useQuery } from "@tanstack/react-query"

import { adminApi } from "@/entities/admin/api/adminApi"
import { ProcurementReceiptsGallery } from "@/features/procurement-receipts/ui/ProcurementReceiptsGallery"
import { formatPrice } from "@/shared/lib/format"
import { Card } from "@/shared/ui/card/Card"
import { Spinner } from "@/shared/ui/spinner/Spinner"

type Props = {
  roundId: string
}

export const AdminProcurementReceiptsPanel = ({ roundId }: Props) => {
  const { data: receipts, isLoading: loadingReceipts } = useQuery({
    queryKey: ["admin", "procurement-receipts", roundId],
    queryFn: () => adminApi.getProcurementReceipts(roundId),
  })

  const { data: settlement, isLoading: loadingSettlement } = useQuery({
    queryKey: ["admin", "purchase-settlement", roundId],
    queryFn: () => adminApi.getPurchaseSettlement(roundId),
    retry: false,
  })

  if (loadingReceipts || loadingSettlement) {
    return (
      <Card className="flex justify-center py-6">
        <Spinner />
      </Card>
    )
  }

  if (!receipts?.length && !settlement?.purchaseSettledAt) {
    return null
  }

  return (
    <Card className="border-slate-200">
      <ProcurementReceiptsGallery receipts={receipts ?? []} title="Чеки закупа сбора" />
      {settlement?.purchaseSettledAt ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
          <div>
            <dt className="text-xs text-slate-500">Зарезервировано</dt>
            <dd className="font-semibold">{formatPrice(settlement.reservedTotal)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">По чекам</dt>
            <dd className="font-semibold">
              {formatPrice(settlement.actualPurchaseTotal ?? 0)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Возврат жителям</dt>
            <dd className="font-semibold text-emerald-700">
              {formatPrice(settlement.refundTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Водителю</dt>
            <dd className="font-semibold">{formatPrice(settlement.netTotal)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Сверка по чекам ещё не проведена.</p>
      )}
    </Card>
  )
}
