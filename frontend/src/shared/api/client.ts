import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/shared/api/auth-storage"
import type { AuthResponse } from "@/shared/api/backend-types"

const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "/api/v1" : "http://localhost:3000/api/v1")

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
  } catch {}
  return res.statusText || "Ошибка запроса"
}

let refreshPromise: Promise<string | null> | null = null
let authBootstrap: Promise<boolean> | null = null

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number }
    return typeof payload.exp === "number" ? payload.exp : null
  } catch {
    return null
  }
}

function isAccessTokenExpired(token: string, skewSeconds = 30): boolean {
  const exp = decodeJwtExp(token)
  if (!exp) return true
  return exp * 1000 <= Date.now() + skewSeconds * 1000
}

export function resetAuthSession() {
  refreshPromise = null
  authBootstrap = null
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          clearTokens()
          resetAuthSession()
          return null
        }
        if (!res.ok) {
          return null
        }
        const data = (await res.json()) as AuthResponse
        saveTokens(data.access_token, data.refresh_token)
        return data.access_token
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function ensureValidAccessToken(): Promise<boolean> {
  const access = getAccessToken()
  if (access && !isAccessTokenExpired(access)) return true
  const token = await refreshAccessToken()
  return Boolean(token)
}

export async function waitForAuthReady(): Promise<boolean> {
  if (!getAccessToken() && !getRefreshToken()) return false
  if (!authBootstrap) {
    authBootstrap = ensureValidAccessToken().then((ok) => {
      if (!ok) authBootstrap = null
      return ok
    })
  }
  return authBootstrap
}

type RequestOptions = RequestInit & { auth?: boolean; _retried?: boolean }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, headers: initHeaders, _retried, ...init } = options
  const headers = new Headers(initHeaders)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (auth) {
    await waitForAuthReady()
    const token = getAccessToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (res.status === 401 && auth && !_retried) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return request<T>(path, { ...options, _retried: true })
    }
    clearTokens()
    resetAuthSession()
    throw new ApiError(401, "Сессия истекла")
  }

  if (!res.ok) {
    const message = await parseErrorMessage(res)
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return (await res.json()) as T
}

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

  fetchBlob: async (path: string, auth = true) => {
    await waitForAuthReady()
    const headers = new Headers()
    if (auth) {
      const token = getAccessToken()
      if (token) headers.set("Authorization", `Bearer ${token}`)
    }
    const res = await fetch(`${API_URL}${path}`, { headers, cache: "no-store" })
    if (!res.ok) {
      const message = await parseErrorMessage(res)
      throw new ApiError(res.status, message)
    }
    return res.blob()
  },

  upload: <T>(path: string, file: File, auth = true) => {
    const form = new FormData()
    form.append("file", file)
    return http.postForm<T>(path, form, auth)
  },

  postForm: <T>(path: string, form: FormData, auth = true) => {
    const headers = new Headers()
    if (auth) {
      const token = getAccessToken()
      if (token) headers.set("Authorization", `Bearer ${token}`)
    }
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

export const clearApiSession = () => {
  clearTokens()
  resetAuthSession()
}
