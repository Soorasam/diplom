import { useRef, useState } from "react"
import { ImagePlus, Receipt } from "lucide-react"

import {
  useProcurementStopReceipts,
  useUploadProcurementStopReceipt,
} from "@/entities/procurement-settlement/api/useProcurementSettlement"
import { ProcurementReceiptsGallery } from "@/features/procurement-receipts/ui/ProcurementReceiptsGallery"
import { Button } from "@/shared/ui/button/Button"

type Props = {
  roundId: string
  pickupPointId: string
  locationName: string
}

export const ProcurementStopReceiptsCard = ({
  roundId,
  pickupPointId,
  locationName,
}: Props) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: receipts = [] } = useProcurementStopReceipts(roundId, pickupPointId)
  const upload = useUploadProcurementStopReceipt(roundId, pickupPointId)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      await upload.mutateAsync(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото")
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <div className="flex items-start gap-2">
        <Receipt size={18} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Чек закупки · {locationName}
          </p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            Прикрепите фото чека с этой точки — без этого нельзя выехать дальше.
          </p>
        </div>
      </div>

      {receipts.length > 0 ? (
        <div className="mt-3">
          <ProcurementReceiptsGallery receipts={receipts} title="" compact />
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="secondary"
        className="mt-3"
        size="sm"
        leftIcon={<ImagePlus size={16} />}
        loading={upload.isPending}
        onClick={() => fileRef.current?.click()}
      >
        {receipts.length > 0 ? "Добавить ещё фото" : "Прикрепить фото чека"}
      </Button>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
