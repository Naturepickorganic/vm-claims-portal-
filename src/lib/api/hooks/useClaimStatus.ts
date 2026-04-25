import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isMock, mockGetClaimStatus, mockSendMessage } from '@/lib/mockApi'
import { claimsApi } from '@/lib/api/claims.api'
import type { ClaimStatusResponse } from '@/lib/types'

export function useClaimStatus(claimId: string) {
  return useQuery<ClaimStatusResponse, Error>({
    queryKey:        ['claim', claimId],
    queryFn:         () => isMock() ? mockGetClaimStatus(claimId) : claimsApi.getClaimStatus(claimId),
    refetchInterval: isMock() ? false : 30_000,
    enabled:         !!claimId,
    staleTime:       20_000,
  })
}

export function useSendMessage(claimId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (text: string) =>
      isMock() ? mockSendMessage(text) : claimsApi.sendMessage(claimId, text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['claim', claimId] }),
  })
}
