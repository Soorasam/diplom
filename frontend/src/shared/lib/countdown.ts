export const EMERGENCY_CLOSE_MS = 5 * 60 * 1000

export function emergencyCloseDurationLabel(ms = EMERGENCY_CLOSE_MS): string {
  if (ms >= 60_000) {
    const min = Math.round(ms / 60_000)
    return `${min} мин.`
  }
  const sec = Math.round(ms / 1000)
  return `${sec} сек.`
}

export const pad2 = (n: number) => String(n).padStart(2, "0")

export const formatCountdownMs = (ms: number): string => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSec / 60)
  const seconds = totalSec % 60
  return `${minutes}:${pad2(seconds)}`
}

export const getRemainingMs = (targetIso: string | null | undefined): number | null => {
  if (!targetIso) return null
  const target = new Date(targetIso).getTime()
  if (Number.isNaN(target)) return null
  return target - Date.now()
}
