import { normalizeMediaUrl } from "@/shared/lib/normalize-media-url"
import type { ProcurementReceipt } from "@/entities/procurement-settlement/api/procurementSettlementApi"

type Props = {
  receipts: ProcurementReceipt[]
  title?: string
  compact?: boolean
}

export const ProcurementReceiptsGallery = ({
  receipts,
  title = "Чеки закупа",
  compact = false,
}: Props) => {
  if (receipts.length === 0) return null

  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul
        className={
          compact
            ? "mt-2 flex gap-2 overflow-x-auto pb-1"
            : "mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
        }
      >
        {receipts.map((r) => {
          const src = normalizeMediaUrl(r.url) || r.url
          return (
            <li key={r.id}>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
              >
                <img
                  src={src}
                  alt={r.fileName}
                  className={
                    compact
                      ? "h-20 w-28 object-cover"
                      : "aspect-[3/4] w-full object-cover"
                  }
                />
                <p className="truncate px-2 py-1 text-[10px] text-slate-500">{r.fileName}</p>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
