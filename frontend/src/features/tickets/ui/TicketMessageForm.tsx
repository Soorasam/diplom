import { useCallback, useEffect, useRef, useState } from "react"
import { ImagePlus } from "lucide-react"

import { ApiError } from "@/shared/api/client"
import { Button } from "@/shared/ui/button/Button"

import { TicketLocalFilePreview } from "./TicketAttachmentView"

const MAX_FILES = 5
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf"

type PreviewItem = { file: File; url: string }

type Props = {
  onSubmit: (body: string, files: File[]) => Promise<void>
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}

function buildPreviews(files: File[]): PreviewItem[] {
  return files.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  }))
}

export const TicketMessageForm = ({
  onSubmit,
  disabled,
  loading,
  placeholder = "Напишите сообщение…",
}: Props) => {
  const [text, setText] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewsRef = useRef<PreviewItem[]>([])

  const revokePreviews = useCallback((items: PreviewItem[]) => {
    for (const p of items) {
      URL.revokeObjectURL(p.url)
    }
  }, [])

  useEffect(() => {
    previewsRef.current = previews
  }, [previews])

  useEffect(() => {
    return () => revokePreviews(previewsRef.current)
  }, [revokePreviews])

  const setFilesWithPreviews = (nextFiles: File[]) => {
    revokePreviews(previews)
    setFiles(nextFiles)
    setPreviews(buildPreviews(nextFiles))
  }

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return
    const next = [...files, ...Array.from(list)].slice(0, MAX_FILES)
    setFilesWithPreviews(next)
  }

  const removeFile = (index: number) => {
    const removed = previews[index]
    if (removed) URL.revokeObjectURL(removed.url)
    const nextFiles = files.filter((_, i) => i !== index)
    const nextPreviews = previews.filter((_, i) => i !== index)
    setFiles(nextFiles)
    setPreviews(nextPreviews)
  }

  const resetForm = () => {
    revokePreviews(previews)
    setText("")
    setFiles([])
    setPreviews([])
    if (inputRef.current) inputRef.current.value = ""
  }

  const canSend = (text.trim().length > 0 || files.length > 0) && !disabled && !loading

  const handleSend = async () => {
    if (!canSend) return
    const body = text.trim()
    const toSend = [...files]
    setError(null)
    try {
      await onSubmit(body, toSend)
      resetForm()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отправить сообщение")
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 bg-white pt-3 dark:border-slate-700 dark:bg-slate-900">
      <TicketLocalFilePreview items={previews} onRemove={removeFile} />

      <textarea
        className="min-h-20 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled || loading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void handleSend()
          }
        }}
      />

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<ImagePlus size={18} />}
            disabled={disabled || loading || files.length >= MAX_FILES}
            onClick={() => inputRef.current?.click()}
          >
            Фото / PDF
          </Button>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canSend}
          loading={loading}
          onClick={() => void handleSend()}
        >
          Отправить
        </Button>
      </div>
    </div>
  )
}
