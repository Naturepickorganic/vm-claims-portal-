import type { FNOLSubmitResponse, ClaimStatusResponse, ClaimMilestone } from '@/lib/types'

export const isMock = (): boolean =>
  !import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL as string).trim() === ''

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function mockSubmitFNOL(lob: string): Promise<FNOLSubmitResponse> {
  await delay(2500)
  const year = new Date().getFullYear()
  const seq  = Math.floor(Math.random() * 90000 + 10000)
  const type = lob === 'home' ? 'HOME' : lob === 'commercial-auto' ? 'CAUTO' : 'AUTO'
  const gwId = `CLM-${year}-${type}-${seq}`

  const isCommercial = lob === 'commercial-auto'
  const result: FNOLSubmitResponse = {
    claimId:   gwId,
    gwClaimId: gwId,
    adjuster: {
      name:  isCommercial ? 'Marcus Chen'      : lob === 'home' ? 'Daniel Park'    : 'Rebecca Kim',
      phone: isCommercial ? '(214) 555-0199'   : lob === 'home' ? '(214) 555-0193' : '(214) 555-0192',
      email: isCommercial ? 'marcus.chen@vm.com': lob === 'home' ? 'daniel.park@vm.com' : 'rebecca.kim@vm.com',
    },
    estimatedResolution: isCommercial ? '14–30 days' : lob === 'home' ? 'May 6–12' : 'April 28–30',
  }

  sessionStorage.setItem(`vm_claim_${gwId}`, JSON.stringify({ lob, ...result }))
  return result
}

export async function mockGetClaimStatus(claimId: string): Promise<ClaimStatusResponse> {
  await delay(400)

  const stored = sessionStorage.getItem(`vm_claim_${claimId}`)
  const lob: string = stored ? JSON.parse(stored).lob : 'auto'

  const adjusterName  = lob === 'home' ? 'Daniel Park'    : lob === 'commercial-auto' ? 'Marcus Chen'      : 'Rebecca Kim'
  const adjusterPhone = lob === 'home' ? '(214) 555-0193' : lob === 'commercial-auto' ? '(214) 555-0199'   : '(214) 555-0192'

  const autoMilestones: ClaimMilestone[] = [
    { order:1, status:'done',   title:'Claim Filed',             date:'Today · 3:14 PM',         detail:'Claim created and confirmation sent to your email and phone.' },
    { order:2, status:'done',   title:'Adjuster Assigned',       date:'Today · 4:02 PM',         detail:`${adjusterName} assigned — Senior Auto Adjuster, Dallas Region.` },
    { order:3, status:'active', title:'Damage Inspection',       date:'In Progress',             detail:'Virtual photo review underway. On-site inspection scheduled tomorrow 9 AM.' },
    { order:4, status:'pending',title:'Repair Authorization',    date:'Expected: Tomorrow',      detail:'Repair shop authorized once inspection estimate is approved.' },
    { order:5, status:'pending',title:'Repairs In Progress',     date:'Expected: Next 4–5 days', detail:'AutoNation Collision will provide daily SMS updates during repairs.' },
    { order:6, status:'pending',title:'Quality Check & Release', date:'Expected: 6 business days',detail:'Post-repair inspection then vehicle released to you.' },
    { order:7, status:'pending',title:'Settlement & Closure',    date:'Expected: 8 business days',detail:'Final payment processed. Subrogation team pursues other insurer for deductible recovery.' },
  ]

  const homeMilestones: ClaimMilestone[] = [
    { order:1, status:'done',   title:'Claim Filed',               date:'Today · 3:44 PM',            detail:'Claim created and confirmation sent.' },
    { order:2, status:'done',   title:'Property Adjuster Assigned',date:'Today · 4:08 PM',            detail:`${adjusterName} assigned — Senior Property Adjuster, DFW Region.` },
    { order:3, status:'active', title:'Damage Inspection',         date:'In Progress — Tomorrow 9 AM',detail:'Virtual photo review underway. On-site inspection with DFW Elite Roofing tomorrow 9 AM.' },
    { order:4, status:'pending',title:'Repair Authorization',      date:'Expected: Day after tomorrow',detail:'Written authorization before any work begins.' },
    { order:5, status:'pending',title:'Repairs In Progress',       date:'Expected: Days 3–12',         detail:'DFW Elite Roofing starts work. Daily SMS updates.' },
    { order:6, status:'pending',title:'Quality Inspection',        date:'Expected: Day 12',            detail:'Adjuster confirms repairs meet code.' },
    { order:7, status:'pending',title:'Settlement & Payment',      date:'Expected: Day 14',            detail:'Final payment less deductible. Subrogation recovery from other insurer.' },
  ]

  const commercialMilestones: ClaimMilestone[] = [
    { order:1, status:'done',   title:'Claim Filed',                    date:'Today',              detail:'Commercial claim logged. FMCSA notification initiated. Confirmation sent to fleet manager.' },
    { order:2, status:'done',   title:'Commercial Adjuster Assigned',   date:'Today · 2 hours',    detail:`${adjusterName} assigned. ELD data and dashcam footage request sent to carrier.` },
    { order:3, status:'active', title:'Field Investigation',            date:'In Progress',        detail:'Adjuster conducting on-site inspection. Police report, ELD logs, and witness statements being collected.' },
    { order:4, status:'pending',title:'Liability Determination',        date:'Expected: 3–5 days', detail:'Investigation findings reviewed. Liability allocation established.' },
    { order:5, status:'pending',title:'Damage Assessment & Estimate',   date:'Expected: 3–7 days', detail:'Fleet shop provides written estimate. Total loss evaluation if applicable.' },
    { order:6, status:'pending',title:'Repair Authorization',           date:'Expected: 5–8 days', detail:'Written authorization issued to fleet repair partner.' },
    { order:7, status:'pending',title:'Repairs & Return to Service',    date:'Expected: 10–21 days',detail:'Repair timeline depends on parts and damage extent. Daily updates from repair facility.' },
    { order:8, status:'pending',title:'Settlement & Subrogation',       date:'Expected: 14–30 days',detail:'Final settlement processed. Subrogation team pursues at-fault parties.' },
  ]

  const milestones = lob === 'home' ? homeMilestones : lob === 'commercial-auto' ? commercialMilestones : autoMilestones

  return {
    claimId,
    gwClaimId:       claimId,
    lob:             lob as any,
    status:          'InspectionScheduled' as any,
    dateOfLoss:      new Date().toISOString().split('T')[0],
    dateFiled:       new Date().toISOString(),
    vehicleInfo:     lob === 'auto'             ? '2021 Honda Accord EX-L'      : lob === 'commercial-auto' ? 'Unit #1042 — 2022 Freightliner Cascadia' : undefined,
    propertyAddress: lob === 'home'             ? '4821 Mockingbird Ln, Dallas TX' : undefined,
    adjusterName,
    adjusterPhone,
    estimatedRepair: lob === 'home' ? 21000 : lob === 'commercial-auto' ? 85000 : 3200,
    deductible:      lob === 'home' ? 4250  : lob === 'commercial-auto' ? 10000 : 500,
    policyNumber:    lob === 'home' ? 'VM-HOME-2024-33891' : lob === 'commercial-auto' ? 'VM-CAUTO-2024-10042' : 'VM-AUTO-2024-88421',
    milestones,
    messages:  [],
    documents: [],
  }
}

export async function mockSendMessage(_text: string): Promise<void> {
  await delay(200)
}
