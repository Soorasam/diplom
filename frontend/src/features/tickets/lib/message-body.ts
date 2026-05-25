/** Текст-заглушка для старых сообщений только с вложениями */
const ATTACHMENT_ONLY_PLACEHOLDERS = new Set(["вложения", "attachments"])

export function shouldShowMessageBody(body: string, attachmentCount: number): boolean {
  const text = body.trim()
  if (!text) return false
  if (attachmentCount > 0 && ATTACHMENT_ONLY_PLACEHOLDERS.has(text.toLowerCase())) {
    return false
  }
  return true
}
