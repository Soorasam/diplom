import { useEffect } from "react"
import { create } from "zustand"

interface NetworkState {
  isOnline: boolean
  setOnline: (isOnline: boolean) => void
}

export const useNetworkStore = create<NetworkState>()((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  setOnline: (isOnline) => set({ isOnline }),
}))

export const useNetworkOnlineEffect = () => {
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
