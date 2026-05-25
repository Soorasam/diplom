import { useRef } from "react"
import { Check, FileText, Loader2, RefreshCw } from "lucide-react"

import { driverDocumentMeta } from "@/features/driver-application/model/doc-meta"
import type {
  DriverDocumentDraft,
  DriverDocumentKey,
} from "@/features/driver-application/model/driver-application-draft-store"
import { Button } from "@/shared/ui/button/Button"
import { cn } from "@/shared/lib/cn"

type Props = {
  docKey: DriverDocumentKey
  doc: DriverDocumentDraft | null
  onPickFile: (key: DriverDocumentKey, file: File) => void
  onRetry: (key: DriverDocumentKey) => void
}

export const DocumentUploadCard = ({
  docKey,
  doc,
  onPickFile,
  onRetry,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const meta = driverDocumentMeta[docKey]
  const Icon = meta.icon
  const uploaded = doc?.status === "uploaded"
  const uploading = doc?.status === "uploading"
  const failed = doc?.status === "failed"
  const hasPreview = Boolean(doc?.previewUrl && (uploaded || uploading || failed))
  const previewSrc = doc?.previewUrl
    ? `${doc.previewUrl}${doc.previewUrl.includes("?") ? "&" : "?"}_v=${doc.fileName}-${doc.status}-${doc.progress}`
    : undefined

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-stretch gap-4">
        <div className="flex w-[42%] max-w-[200px] min-w-[128px] shrink-0 flex-col gap-2 self-stretch">
          <div
            className={cn(
              "relative flex min-h-[152px] w-full flex-1 items-center justify-center overflow-hidden rounded-2xl border",
              hasPreview
                ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                : "border-dashed border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80",
            )}
          >
            {hasPreview && previewSrc ? (
              <img
                key={previewSrc}
                src={previewSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <Icon size={40} className="text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
            )}
            {uploading ? (
              <span className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-slate-900/70">
                <Loader2 size={28} className="animate-spin text-sky-600" />
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "line-clamp-2 shrink-0 text-center text-[11px] leading-tight",
              doc?.fileName
                ? "font-medium text-slate-600 dark:text-slate-400"
                : "text-slate-400",
            )}
          >
            {doc?.fileName ?? "Нет файла"}
          </p>
        </div>

        <div className="relative flex min-h-[168px] min-w-0 flex-1 flex-col">
          <div className="absolute right-0 top-0 z-10">
            {uploaded ? (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                aria-label="Загружено"
              >
                <Check size={16} strokeWidth={2.5} />
              </span>
            ) : uploading ? (
              <Loader2 size={20} className="animate-spin text-sky-600 dark:text-sky-400" />
            ) : failed ? (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-950/50 dark:text-red-400">
                !
              </span>
            ) : null}
          </div>

          <div className="pr-9">
            <p className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100">
              {meta.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{meta.hint}</p>
          </div>

          {uploading ? (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  className="h-1.5 rounded-full bg-sky-600 transition-[width]"
                  style={{ width: `${doc?.progress ?? 0}%` }}
                />
              </div>
            </div>
          ) : null}

          {failed ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{doc?.error}</p>
          ) : null}

          <div className="mt-auto flex flex-col gap-2 pt-4">
            <input
              ref={inputRef}
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (!file) return
                onPickFile(docKey, file)
              }}
            />
            <Button
              type="button"
              variant="outline"
              fullWidth
              disabled={uploading}
              leftIcon={<FileText size={18} />}
              onClick={() => inputRef.current?.click()}
            >
              {uploaded ? "Заменить" : "Загрузить документ"}
            </Button>

            {failed ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                onClick={() => onRetry(docKey)}
              >
                Повторить
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
