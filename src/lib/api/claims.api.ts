/* ═══════════════════════════════════════════════════════════════════════
   claims.api.ts  →  src/lib/api/claims.api.ts   (REPLACE existing file)

   Changes vs Sprint 2:
   1. baseURL now reads VITE_PROXY_URL (the same var the live tabs use) so the
      wizard hits the proxy → GW with your EXISTING .env.local. No new env var.
   2. submitFNOL accepts the enriched payload (form + lob + policyNumber).
   ═══════════════════════════════════════════════════════════════════════ */
import axios from 'axios'
import type { FNOLSubmitResponse, ClaimStatusResponse } from '@/lib/types'

const PROXY =
  (import.meta as any).env?.VITE_PROXY_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: PROXY,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20_000,   // GW create + submit can take a few seconds
})

export const claimsApi = {
  /* Accepts wizard form data plus { lob, policyNumber, reporter? } */
  submitFNOL: (data: Record<string, unknown>): Promise<FNOLSubmitResponse> =>
    api.post<FNOLSubmitResponse>('/api/v1/claims/fnol', data).then(r => r.data),

  getClaimStatus: (claimId: string): Promise<ClaimStatusResponse> =>
    api.get<ClaimStatusResponse>(`/api/v1/claims/${claimId}`).then(r => r.data),

  sendMessage: (claimId: string, text: string): Promise<void> =>
    api.post(`/api/v1/claims/${claimId}/messages`, { text }).then(() => undefined),
}
