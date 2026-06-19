/* ═══════════════════════════════════════════════════════════════════════
   useFNOL.ts  →  src/lib/api/hooks/useFNOL.ts   (REPLACE existing)

   FNOL submit goes LIVE when VITE_PROXY_URL is set (proxy → GW); otherwise
   it falls back to the mock claim. This gate is intentionally SEPARATE from
   isMock() so it does NOT switch the customer status/track pages live (the
   proxy has no /api/v1/claims/:id endpoint).
   ═══════════════════════════════════════════════════════════════════════ */
import { useMutation } from '@tanstack/react-query'
import { mockSubmitFNOL } from '@/lib/mockApi'
import { claimsApi } from '@/lib/api/claims.api'
import type { FNOLFormData, FNOLSubmitResponse } from '@/lib/types'

/* Live only when the proxy URL is configured */
const FNOL_LIVE =
  !!(((import.meta as any).env?.VITE_PROXY_URL || '') as string).trim()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFNOL() {
  return useMutation<FNOLSubmitResponse, Error, Record<string, unknown>>({
    mutationFn: async (data) => {
      const lob = (data.lob as 'auto' | 'home') ?? 'auto'
      if (!FNOL_LIVE) return mockSubmitFNOL(lob)
      return claimsApi.submitFNOL(data as unknown as FNOLFormData)
    },
  })
}
