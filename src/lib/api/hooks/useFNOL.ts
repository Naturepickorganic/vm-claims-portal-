import { useMutation } from '@tanstack/react-query'
import { isMock, mockSubmitFNOL } from '@/lib/mockApi'
import { claimsApi } from '@/lib/api/claims.api'
import type { FNOLFormData, FNOLSubmitResponse } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFNOL() {
  return useMutation<FNOLSubmitResponse, Error, Record<string, unknown>>({
    mutationFn: async (data) => {
      const lob = (data.lob as 'auto' | 'home') ?? 'auto'
      if (isMock()) return mockSubmitFNOL(lob)
      return claimsApi.submitFNOL(data as unknown as FNOLFormData)
    },
  })
}
