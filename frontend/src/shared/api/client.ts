import { clearTokens, getAccessToken } from "@/shared/api/auth-storage"
import { logEvent, logEventError } from "@/shared/lib/event-log"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) return body.message.join(", ")
    if (typeof body.message === "string") return body.message
  } catch {
    /* ignore */
  }
  return res.statusText || "Ошибка запроса"
}

type RequestOptions = RequestInit & { auth?: boolean }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, headers: initHeaders, ...init } = options
  const method = init.method ?? "GET"
  const headers = new Headers(initHeaders)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (auth) {
    const token = getAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  let bodyPreview: unknown
  if (init.body && typeof init.body === "string") {
    try {
      bodyPreview = JSON.parse(init.body)
    } catch {
      bodyPreview = init.body
    }
  }

  logEvent(`api:request ${method} ${path}`, { auth: Boolean(auth), body: bodyPreview })
  const started = performance.now()

  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, headers })

    if (!res.ok) {
      const message = await parseErrorMessage(res)
      logEventError(`api:error ${method} ${path}`, message, {
        status: res.status,
        ms: Math.round(performance.now() - started),
      })
      throw new ApiError(res.status, message)
    }

    if (res.status === 204) {
      logEvent(`api:ok ${method} ${path}`, {
        status: 204,
        ms: Math.round(performance.now() - started),
      })
      return undefined as T
    }

    const data = (await res.json()) as T
    logEvent(`api:ok ${method} ${path}`, {
      status: res.status,
      ms: Math.round(performance.now() - started),
      data,
    })
    return data
  } catch (err) {
    if (!(err instanceof ApiError)) {
      logEventError(`api:network ${method} ${path}`, err, {
        ms: Math.round(performance.now() - started),
      })
    }
    throw err
  }
}

/** Реальный HTTP-клиент к NestJS API */
export const http = {
  get: <T>(path: string, auth = false) => request<T>(path, { auth }),

  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      auth,
    }),

  patch: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      auth,
    }),

  delete: <T>(path: string, auth = false) => request<T>(path, { method: "DELETE", auth }),

  upload: <T>(path: string, file: File, auth = true) => {
    const form = new FormData()
    form.append("file", file)
    const headers = new Headers()
    if (auth) {
      const token = getAccessToken()
      if (token) headers.set("Authorization", `Bearer ${token}`)
    }
    logEvent(`api:upload POST ${path}`, { name: file.name, size: file.size })
    return fetch(`${API_URL}${path}`, { method: "POST", body: form, headers }).then(
      async (res) => {
        if (!res.ok) {
          const message = await parseErrorMessage(res)
          throw new ApiError(res.status, message)
        }
        return res.json() as Promise<T>
      },
    )
  },
}

/** Обёртка mock API (задержка) — для экранов, ещё не переведённых на бэкенд */
export async function apiCall<T>(fn: () => T | Promise<T>, ms = 350): Promise<T> {
  logEvent("mock:apiCall", { delayMs: ms })
  const { delay } = await import("@/shared/lib/delay")
  await delay(ms)
  const result = await fn()
  logEvent("mock:apiCall:done", { delayMs: ms })
  return result
}

export const clearApiSession = () => clearTokens()
