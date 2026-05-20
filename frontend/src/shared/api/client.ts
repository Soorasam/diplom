import { clearTokens, getAccessToken } from "@/shared/api/auth-storage"

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
  const headers = new Headers(initHeaders)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (auth) {
    const token = getAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res))
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
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
}

/** Обёртка mock API (задержка) — для экранов, ещё не переведённых на бэкенд */
export async function apiCall<T>(fn: () => T | Promise<T>, ms = 350): Promise<T> {
  const { delay } = await import("@/shared/lib/delay")
  await delay(ms)
  return fn()
}

export const clearApiSession = () => clearTokens()
