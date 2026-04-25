import { useMutation } from '@tanstack/react-query'
import { isMock, mockSubmitFNOL } from '@/lib/mockApi'
import { claimsApi } from '@/lib/api/claims.api'
import type { FNOLFormData, FNOLSubmitResponse } from '@/lib/types'

interface FNOLPayload extends Partial<FNOLFormData> {
  lob?: 'auto' | 'home'
}

export function useFNOL() {
  return useMutation<FNOLSubmitResponse, Error, FNOLPayload>({
    mutationFn: async (data) => {
      if (isMock()) {
        return mockSubmitFNOL(data.lob ?? 'auto')
      }
      return claimsApi.submitFNOL(data as FNOLFormData)
    },
  })
}
