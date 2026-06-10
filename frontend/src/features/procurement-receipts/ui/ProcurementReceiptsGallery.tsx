import { useEffect, useState } from "react"
import { ImageOff } from "lucide-react"

import { procurementSettlementApi } from "@/entities/procurement-settlement/api/procurementSettlementApi"
import type { ProcurementReceipt } from "@/entities/procurement-settlement/api/procurementSettlementApi"
import { http } from "@/shared/api/client"
import { toAbsoluteMediaUrl } from "@/shared/lib/normalize-media-url"
import { Button } from "@/shared/ui/button/Button"
import { Spinner } from "@/shared/ui/spinner/Spinner"

type Props = {
  roundId: string
  receipts: ProcurementReceipt[]
  title?: string
  compact?: boolean
}

type OpenedReceipt = {
  src: string
  title: string
}

const receiptTitle = (r: ProcurementReceipt) =>
  `${r.pickupPoint?.name ? `${r.pickupPoint.name} · ` : ""}${r.fileName}`

const ReceiptPreview = ({
  roundId,
  receipt,
  compact,
  onOpen,
}: {
  roundId: string
  receipt: ProcurementReceipt
  compact?: boolean
  onOpen: (src: string, title: string) => void
}) => {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const label = receiptTitle(receipt)

  useEffect(() => {
    let blobUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setFailed(false)
      try {
        const blob = await http.fetchBlob(
          procurementSettlementApi.receiptFilePath(roundId, receipt.id),
          true,
        )
        if (cancelled) return
        blobUrl = URL.createObjectURL(blob)
        setSrc(blobUrl)
      } catch {
        const fallback = toAbsoluteMediaUrl(receipt.url, receipt.objectKey)
        if (fallback) {
          setSrc(fallback)
        } else {
          setFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [roundId, receipt.id, receipt.url, receipt.objectKey])

  if (loading) {
    return (
      <div
        className={
          compact
            ? "flex h-20 w-28 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
            : "flex aspect-[3/4] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
        }
      >
        <Spinner className="h-5 w-5" />
      </div>
    )
  }

  if (failed || !src) {
    return (
      <div
        className={
          compact
            ? "flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-1 text-center"
            : "flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center"
        }
      >
        <ImageOff size={compact ? 16 : 24} className="text-slate-400" />
        <span className="text-[10px] text-slate-500">Не удалось загрузить</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(src, label)}
      className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-emerald-300 hover:shadow-sm"
    >
      <img
        src={src}
        alt={label}
        className={
          compact ? "h-20 w-28 object-cover" : "aspect-[3/4] w-full object-cover"
        }
      />
      <p className="truncate px-2 py-1 text-[10px] text-slate-500">{label}</p>
    </button>
  )
}

export const ProcurementReceiptsGallery = ({
  roundId,
  receipts,
  title = "Чеки закупа",
  compact = false,
}: Props) => {
  const [opened, setOpened] = useState<OpenedReceipt | null>(null)

  if (receipts.length === 0) return null

  return (
    <>
      <div>
        {title ? <p className="text-sm font-semibold text-slate-900">{title}</p> : null}
        <ul
          className={
            compact
              ? "mt-2 flex gap-2 overflow-x-auto pb-1"
              : "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
          }
        >
          {receipts.map((r) => (
            <li key={r.id}>
              <ReceiptPreview
                roundId={roundId}
                receipt={r}
                compact={compact}
                onOpen={(src, openTitle) => setOpened({ src, title: openTitle })}
              />
            </li>
          ))}
        </ul>
      </div>

      {opened ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4"
          onClick={() => setOpened(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                {opened.title}
              </p>
              <Button type="button" variant="ghost" onClick={() => setOpened(null)}>
                Закрыть
              </Button>
            </div>
            <div className="min-h-0 overflow-auto bg-slate-100">
              <img
                src={opened.src}
                alt={opened.title}
                className="mx-auto max-h-[75vh] w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
