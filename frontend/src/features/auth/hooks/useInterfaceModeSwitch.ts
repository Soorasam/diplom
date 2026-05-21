import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { homeRouteForRole, useAuthStore } from "@/app/model/auth-store"
import { ApiError } from "@/shared/api/client"

import type { InterfaceMode } from "./useCanUseDriverMode"

export const useInterfaceModeSwitch = (navigateOnSwitch = true) => {
  const navigate = useNavigate()
  const switchRole = useAuthStore((s) => s.switchRole)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setMode = async (mode: InterfaceMode) => {
    setError(null)
    setLoading(true)
    try {
      const nextRole = mode === "driver" ? "driver" : "client"
      await switchRole(nextRole)
      if (navigateOnSwitch) {
        navigate(homeRouteForRole(nextRole), { replace: true })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось переключить режим")
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, setMode }
}
