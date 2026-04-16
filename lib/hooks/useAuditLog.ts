"use client"

import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { api } from "@/lib/services/api/client"
import { API } from "@/lib/constants/api-routes"

interface AuditEntry {
  id: string
  timestamp: string
  action: string
  resource: string
  resourceId: string
  userId: string
  userName: string
  grupoId?: string
  details?: string
  ip?: string
}

interface AuditResponse {
  entries: AuditEntry[]
  total: number
  page: number
  limit: number
  pages: number
}

interface UseAuditLogOptions {
  page?: number
  limit?: number
  action?: string
  resource?: string
  enabled?: boolean
}

export function useAuditLog({ page = 1, limit = 30, action, resource, enabled = true }: UseAuditLogOptions = {}) {
  return useQuery<AuditResponse>({
    queryKey: ["audit-log", { page, limit, action, resource }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (action) params.set("action", action)
      if (resource) params.set("resource", resource)
      return api.get<AuditResponse>(`${API.audit}?${params}`)
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
