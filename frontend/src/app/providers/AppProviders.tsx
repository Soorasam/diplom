import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useState } from "react"

import { useThemeEffect } from "@/features/ui/hooks/useThemeEffect"
import { useCartSync } from "@/features/cart/hooks/useCartSync"
import { OfflineSyncProvider } from "@/features/offline/ui/OfflineSyncProvider"
import { logEvent } from "@/shared/lib/event-log"

const ThemeSync = () => {
  useThemeEffect()
  return null
}

const CartSync = () => {
  useCartSync()
  return null
}

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [client] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onMutate: (_variables, mutation) => {
            const key = mutation.options.mutationKey?.join("/") ?? mutation.options.mutationFn?.name ?? "unknown"
            logEvent(`mutation:${key}`, _variables)
          },
          onSuccess: (_data, _variables, _context, mutation) => {
            const key = mutation.options.mutationKey?.join("/") ?? "unknown"
            logEvent(`mutation:ok:${key}`, _data)
          },
          onError: (error, _variables, _context, mutation) => {
            const key = mutation.options.mutationKey?.join("/") ?? "unknown"
            logEvent(`mutation:error:${key}`, { error: String(error) })
          },
        }),
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
      <CartSync />
      <OfflineSyncProvider />
      {children}
    </QueryClientProvider>
  )
}
