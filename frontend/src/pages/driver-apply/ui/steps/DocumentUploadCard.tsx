import { FileText, RefreshCw } from "lucide-react"

import { driverDocumentMeta } from "@/features/driver-application/model/doc-meta"
import type {
  DriverDocumentDraft,
  DriverDocumentKey,
} from "@/features/driver-application/model/driver-application-draft-store"
import { Badge } from "@/shared/ui/badge/Badge"
import { Button } from "@/shared/ui/button/Button"

type Props = {
  docKey: DriverDocumentKey
  doc: DriverDocumentDraft | null
  onPickFile: (key: DriverDocumentKey, file: File) => void
  onRetry: (key: DriverDocumentKey) => void
  onRemove: (key: DriverDocumentKey) => void
}

export const DocumentUploadCard = ({
  docKey,
  doc,
  onPickFile,
  onRetry,
  onRemove,
}: Props) => {
  const meta = driverDocumentMeta[docKey]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{meta.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{meta.hint}</p>
          {doc?.fileName ? (
            <p className="mt-2 text-xs font-medium text-slate-700">{doc.fileName}</p>
          ) : null}
        </div>
        {doc?.status === "uploaded" ? (
          <Badge variant="success">uploaded</Badge>
        ) : doc?.status === "failed" ? (
          <Badge variant="danger">failed</Badge>
        ) : doc?.status === "uploading" ? (
          <Badge variant="info">uploading</Badge>
        ) : (
          <Badge>required</Badge>
        )}
      </div>

      {doc?.previewUrl ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img src={doc.previewUrl} alt="" className="h-40 w-full object-cover" />
        </div>
      ) : null}

      {doc?.status === "uploading" ? (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-600 transition-[width]"
              style={{ width: `${doc.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{doc.progress}%</p>
        </div>
      ) : null}

      {doc?.status === "failed" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => onRetry(docKey)}
          >
            Повторить
          </Button>
          <Button type="button" variant="ghost" onClick={() => onRemove(docKey)}>
            Удалить
          </Button>
        </div>
      ) : null}

      <div className="mt-3">
        <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50">
          <FileText size={18} className="mr-2 text-blue-600" />
          Загрузить фото
          <input
            className="hidden"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              onPickFile(docKey, file)
            }}
          />
        </label>
      </div>
    </div>
  )
}
