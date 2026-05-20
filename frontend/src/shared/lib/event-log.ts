const PREFIX = "[coop:event]"

type EventPayload = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined

/** Лог событий для ручного тестирования — фильтр в DevTools: coop:event */
export function logEvent(name: string, payload?: EventPayload) {
  const time = new Date().toLocaleTimeString("ru-RU", { hour12: false })
  if (payload !== undefined) {
    console.log(`${PREFIX} ${time} ${name}`, payload)
  } else {
    console.log(`${PREFIX} ${time} ${name}`)
  }
}

export function logEventError(name: string, error: unknown, extra?: EventPayload) {
  const time = new Date().toLocaleTimeString("ru-RU", { hour12: false })
  console.error(`${PREFIX} ${time} ${name}`, error, extra ?? "")
}
