import { useState } from "react"

import type { ProcurementReceipt } from "@/entities/procurement-settlement/api/procurementSettlementApi"
import { resolveReceiptImageUrl } from "@/shared/lib/normalize-media-url"
import { Button } from "@/shared/ui/button/Button"

type Props = {
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

export const ProcurementReceiptsGallery = ({
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
          {receipts.map((r) => {
            const src = resolveReceiptImageUrl(r.url, r.objectKey)
            const label = receiptTitle(r)

            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setOpened({ src, title: label })}
                  className="block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-emerald-300 hover:shadow-sm"
                >
                  <img
                    src={src}
                    alt={label}
                    className={
                      compact
                        ? "h-20 w-28 object-cover"
                        : "aspect-[3/4] w-full object-cover"
                    }
                    loading="lazy"
                  />
                  <p className="truncate px-2 py-1 text-[10px] text-slate-500">{label}</p>
                </button>
              </li>
            )
          })}
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
