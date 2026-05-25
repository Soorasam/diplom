import { useEffect } from "react"

import { useNetworkStore } from "@/features/offline/model/network-store"

export function useNetworkEffect() {
  const setOnline = useNetworkStore((s) => s.setOnline)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)

    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    setOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [setOnline])
}

