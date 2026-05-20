import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useState } from "react"

import { useThemeEffect } from "@/features/ui/hooks/useThemeEffect"
import { OfflineSyncProvider } from "@/features/offline/ui/OfflineSyncProvider"

const ThemeSync = () => {
  useThemeEffect()
  return null
}

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <ThemeSync />
      <OfflineSyncProvider />
      {children}
    </QueryClientProvider>
  )
}
