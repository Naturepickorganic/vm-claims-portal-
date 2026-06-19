/* ═══════════════════════════════════════════════════════════════════════
   policyApi.ts  →  src/lib/api/policyApi.ts
   Calls the proxy's Phase-1 policy endpoints (PolicyCenter live).
   ═══════════════════════════════════════════════════════════════════════ */
const PROXY =
  ((import.meta as any).env?.VITE_PROXY_URL as string) || 'http://localhost:3001'

export interface PolicyLookup {
  found:        boolean
  policyNumber: string
  pcId?:        string
  insured?:     string
  address?:     string
  product?:     string
  lob?:         string
  periodStart?: string
  periodEnd?:   string
  inForce?:     boolean | null
  message?:     string
}

export interface PolicyVehicle {
  id:        string
  year:      number | string
  make:      string
  model:     string
  vin:       string
  bodyType?: string
  state?:    string
  display:   string
}

export async function lookupPolicy(policyNumber: string, lossDate?: string): Promise<PolicyLookup> {
  const qs = new URLSearchParams({ policyNumber })
  if (lossDate) qs.set('lossDate', lossDate)
  const r = await fetch(`${PROXY}/api/policy/lookup?${qs.toString()}`)
  return r.json()
}

export async function getVehicles(pcId: string): Promise<{ count: number; vehicles: PolicyVehicle[] }> {
  const qs = new URLSearchParams({ pcId })
  const r = await fetch(`${PROXY}/api/policy/vehicles?${qs.toString()}`)
  return r.json()
}
