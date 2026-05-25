export function normalizeProductImageUrl(url: string | null | undefined): string {
  if (!url?.trim()) return ""
  const trimmed = url.trim()
  if (trimmed.startsWith("/coop-products/")) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.pathname.startsWith("/coop-products/")) {
      return parsed.pathname
    }
  } catch {
    return trimmed
  }
  return trimmed
}
