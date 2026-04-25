import type { FNOLSubmitResponse, ClaimStatusResponse, ClaimMilestone } from '@/lib/types'

/**
 * Demo Mode is ON when VITE_API_BASE_URL is not set.
 * All API calls return realistic mock data instead of hitting the backend.
 */
export const isMock = (): boolean =>
  !import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL as string).trim() === ''

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

/* ── FNOL Submit ──────────────────────────────────────────────── */
export async function mockSubmitFNOL(lob: 'auto' | 'home'): Promise<FNOLSubmitResponse> {
  await delay(2500)
  const year = new Date().getFullYear()
  const seq  = Math.floor(Math.random() * 90000 + 10000)
  const type = lob === 'home' ? 'HOME' : lob === 'commercial-auto' ? 'CAUTO' : 'AUTO'
  const gwId = `CLM-${year}-${type}-${seq}`

  const result: FNOLSubmitResponse = {
    claimId:   gwId,
    gwClaimId: gwId,
    adjuster: {
      name:  lob === 'home' ? 'Daniel Park'  : 'Rebecca Kim',
      phone: lob === 'home' ? '(214) 555-0193' : '(214) 555-0192',
      email: lob === 'home' ? 'daniel.park@vm.com' : 'rebecca.kim@vm.com',
    },
    estimatedResolution: lob === 'home' ? 'May 6–12' : 'April 28–30',
  }

  // Persist so the status page can read it
  sessionStorage.setItem(`vm_claim_${gwId}`, JSON.stringify({ lob, ...result }))
  return result
}

/* ── Claim Status ─────────────────────────────────────────────── */
export async function mockGetClaimStatus(claimId: string): Promise<ClaimStatusResponse> {
  await delay(400)

  const stored = sessionStorage.getItem(`vm_claim_${claimId}`)
  const lob: 'auto' | 'home' | 'commercial-auto' = stored ? JSON.parse(stored).lob : 'auto'

  const adjusterName  = lob === 'home' ? 'Daniel Park'    : 'Rebecca Kim'
  const adjusterPhone = lob === 'home' ? '(214) 555-0193' : '(214) 555-0192'

  const autoMilestones: ClaimMilestone[] = [
    { order:1, status:'done',   title:'Claim Filed',              date:'Today · 3:14 PM',         detail:'Claim created and confirmation sent to your email and phone.' },
    { order:2, status:'done',   title:'Adjuster Assigned',        date:'Today · 4:02 PM',         detail:`${adjusterName} assigned — Senior Auto Adjuster, Dallas Region.` },
    { order:3, status:'active', title:'Damage Inspection',        date:'In Progress',             detail:'Virtual photo review underway. On-site inspection scheduled tomorrow 9 AM.' },
    { order:4, status:'pending',title:'Repair Authorization',     date:'Expected: Tomorrow',      detail:'Repair shop will be authorized once inspection estimate is approved.' },
    { order:5, status:'pending',title:'Repairs In Progress',      date:'Expected: Next 4–5 days', detail:'AutoNation Collision will provide daily SMS updates during repairs.' },
    { order:6, status:'pending',title:'Quality Check & Release',  date:'Expected: 6 business days',detail:'Post-repair inspection then vehicle released to you.' },
    { order:7, status:'pending',title:'Settlement & Closure',     date:'Expected: 8 business days',detail:'Final payment processed. Subrogation team pursues other insurer for deductible recovery.' },
  ]

  const homeMilestones: ClaimMilestone[] = [
    { order:1, status:'done',   title:'Claim Filed',              date:'Today · 3:44 PM',             detail:'Claim created and confirmation sent.' },
    { order:2, status:'done',   title:'Property Adjuster Assigned',date:'Today · 4:08 PM',            detail:`${adjusterName} assigned — Senior Property Adjuster, DFW Region.` },
    { order:3, status:'active', title:'Damage Inspection',        date:'In Progress — Tomorrow 9 AM', detail:'Virtual photo review underway. NOAA confirms hail event. On-site inspection with DFW Elite Roofing tomorrow 9 AM.' },
    { order:4, status:'pending',title:'Repair Authorization',     date:'Expected: Day after tomorrow', detail:'Written authorization before any work begins.' },
    { order:5, status:'pending',title:'Repairs In Progress',      date:'Expected: Days 3–12',          detail:'DFW Elite Roofing starts work. Daily SMS updates.' },
    { order:6, status:'pending',title:'Quality Inspection',       date:'Expected: Day 12',             detail:'Adjuster confirms repairs meet code.' },
    { order:7, status:'pending',title:'Settlement & Payment',     date:'Expected: Day 14',             detail:'Final payment less deductible. Subrogation recovery from other insurer.' },
  ]

  return {
    claimId,
    gwClaimId:     claimId,
    lob,
    status:        'InspectionScheduled' as any,
    dateOfLoss:    new Date().toISOString().split('T')[0],
    dateFiled:     new Date().toISOString(),
    vehicleInfo:   lob === 'auto' ? '2021 Honda Accord EX-L' : undefined,
    propertyAddress: lob === 'home' ? '4821 Mockingbird Ln, Dallas TX' : undefined,
    adjusterName,
    adjusterPhone,
    estimatedRepair: lob === 'home' ? 21000 : 3200,
    deductible:    lob === 'home' ? 4250  : 500,
    policyNumber:  lob === 'home' ? 'VM-HOME-2024-33891' : 'VM-AUTO-2024-88421',
    milestones:    lob === 'home' ? homeMilestones : autoMilestones,
    messages:      [],
    documents:     [],
  }
}

/* ── Mock message reply ───────────────────────────────────────── */
export async function mockSendMessage(_text: string): Promise<void> {
  await delay(200)
}
