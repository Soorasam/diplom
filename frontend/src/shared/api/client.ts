import { delay } from "@/shared/lib/delay"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/** Обёртка fake API: задержка + единая обработка ошибок */
export async function apiCall<T>(
  fn: () => T | Promise<T>,
  ms = 350,
): Promise<T> {
  await delay(ms)
  return fn()
}
