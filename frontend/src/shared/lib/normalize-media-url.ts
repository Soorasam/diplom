const COOP_MEDIA_PREFIX = /^\/coop-(products|tickets|driver-docs|receipts|procurement)\//

export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url?.trim()) return ""
  const trimmed = url.trim()
  if (COOP_MEDIA_PREFIX.test(trimmed)) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (COOP_MEDIA_PREFIX.test(parsed.pathname)) {
      return parsed.pathname
    }
  } catch {
    return trimmed
  }
  return trimmed
}

export function normalizeProductImageUrl(url: string | null | undefined): string {
  return normalizeMediaUrl(url)
}

const RECEIPTS_BUCKET = "coop-receipts"

export function resolveReceiptImageUrl(
  url: string | null | undefined,
  objectKey?: string | null,
): string {
  const normalized = normalizeMediaUrl(url)
  if (normalized && COOP_MEDIA_PREFIX.test(normalized)) return normalized
  if (objectKey?.trim()) {
    const key = objectKey.trim().replace(/^\//, "")
    return `/${RECEIPTS_BUCKET}/${key}`
  }
  return normalized
}

export function toAbsoluteMediaUrl(
  url: string | null | undefined,
  objectKey?: string | null,
): string {
  const path = resolveReceiptImageUrl(url, objectKey)
  if (!path) return ""
  if (/^https?:\/\//i.test(path)) return path
  if (typeof window === "undefined") return path
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`
}
