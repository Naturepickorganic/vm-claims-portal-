import axios from 'axios'
import type { FNOLFormData, FNOLSubmitResponse, ClaimStatusResponse } from '@/lib/types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

export const claimsApi = {
  submitFNOL: (data: FNOLFormData): Promise<FNOLSubmitResponse> =>
    api.post<FNOLSubmitResponse>('/api/v1/claims/fnol', data).then(r => r.data),

  getClaimStatus: (claimId: string): Promise<ClaimStatusResponse> =>
    api.get<ClaimStatusResponse>(`/api/v1/claims/${claimId}`).then(r => r.data),

  sendMessage: (claimId: string, text: string): Promise<void> =>
    api.post(`/api/v1/claims/${claimId}/messages`, { text }),
}
