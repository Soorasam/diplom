import { useState } from "react"
import { FileText } from "lucide-react"

import type { TicketAttachment } from "@/entities/ticket/model/types"
import { normalizeMediaUrl } from "@/shared/lib/normalize-media-url"

type Props = {
  attachment: TicketAttachment
  onDarkBubble?: boolean
  onOpenImage?: (url: string, fileName: string) => void
}

const fileLinkClass = (onDarkBubble?: boolean) =>
  `inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
    onDarkBubble
      ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
  }`

export const TicketAttachmentView = ({ attachment, onDarkBubble, onOpenImage }: Props) => {
  const [imageFailed, setImageFailed] = useState(false)
  const url = normalizeMediaUrl(attachment.url)
  const isImage = attachment.mimeType.startsWith("image/") && !imageFailed

  if (!url) {
    return (
      <span className="text-xs opacity-70">
        {attachment.fileName}
      </span>
    )
  }

  if (isImage) {
    const openImage = () => {
      if (onOpenImage) {
        onOpenImage(url, attachment.fileName)
        return
      }
      window.open(url, "_blank", "noopener,noreferrer")
    }
    return (
      <button
        type="button"
        className="block cursor-zoom-in overflow-hidden rounded-lg border-0 bg-transparent p-0"
        onClick={openImage}
        title="Открыть в новой вкладке"
      >
        <img
          src={url}
          alt={attachment.fileName}
          className="max-h-56 max-w-full rounded-lg object-contain"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      </button>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.fileName}
      className={fileLinkClass(onDarkBubble)}
    >
      <FileText size={18} className="shrink-0" />
      <span className="max-w-[200px] truncate">{attachment.fileName}</span>
    </a>
  )
}

type LocalFilePreview = {
  file: File
  url: string
}

export const TicketLocalFilePreview = ({
  items,
  onRemove,
  onPreviewImage,
}: {
  items: LocalFilePreview[]
  onRemove: (index: number) => void
  onPreviewImage?: (url: string, fileName: string) => void
}) => {
  if (items.length === 0) return null

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <li
          key={`${item.file.name}-${item.file.size}-${i}`}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
        >
          {item.file.type.startsWith("image/") ? (
            <img
              src={item.url}
              alt={item.file.name}
              className="h-24 w-24 cursor-zoom-in object-cover"
              onClick={() => onPreviewImage?.(item.url, item.file.name)}
            />
          ) : (
            <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 p-2 text-center text-xs text-slate-600">
              <FileText size={22} />
              <span className="line-clamp-2">{item.file.name}</span>
            </div>
          )}
          <button
            type="button"
            className="absolute right-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white"
            onClick={() => onRemove(i)}
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  )
}
