import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ImagePlus, MessageSquare } from "lucide-react"

import { ApiError } from "@/shared/api/client"
import { useCreateTicket, useTicketByOrder } from "@/entities/ticket/api/useTickets"
import { TicketLocalFilePreview } from "@/features/tickets/ui/TicketAttachmentView"
import { useOrder } from "@/entities/order/api/useOrders"
import { routes } from "@/shared/config/routes"
import { useProfileRoutes } from "@/shared/hooks/useProfileRoutes"
import { Button } from "@/shared/ui/button/Button"
import { Card } from "@/shared/ui/card/Card"
import { PageHeader } from "@/shared/ui/page-header/PageHeader"
import { Spinner } from "@/shared/ui/spinner/Spinner"

const MAX_FILES = 5
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf"

export const CreateDisputePage = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const profileRoutes = useProfileRoutes()
  const orderId = params.get("orderId") ?? ""
  const { data: order, isLoading: orderLoading } = useOrder(orderId)
  const { data: existingTicket, isLoading: ticketLoading } = useTicketByOrder(orderId)
  const createTicket = useCreateTicket()
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const previewsRef = useRef(previews)

  const revokePreviews = useCallback((items: { url: string }[]) => {
    for (const p of items) URL.revokeObjectURL(p.url)
  }, [])

  useEffect(() => {
    previewsRef.current = previews
  }, [previews])

  useEffect(() => () => revokePreviews(previewsRef.current), [revokePreviews])

  const setFilesWithPreviews = (next: File[]) => {
    revokePreviews(previews)
    setFiles(next)
    setPreviews(next.map((file) => ({ file, url: URL.createObjectURL(file) })))
  }

  useEffect(() => {
    if (existingTicket?.id) {
      navigate(profileRoutes.dispute(existingTicket.id), { replace: true })
    }
  }, [existingTicket?.id, navigate, profileRoutes])

  if (orderLoading || ticketLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-4">
        <PageHeader title="Спор" backTo={routes.user.orders} />
        <Card>
          <p className="text-sm text-slate-600">Заказ не найден</p>
          <Link to={routes.user.orders} className="mt-2 text-sm font-semibold text-blue-700">
            К заказам
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4 p-4 pb-8"
      onSubmit={async (e) => {
        e.preventDefault()
        setFormError(null)
        const text = description.trim()
        if (text.length < 10) {
          setFormError("Описание — минимум 10 символов")
          return
        }
        if (!orderId) {
          setFormError("Заказ не указан")
          return
        }
        try {
          const ticket = await createTicket.mutateAsync({
            orderId,
            body: text,
            files: [...files],
          })
          revokePreviews(previews)
          setFiles([])
          setPreviews([])
          navigate(profileRoutes.dispute(ticket.id), { replace: true })
        } catch (err) {
          setFormError(
            err instanceof ApiError ? err.message : "Не удалось отправить спор",
          )
        }
      }}
    >
      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[95vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-medium text-white"
              onClick={() => setPreview(null)}
            >
              Закрыть
            </button>
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[85vh] max-w-[95vw] rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
      <PageHeader
        title="Открыть спор"
        backTo={routes.user.order(order.id)}
        subtitle={`Заказ № ${order.id.slice(0, 8)}`}
      />

      <Card>
        <label className="block text-sm font-semibold text-slate-900">
          Описание проблемы
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Опишите, что пошло не так…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
          />
        </label>
      </Card>

      <Card>
        <p className="mb-2 text-sm font-semibold text-slate-900">Вложения</p>
        <TicketLocalFilePreview
          items={previews}
          onRemove={(i) => {
            const removed = previews[i]
            if (removed) URL.revokeObjectURL(removed.url)
            setFiles((prev) => prev.filter((_, j) => j !== i))
            setPreviews((prev) => prev.filter((_, j) => j !== i))
          }}
          onPreviewImage={(url, name) => setPreview({ url, name })}
        />
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            const list = e.target.files
            if (!list?.length) return
            setFilesWithPreviews([...files, ...Array.from(list)].slice(0, MAX_FILES))
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="secondary"
          leftIcon={<ImagePlus size={18} />}
          disabled={files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
        >
          Прикрепить фото или PDF
        </Button>
        <p className="mt-2 text-xs text-slate-500">До {MAX_FILES} файлов, макс. 10 МБ каждый</p>
      </Card>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        fullWidth
        leftIcon={<MessageSquare size={18} />}
        loading={createTicket.isPending}
        disabled={createTicket.isPending}
      >
        {createTicket.isPending ? "Отправка..." : "Отправить спор"}
      </Button>
    </form>
  )
}
