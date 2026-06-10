import { useState } from "react"
import { FileText } from "lucide-react"

import type { DriverApplicationDocument } from "@/shared/api/api-types"
import { normalizeMediaUrl } from "@/shared/lib/normalize-media-url"
import { Button } from "@/shared/ui/button/Button"

import { getDriverDocumentLabel } from "../model/doc-meta"

type DriverDocument = Pick<
  DriverApplicationDocument,
  "id" | "type" | "url" | "fileName" | "mimeType"
>

type OpenedDoc = {
  url: string
  title: string
  isImage: boolean
}

type Props = {
  documents: DriverDocument[]
  emptyMessage?: string
}

const isImageDocument = (doc: DriverDocument) =>
  !doc.mimeType || doc.mimeType.startsWith("image/")

export const DriverDocumentsGallery = ({ documents, emptyMessage }: Props) => {
  const [openedDoc, setOpenedDoc] = useState<OpenedDoc | null>(null)

  if (documents.length === 0) {
    return emptyMessage ? (
      <p className="text-sm text-slate-500">{emptyMessage}</p>
    ) : null
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {documents.map((doc) => {
          const url = normalizeMediaUrl(doc.url) || doc.url
          const label = getDriverDocumentLabel(doc.type)
          const title = `${label}${doc.fileName ? ` · ${doc.fileName}` : ""}`
          const isImage = isImageDocument(doc)

          return (
            <button
              type="button"
              key={doc.id}
              onClick={() => setOpenedDoc({ url, title, isImage })}
              className="block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-sky-200 hover:shadow-sm"
            >
              {isImage ? (
                <img
                  src={url}
                  alt={label}
                  className="aspect-4/3 w-full object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 px-4 text-slate-600">
                  <FileText size={32} className="shrink-0" />
                  <span className="line-clamp-2 text-center text-xs font-medium">
                    {doc.fileName ?? label}
                  </span>
                </div>
              )}
              <p className="border-t border-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                {title}
              </p>
            </button>
          )
        })}
      </div>

      {openedDoc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4"
          onClick={() => setOpenedDoc(null)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">{openedDoc.title}</p>
              <Button type="button" variant="ghost" onClick={() => setOpenedDoc(null)}>
                Закрыть
              </Button>
            </div>
            {openedDoc.isImage ? (
              <img
                src={openedDoc.url}
                alt={openedDoc.title}
                className="max-h-[75vh] w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 px-6 py-10 text-slate-700">
                <FileText size={48} className="text-slate-400" />
                <p className="text-sm">{openedDoc.title}</p>
                <a
                  href={openedDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-link text-sm font-semibold"
                >
                  Открыть файл
                </a>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
