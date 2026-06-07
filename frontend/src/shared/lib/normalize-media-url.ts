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
