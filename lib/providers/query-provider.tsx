"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale after 2 minutes — balances freshness vs network usage
            staleTime: 2 * 60 * 1000,
            // Cache for 5 minutes after component unmount
            gcTime: 5 * 60 * 1000,
            // Don't refetch on window focus by default (dashboard manages its own sync)
            refetchOnWindowFocus: false,
            // Retry once on failure
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
