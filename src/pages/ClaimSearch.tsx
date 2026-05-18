import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, AlertCircle, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ArrowUpDown
} from 'lucide-react'
import VMlogo from '@/components/ui/VMlogo'
import { useAuth } from '@/lib/authContext'

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA — Replace with Guidewire API calls when ready
   🔌 Base URL: GET /api/v1/claims/{claimNumber}
   🔌 Base URL: GET /api/v1/policies/{policyNumber}/claims
   ═══════════════════════════════════════════════════════════════ */

const C = {
  navy: '#024099', blue: '#0254CC', bluePale: '#EBF3FF', blueBorder: '#BFDBFE',
  green: '#2EB124', greenLight: '#EDFAEB', greenBorder: '#A8E4A2',
  border: '#E2E8F2', bg: '#F5F8FF', white: '#FFFFFF',
  text: '#1A2744', mid: '#4A5568', muted: '#718096', faint: '#A0AEC0',
  tblHead: '#1B3A6B', rowAlt: '#F5F8FF',
  orange: '#E65100', purple: '#6A1B9A',
}

/* ── Tracker steps ─────────────────────────────────────────── */
const TRACKER_STEPS = ['Filed','Adjuster\nAssigned','Inspection\nComplete','Estimate\nApproved','Rental\nActive','Repair\nIn Progress','Payment','Closed']

/* ── Timeline event types ──────────────────────────────────── */
type EvtCategory = 'General' | 'Repair' | 'Rental' | 'Payment' | 'Inspection'

interface TimelineEvent {
  id:       number
  category: EvtCategory
  title:    string
  sub:      string
  date:     string
  status:   'done' | 'active' | 'upcoming'
  badge:    string
}

/* ── Full claim data shape ─────────────────────────────────── */
interface ClaimData {
  claimNumber:   string   // 🔌 GW: claim.claimNumber
  insuredName:   string   // 🔌 GW: claim.insured.displayName
  policyNumber:  string   // 🔌 GW: claim.policy.policyNumber
  claimStatus:   string   // 🔌 GW: claim.state
  adjusterName:  string   // 🔌 GW: claim.assignedUser.displayName
  adjusterPhone: string   // 🔌 GW: claim.assignedUser.phoneNumber
  reporterName:  string   // 🔌 GW: claim.reporter.displayName
  reportedType:  string   // 🔌 GW: claim.reportedByType
  reportedDate:  string   // 🔌 GW: claim.reportedDate
  vehicle:       string   // 🔌 GW: claim.vehicle.displayName
  dateOfLoss:    string   // 🔌 GW: claim.dateOfLoss
  lossType:      string   // 🔌 GW: claim.lossType
  repairShop:    string   // 🔌 CCC Secure Share: shop.name
  rentalInfo:    string   // 🔌 Enterprise ARMS: reservation.summary
  activeStep:    number   // 🔌 Derived from claim state + vendor events (1–8)
  progressPct:   number   // 🔌 Derived: (activeStep / 8) * 100
  statusMsg:     string   // 🔌 AI/rules engine: customer-facing status summary
  notes:         { adjuster:string; date:string; message:string }[]  // 🔌 GW: GET /claim/{id}/notes
  payments:      { checkNumber:string; payTo:string; grossAmount:number; issueDate:string; scheduledSendDate:string; status:string }[]  // 🔌 GW: GET /claim/{id}/checks
  timeline:      TimelineEvent[]  // 🔌 Aggregated: GW + CCC + ARMS + HiMarley events
}

/* ── Policy claim list item ────────────────────────────────── */
interface PolicyClaim {
  claimNumber:  string  // 🔌 GW: claim.claimNumber
  insuredName:  string  // 🔌 GW: claim.insured.displayName
  adjusterName: string  // 🔌 GW: claim.assignedUser.displayName
  status:       string  // 🔌 GW: claim.state
  createdDate:  string  // 🔌 GW: claim.createTime
  vehicle:      string  // 🔌 GW: claim.vehicle.displayName
  lossType:     string  // 🔌 GW: claim.lossType
}

/* ─────────────────────────────────────────────────────────────
   MOCK CLAIMS DATABASE
   3 sample claims covering different stages for demo
   ───────────────────────────────────────────────────────────── */
const MOCK_CLAIMS: Record<string, ClaimData> = {

  /* Claim 1 — Active repair, rental running */
  '000-00-000480': {
    claimNumber:'000-00-000480', insuredName:'Rosario Marinello',
    policyNumber:'7407354463', claimStatus:'Open',
    adjusterName:'Emily Rodriguez', adjusterPhone:'(214) 555-0142',
    reporterName:'Rosario Marinello', reportedType:'Self / Insured',
    reportedDate:'2024-09-15', vehicle:'2022 Honda CR-V EX-L',
    dateOfLoss:'2024-09-15', lossType:'Collision — Rear End',
    repairShop:'Caliber Collision — Dallas (4821 Mockingbird Ln)',
    rentalInfo:'Enterprise #ENT-88421 · 2022 Toyota Camry · 9 days remaining',
    activeStep:6, progressPct:68,
    statusMsg:"Body work underway at Caliber Collision. Parts arrived May 19. Your Enterprise rental is active — 9 days remaining. We'll notify you immediately when your vehicle passes quality inspection.",
    notes:[
      { adjuster:'Emily Rodriguez', date:'May 16, 2025', message:'Supplement approved — additional damage found behind rear bumper. Revised total $8,267.' },
      { adjuster:'Emily Rodriguez', date:'Sep 15, 2024', message:'Claim opened. Adjuster assigned. Inspection scheduled at Caliber Collision.' },
    ],
    payments:[
      { checkNumber:'', payTo:'Rosario Marinello', grossAmount:88,  issueDate:'2025-09-02', scheduledSendDate:'',           status:'Notifying'  },
      { checkNumber:'', payTo:'Caliber Collision',  grossAmount:6847,issueDate:'',           scheduledSendDate:'2025-05-30', status:'Requesting' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'Claim #000-00-000480 Received',               sub:'Confirmation sent to rosario@email.com and (214) 555-0181. Claim created in our system.',                                                     date:'Sep 15, 2024 · 9:14 AM',  status:'done',     badge:'✓ Filed'         },
      { id:2,  category:'General',    title:'Emily Rodriguez Assigned to Your Claim',       sub:'Emily Rodriguez (Property — Team B) is your adjuster. Direct line: (214) 555-0142.',                                                           date:'Sep 15, 2024 · 11:30 AM', status:'done',     badge:'✓ Complete'      },
      { id:3,  category:'Inspection', title:'Inspection Appointment Booked',                sub:'Drop-off: May 14, 10:00 AM · Caliber Collision, 4821 Mockingbird Ln, Dallas TX.',                                                              date:'May 13, 2025',            status:'done',     badge:'✓ Complete'      },
      { id:4,  category:'Inspection', title:'Vehicle Received at Caliber Collision',        sub:'Vehicle checked in at 10:22 AM. Inspection underway.',                                                                                          date:'May 14, 2025 · 10:22 AM', status:'done',     badge:'✓ Complete'      },
      { id:5,  category:'Inspection', title:'Estimate Completed — $6,847',                  sub:'Parts: $3,210 · Labor (18.5 hrs): $2,490 · Paint: $1,147. Full estimate in Documents tab.',                                                    date:'May 14, 2025',            status:'done',     badge:'✓ Complete'      },
      { id:6,  category:'Inspection', title:'Estimate Approved — Repairs Authorized',       sub:'Approved by Emily Rodriguez. Caliber Collision notified. Repairs begin May 16.',                                                                date:'May 15, 2025',            status:'done',     badge:'✓ Approved'      },
      { id:7,  category:'Rental',     title:'Enterprise Rental Reserved & Active',          sub:'Confirmation #ENT-88421 · 2022 Toyota Camry · Pickup: 2424 Commerce St, Dallas. Fully covered — no cost to you.',                             date:'May 14, 2025 — Ongoing',  status:'active',   badge:'● Active'        },
      { id:8,  category:'Repair',     title:'Hidden Damage Found — Supplement $1,420 Approved', sub:'Additional damage behind bumper identified during teardown. Your deductible is unchanged. Revised total: $8,267. New ETA: May 28.',       date:'May 17, 2025',            status:'done',     badge:'✓ Approved'      },
      { id:9,  category:'Repair',     title:'Parts Arrived — Body Work Began',              sub:'Replacement bumper and quarter panel received. Body repair work started immediately at Caliber Collision.',                                     date:'May 19, 2025',            status:'done',     badge:'✓ Complete'      },
      { id:10, category:'Repair',     title:'Body Work Complete — Entering Paint & Refinish', sub:'Your vehicle is moving to the paint booth. This phase typically takes 2–3 days. Next update when paint is complete.',                       date:'Today · May 21, 2025',    status:'active',   badge:'● In Progress'   },
      { id:11, category:'Repair',     title:'Quality Inspection & Vehicle Ready',            sub:"We'll notify you immediately when your vehicle passes QC and is ready for pickup. Deductible of $500 due at pickup to Caliber Collision.",    date:'Est. May 28, 2025',       status:'upcoming', badge:'Upcoming'        },
      { id:12, category:'Rental',     title:'Rental Return',                                 sub:'Return your Enterprise vehicle at Caliber or any Enterprise location by May 28. Fully covered — no charges to you.',                          date:'Est. May 28, 2025',       status:'upcoming', badge:'Upcoming'        },
      { id:13, category:'Payment',    title:'Payment Processing',                            sub:'Balance of $7,767 paid directly to Caliber Collision after repairs complete. Your portion: $500 deductible at pickup.',                       date:'After repairs complete',  status:'upcoming', badge:'Upcoming'        },
      { id:14, category:'General',    title:'Claim Closed',                                  sub:'Full summary of repairs, payments, and rental sent by email after closure. You can reopen within 30 days if issues arise.',                   date:'Est. ~May 30, 2025',      status:'upcoming', badge:'Upcoming'        },
    ],
  },

  /* Claim 2 — Hail damage, estimate stage */
  '000-00-000521': {
    claimNumber:'000-00-000521', insuredName:'Marcus T. Williams',
    policyNumber:'8812047291', claimStatus:'Open',
    adjusterName:'Scott Henson', adjusterPhone:'(214) 555-0188',
    reporterName:'Marcus T. Williams', reportedType:'Self / Insured',
    reportedDate:'2025-04-10', vehicle:'2021 Ford F-150 XLT 4WD',
    dateOfLoss:'2025-04-10', lossType:'Comprehensive — Hail / Weather',
    repairShop:'Joe Myers Ford Collision — Houston',
    rentalInfo:'Enterprise reservation pending — authorized up to 21 days',
    activeStep:3, progressPct:30,
    statusMsg:"Your vehicle inspection is scheduled for May 23 at Joe Myers Ford Collision. An estimate will be prepared during the inspection. Your rental reservation is approved and ready when you need it.",
    notes:[
      { adjuster:'Scott Henson', date:'Apr 11, 2025', message:'Large hail event confirmed Apr 10 in Houston metro. Inspection scheduled. Comprehensive coverage confirmed.' },
    ],
    payments:[],
    timeline:[
      { id:1,  category:'General',    title:'Claim #000-00-000521 Received',               sub:'Hail damage reported. Claim opened. Confirmation sent to marcus.williams@email.com.',                                                          date:'Apr 10, 2025 · 6:42 PM',  status:'done',     badge:'✓ Filed'      },
      { id:2,  category:'General',    title:'Scott Henson Assigned to Your Claim',         sub:'Scott Henson (Hail — Team A) is your adjuster. Direct line: (214) 555-0188.',                                                                  date:'Apr 11, 2025 · 9:00 AM',  status:'done',     badge:'✓ Complete'   },
      { id:3,  category:'Inspection', title:'Inspection Scheduled — May 23',               sub:'Drop-off: May 23, 8:30 AM · Joe Myers Ford Collision, 13602 Northwest Fwy, Houston TX.',                                                       date:'May 23, 2025',            status:'active',   badge:'● Scheduled'  },
      { id:4,  category:'Rental',     title:'Rental Authorized — Ready When You Need It',  sub:'Enterprise reservation approved. Pickup available at time of drop-off at Joe Myers. Up to 21 days covered.',                                   date:'Pending inspection',       status:'upcoming', badge:'Authorized'   },
      { id:5,  category:'Inspection', title:'Estimate & Approval',                         sub:'Estimate will be prepared during inspection. Your adjuster will review and authorize repairs.',                                                  date:'Est. May 23–24, 2025',    status:'upcoming', badge:'Upcoming'     },
      { id:6,  category:'Repair',     title:'Repairs Begin',                               sub:'Paintless dent repair (PDR) for hail damage. Timeline depends on extent of damage — typically 5–10 business days.',                            date:'Est. late May 2025',       status:'upcoming', badge:'Upcoming'     },
      { id:7,  category:'Repair',     title:'Vehicle Ready for Pickup',                    sub:"We'll notify you when repairs are complete and your truck passes quality inspection.",                                                           date:'Est. early Jun 2025',      status:'upcoming', badge:'Upcoming'     },
      { id:8,  category:'Payment',    title:'Payment & Claim Closure',                     sub:'No deductible applies for comprehensive hail claims under your current policy. Payment direct to shop.',                                        date:'After repairs complete',   status:'upcoming', badge:'Upcoming'     },
    ],
  },

  /* Claim 3 — Theft, fully closed */
  '000-00-000612': {
    claimNumber:'000-00-000612', insuredName:'Jennifer K. Okafor',
    policyNumber:'5503819042', claimStatus:'Closed',
    adjusterName:'Linda Park', adjusterPhone:'(214) 555-0166',
    reporterName:'Jennifer K. Okafor', reportedType:'Self / Insured',
    reportedDate:'2025-01-08', vehicle:'2020 Toyota Camry SE',
    dateOfLoss:'2025-01-07', lossType:'Comprehensive — Vehicle Theft',
    repairShop:'N/A — Total Loss',
    rentalInfo:'Enterprise — Rental closed Jan 28. 20 days covered.',
    activeStep:8, progressPct:100,
    statusMsg:"Your claim is closed. A total loss settlement of $24,800 was issued on Jan 29, 2025. We hope to assist you again in the future.",
    notes:[
      { adjuster:'Linda Park', date:'Jan 22, 2025', message:'Vehicle declared total loss. ACV established at $24,800. Settlement letter sent via email and mail.' },
      { adjuster:'Linda Park', date:'Jan 08, 2025', message:'Theft reported. Police report #DPD-2025-00812 filed. Rental approved.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-4421', payTo:'Jennifer K. Okafor', grossAmount:24300, issueDate:'2025-01-29', scheduledSendDate:'', status:'Cleared'  },
      { checkNumber:'CHK-2025-3812', payTo:'Bank of America (Lienholder)', grossAmount:500, issueDate:'2025-01-29', scheduledSendDate:'', status:'Cleared' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'Claim #000-00-000612 Received — Vehicle Theft',  sub:'Theft reported. Confirmation sent to jennifer.okafor@email.com. Police report #DPD-2025-00812 noted.',                            date:'Jan 08, 2025 · 7:15 AM',  status:'done', badge:'✓ Filed'     },
      { id:2,  category:'General',    title:'Linda Park Assigned to Your Claim',             sub:'Linda Park (Total Loss — Team C) is your adjuster. Direct line: (214) 555-0166.',                                                  date:'Jan 08, 2025 · 10:00 AM', status:'done', badge:'✓ Complete'  },
      { id:3,  category:'Rental',     title:'Rental Vehicle Reserved — Active',              sub:'Enterprise #ENT-44129 · 2021 Honda Accord · Fully covered while claim is open.',                                                  date:'Jan 08, 2025',            status:'done', badge:'✓ Complete'  },
      { id:4,  category:'Inspection', title:'Vehicle Valuation Completed',                   sub:'Actual Cash Value (ACV) established at $24,800 based on market data, condition, mileage (41,200), and comparable sales.',         date:'Jan 15, 2025',            status:'done', badge:'✓ Complete'  },
      { id:5,  category:'Inspection', title:'Total Loss Declared',                           sub:'Repair cost would exceed ACV. Vehicle declared total loss. Settlement offer of $24,800 issued. Title transfer initiated.',         date:'Jan 18, 2025',            status:'done', badge:'✓ Declared'  },
      { id:6,  category:'Inspection', title:'Settlement Accepted',                           sub:'You accepted the settlement of $24,800. Signed title received. Lien release obtained from Bank of America.',                      date:'Jan 22, 2025',            status:'done', badge:'✓ Accepted'  },
      { id:7,  category:'Payment',    title:'Settlement Payment Issued — $24,800',           sub:'ACH payment of $24,300 to your account (4421) and $500 to Bank of America lienholder. Cleared Jan 31.',                         date:'Jan 29, 2025',            status:'done', badge:'✓ Cleared'   },
      { id:8,  category:'Rental',     title:'Rental Closed — 20 Days Covered',              sub:'Enterprise rental closed Jan 28. 20 days fully covered, no charges to you. Rental billing summary in Documents.',                date:'Jan 28, 2025',            status:'done', badge:'✓ Closed'    },
      { id:9,  category:'General',    title:'Claim Closed',                                  sub:'Claim closed Jan 30, 2025. Full summary sent to jennifer.okafor@email.com. You may reopen within 30 days if issues arise.',     date:'Jan 30, 2025',            status:'done', badge:'✓ Closed'    },
    ],
  },
}

/* ─────────────────────────────────────────────────────────────
   MOCK POLICIES — 3 sample policies with multiple claims each
   🔌 Replace with: GET /api/v1/policies/{policyNumber}/claims
   ───────────────────────────────────────────────────────────── */
const MOCK_POLICIES: Record<string, PolicyClaim[]> = {
  '7407354463': [
    { claimNumber:'000-00-000480', insuredName:'Rosario Marinello',     adjusterName:'Emily Rodriguez', status:'Open',   createdDate:'2024-09-15', vehicle:'2022 Honda CR-V EX-L',    lossType:'Collision'       },
    { claimNumber:'000-00-000312', insuredName:'Rosario Marinello',     adjusterName:'Scott Henson',    status:'Closed', createdDate:'2023-06-22', vehicle:'2022 Honda CR-V EX-L',    lossType:'Hail / Weather'  },
    { claimNumber:'000-00-000201', insuredName:'Rosario Marinello',     adjusterName:'Linda Park',      status:'Closed', createdDate:'2022-11-04', vehicle:'2019 Honda Civic LX',     lossType:'Glass / Chip'    },
  ],
  '8812047291': [
    { claimNumber:'000-00-000521', insuredName:'Marcus T. Williams',    adjusterName:'Scott Henson',    status:'Open',   createdDate:'2025-04-10', vehicle:'2021 Ford F-150 XLT 4WD', lossType:'Hail / Weather'  },
    { claimNumber:'000-00-000398', insuredName:'Marcus T. Williams',    adjusterName:'Jonah Egertson',  status:'Closed', createdDate:'2024-03-15', vehicle:'2021 Ford F-150 XLT 4WD', lossType:'Collision'       },
  ],
  '5503819042': [
    { claimNumber:'000-00-000612', insuredName:'Jennifer K. Okafor',    adjusterName:'Linda Park',      status:'Closed', createdDate:'2025-01-08', vehicle:'2020 Toyota Camry SE',    lossType:'Vehicle Theft'   },
  ],
  // Additional policy with many claims for pagination demo
  '9901234567': Array.from({ length:25 }, (_, i) => ({
    claimNumber:  `000-00-00${6000 + i}`,
    insuredName:  ['David Chen','David Chen','Sarah Chen'][i % 3],
    adjusterName: ['Emily Rodriguez','Scott Henson','Linda Park','Jonah Egertson','Spencer Dunn'][i % 5],
    status:       i < 3 ? 'Open' : 'Closed',
    createdDate:  `2025-${String(Math.floor(i / 5) + 1).padStart(2,'0')}-${String((i % 28) + 1).padStart(2,'0')}`,
    vehicle:      ['2023 Tesla Model 3','2022 BMW X5','2021 Audi A4'][i % 3],
    lossType:     ['Collision','Hail','Glass','Theft','Collision'][i % 5],
  })),
}

/* ─────────────────────────────────────────────────────────────
   DEMO SEARCH HINTS
   ───────────────────────────────────────────────────────────── */
const DEMO_CLAIMS = [
  { num:'000-00-000480', label:'Honda CR-V — Repair In Progress + Rental Active' },
  { num:'000-00-000521', label:'Ford F-150 — Hail Damage, Inspection Scheduled'  },
  { num:'000-00-000612', label:'Toyota Camry — Total Loss, Closed'                },
]
const DEMO_POLICIES = [
  { num:'7407354463', label:'Rosario Marinello — 3 claims'      },
  { num:'8812047291', label:'Marcus T. Williams — 2 claims'     },
  { num:'5503819042', label:'Jennifer K. Okafor — 1 claim'      },
  { num:'9901234567', label:'David Chen — 25 claims (pagination demo)' },
]

/* ═══════════════════════════════════════════════════════════════
   PAGINATION COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function Pagination({ total, page, pageSize, pageSizeOpts, onPage, onPageSize }: {
  total:number; page:number; pageSize:number; pageSizeOpts:number[]
  onPage:(p:number)=>void; onPageSize:(s:number)=>void
}) {
  const totalPages = Math.ceil(total / pageSize)
  const from = (page-1)*pageSize + 1
  const to   = Math.min(page*pageSize, total)

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({length:totalPages},(_,i)=>i+1)
    if (page <= 4) return [1,2,3,4,5,'...',totalPages]
    if (page >= totalPages-3) return [1,'...',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
    return [1,'...',page-1,page,page+1,'...',totalPages]
  },[page,totalPages])

  const btn = (disabled:boolean, onClick:()=>void, children:React.ReactNode) => (
    <button onClick={onClick} disabled={disabled} style={{
      border:`1px solid ${C.border}`, borderRadius:6, width:30, height:30,
      display:'flex', alignItems:'center', justifyContent:'center',
      background: disabled ? C.bg : C.white, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .4 : 1
    }}>{children}</button>
  )

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderTop:`1px solid ${C.border}`, flexWrap:'wrap', gap:8, background:C.white }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <select value={pageSize} onChange={e=>{onPageSize(Number(e.target.value));onPage(1)}}
          style={{ fontSize:12, border:`1px solid ${C.border}`, borderRadius:6, padding:'3px 8px', color:C.text }}>
          {pageSizeOpts.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:12, color:C.muted }}>per page · Showing <strong>{from}–{to}</strong> of <strong>{total}</strong></span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
        {btn(page===1, ()=>onPage(1), <ChevronsLeft size={13} color={C.muted} />)}
        {btn(page===1, ()=>onPage(page-1), <ChevronLeft size={13} color={C.muted} />)}
        {pages.map((p,i)=>(
          <button key={i} onClick={()=>typeof p==='number'&&onPage(p)} disabled={p==='...'}
            style={{ border:`1px solid ${p===page?C.navy:C.border}`, borderRadius:6, minWidth:30, height:30,
              padding:'0 6px', fontSize:12, fontWeight:p===page?700:400,
              background:p===page?C.navy:C.white, color:p===page?C.white:p==='...'?C.faint:C.text,
              cursor:p==='...'?'default':'pointer' }}>
            {p}
          </button>
        ))}
        {btn(page===totalPages||totalPages===0, ()=>onPage(page+1), <ChevronRight size={13} color={C.muted} />)}
        {btn(page===totalPages||totalPages===0, ()=>onPage(totalPages), <ChevronsRight size={13} color={C.muted} />)}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DOMINO PROGRESS TRACKER
   ═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   STATUS CARD COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function StatusCard({ claim, isClosed }: { claim: ClaimData; isClosed: boolean }) {
  const isAmber  = false // 🔌 set true when action needed from GW/vendor data
  const bg       = isClosed
    ? 'linear-gradient(135deg,#1A2744 0%,#1E3A6B 60%,#24488A 100%)'
    : isAmber
    ? 'linear-gradient(135deg,#7C3A00 0%,#B85A00 60%,#D97706 100%)'
    : 'linear-gradient(135deg,#0A5C2E 0%,#1B8A4B 60%,#25A85C 100%)'
  const icon     = isClosed ? '🎉' : isAmber ? '⚡' : '✓'
  const title    = isClosed
    ? 'Claim fully resolved'
    : isAmber
    ? 'Action needed — please review'
    : "You're on track — no action needed"
  const etaLabel = isClosed ? 'Claim closed' : 'Est. completion May 28'

  const circles = [
    { w:120, h:120, top:-40,        bottom:'auto', right:120 },
    { w:80,  h:80,  top:'auto',     bottom:-30,    right:60  },
    { w:60,  h:60,  top:-20,        bottom:'auto', right:20  },
  ]

  return (
    <div style={{ background:bg, borderRadius:12, padding:'14px 18px', marginBottom:12,
      position:'relative', overflow:'hidden', display:'flex', alignItems:'center', gap:16,
      boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
      {circles.map((c,i) => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%',
          background:'rgba(255,255,255,.07)', width:c.w, height:c.h,
          top:c.top as number, bottom:c.bottom as number, right:c.right, pointerEvents:'none' }} />
      ))}
      <div style={{ width:50, height:50, borderRadius:'50%', flexShrink:0, zIndex:1,
        background:'rgba(255,255,255,.15)', border:'2px solid rgba(255,255,255,.3)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
        {icon}
      </div>
      <div style={{ flex:1, zIndex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.85)', lineHeight:1.55 }}>{claim.statusMsg}</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, zIndex:1, flexShrink:0 }}>
        <div style={{ background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)',
          borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:700, color:'#fff', whiteSpace:'nowrap' }}>
          {etaLabel}
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:22, fontWeight:800, color:'rgba(255,255,255,.95)', lineHeight:1 }}>{claim.progressPct}%</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.6)', marginTop:2 }}>Complete</div>
        </div>
      </div>
    </div>
  )
}

function ClaimTracker({ claim }: { claim: ClaimData }) {
  const isOpen   = claim.claimStatus === 'Open'
  const isClosed = claim.claimStatus === 'Closed'
  const pct      = claim.progressPct

  return (
    <div style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'14px 20px 12px' }}>
      {/* Status card — gradient banner */}
      <StatusCard claim={claim} isClosed={isClosed} />

      <div style={{ fontSize:10, fontWeight:700, color:C.faint, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
        Claim Progress
      </div>

      {/* Step labels */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:2, marginBottom:7 }}>
        {TRACKER_STEPS.map((s,i) => {
          const stepNum = i+1
          const isDone  = stepNum < claim.activeStep || isClosed
          const isAct   = stepNum === claim.activeStep && !isClosed
          return (
            <div key={s} style={{ textAlign:'center', fontSize:10, fontWeight:600, lineHeight:1.3,
              color: isDone||isClosed ? '#1B5E20' : isAct ? C.navy : C.faint }}>
              {s.split('\n').map((ln,j)=><div key={j}>{ln}</div>)}
            </div>
          )
        })}
      </div>

      {/* THE DOMINO BAR */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:2, height:38, borderRadius:7, overflow:'hidden', background:'#E8EDF2' }}>
        {TRACKER_STEPS.map((_,i) => {
          const stepNum = i+1
          const isDone  = stepNum < claim.activeStep || isClosed
          const isAct   = stepNum === claim.activeStep && !isClosed
          return (
            <div key={i} style={{
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative', overflow:'hidden', borderRadius:3,
              background: isDone||isClosed ? C.green : isAct ? C.navy : '#DDE3EA',
              animation: isAct ? 'pulse-seg 2s ease-out infinite' : 'none',
            }}>
              {(isDone||isClosed) && <span style={{ fontSize:13, fontWeight:700, color:C.white, position:'relative', zIndex:2 }}>✓</span>}
              {isAct && (
                <>
                  <span style={{ fontSize:9, color:C.white, letterSpacing:2, position:'relative', zIndex:2 }}>● ● ●</span>
                  <div style={{ position:'absolute', top:0, left:0, width:'45%', height:'100%', zIndex:1,
                    background:'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)',
                    animation:'shimmer 1.7s ease-in-out infinite' }} />
                </>
              )}
              {!isDone && !isAct && !isClosed && <span style={{ fontSize:12, fontWeight:600, color:'#B0BEC5' }}>{stepNum}</span>}
            </div>
          )
        })}
      </div>

      {/* Thin fill bar */}
      <div style={{ height:3, background:'#E2E8F2', borderRadius:3, marginTop:5, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${C.green},${C.navy})`, borderRadius:3, position:'relative', overflow:'hidden', transition:'width 1s ease' }}>
          <div style={{ position:'absolute', top:0, right:0, width:'35%', height:'100%',
            background:'linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent)',
            animation: isClosed ? 'none' : 'shine 1.8s ease-in-out infinite' }} />
        </div>
      </div>
      <div style={{ fontSize:10, color:C.faint, textAlign:'center', marginTop:4 }}>
        {isClosed ? 'Claim fully resolved' : 'Tap any step to view details'}
      </div>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-150%)} 100%{transform:translateX(250%)} }
        @keyframes shine   { 0%{transform:translateX(-100%)} 100%{transform:translateX(300%)} }
        @keyframes pulse-seg { 0%{box-shadow:0 0 0 0 rgba(2,64,153,.5)} 70%{box-shadow:0 0 0 6px rgba(2,64,153,0)} 100%{box-shadow:0 0 0 0 rgba(2,64,153,0)} }
      `}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CLAIM DETAIL — Info / Payments / Contacts / Services tabs
   ═══════════════════════════════════════════════════════════════ */
function ClaimDetail({ claim }: { claim: ClaimData }) {
  const [activeTab, setActiveTab] = useState<'info'|'payments'|'contacts'|'services'>('info')
  const [tabView,   setTabView]   = useState(true)
  const [noteQ,     setNoteQ]     = useState('')
  const [payQ,      setPayQ]      = useState('')
  const [tlFilter,  setTlFilter]  = useState<string>('All Events')
  const [tlSort,    setTlSort]    = useState<'latest'|'oldest'>('latest')
  const [payPage,   setPayPage]   = useState(1)
  const [paySize,   setPaySize]   = useState(10)

  const TBL_HEAD = { background: C.tblHead }

  /* Timeline filtering + sorting */
  const tlCategories: EvtCategory[] = ['General','Repair','Rental','Payment','Inspection']
  const filteredTl = claim.timeline
    .filter(e => tlFilter === 'All Events' || e.category === tlFilter)
    .sort((a,b) => tlSort === 'latest' ? b.id - a.id : a.id - b.id)

  const completedTl = filteredTl.filter(e => e.status !== 'upcoming')
  const upcomingTl  = filteredTl.filter(e => e.status === 'upcoming')
  const orderedTl   = tlSort === 'latest' ? [...completedTl, ...upcomingTl] : [...upcomingTl, ...completedTl]

  const dotColor = (s: TimelineEvent['status']) =>
    s === 'done' ? C.green : s === 'active' ? C.navy : 'transparent'
  const badgeStyle = (s: TimelineEvent['status']): React.CSSProperties => ({
    display:'inline-flex', fontSize:9.5, fontWeight:700, padding:'1px 7px', borderRadius:10, marginTop:3,
    background: s==='done'?C.greenLight : s==='active'?C.bluePale : '#F5F5F5',
    color:       s==='done'?'#1B5E20'   : s==='active'?C.navy      : '#9E9E9E',
    border: `1px solid ${s==='done'?C.greenBorder : s==='active'?C.blueBorder : '#E0E0E0'}`,
  })
  const catColor = (c: EvtCategory) =>
    c==='Repair'?C.orange : c==='Rental'?C.purple : c==='Payment'?C.blue : c==='Inspection'?C.green : C.text

  /* Payments */
  const filtPay  = claim.payments.filter(p =>
    [p.payTo, p.status, String(p.grossAmount)].some(v => v.toLowerCase().includes(payQ.toLowerCase())))
  const pagedPay = filtPay.slice((payPage-1)*paySize, payPage*paySize)

  const FIELD = (label:string, value:string, api:string) => (
    <div key={label} style={{ display:'grid', gridTemplateColumns:'130px 1fr', padding:'7px 0',
      borderBottom:`1px solid ${C.bg}` }} title={api}>
      <span style={{ fontSize:11.5, color:C.faint, fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:11.5, color:C.text, fontWeight:600 }}>
        {label==='Claim Status'
          ? <span style={{ color: claim.claimStatus==='Open'?C.green:claim.claimStatus==='Closed'?C.muted:'#E65100', fontWeight:700 }}>{value}</span>
          : value || '—'}
      </span>
    </div>
  )

  const InfoTab = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', height:480, overflow:'hidden' }}>

      {/* LEFT — fields + notes (scrollable) */}
      <div style={{ borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ overflowY:'auto', flex:1, padding:'14px 16px' }}>
          {FIELD('Insured Name',  claim.insuredName,  '🔌 GW: claim.insured.displayName')}
          {FIELD('Policy Number', claim.policyNumber, '🔌 GW: claim.policy.policyNumber')}
          {FIELD('Claim Status',  claim.claimStatus,  '🔌 GW: claim.state')}
          {FIELD('Adjuster',      claim.adjusterName, '🔌 GW: claim.assignedUser.displayName')}
          {FIELD('Adjuster Phone',claim.adjusterPhone,'🔌 GW: claim.assignedUser.phoneNumber')}
          {FIELD('Reporter',      claim.reporterName, '🔌 GW: claim.reporter.displayName')}
          {FIELD('Reported Type', claim.reportedType, '🔌 GW: claim.reportedByType')}
          {FIELD('Reported Date', claim.reportedDate, '🔌 GW: claim.reportedDate')}
          {FIELD('Vehicle',       claim.vehicle,      '🔌 GW: claim.vehicle.displayName')}
          {FIELD('Date of Loss',  claim.dateOfLoss,   '🔌 GW: claim.dateOfLoss')}
          {FIELD('Loss Type',     claim.lossType,     '🔌 GW: claim.lossType')}
          {FIELD('Repair Shop',   claim.repairShop,   '🔌 CCC Secure Share: shop.name')}
          {FIELD('Rental',        claim.rentalInfo,   '🔌 Enterprise ARMS: reservation.summary')}

          {/* Notes */}
          <div style={{ fontSize:11, fontWeight:700, color:C.text, textTransform:'uppercase',
            letterSpacing:'.04em', margin:'14px 0 6px', display:'flex', alignItems:'center', gap:5 }}>
            📝 Notes
          </div>
          <div style={{ background:C.tblHead, borderRadius:'5px 5px 0 0', padding:'6px 10px', display:'flex', alignItems:'center', gap:5 }}>
            <Search size={13} color="rgba(255,255,255,.6)" />
            <input value={noteQ} onChange={e=>setNoteQ(e.target.value)} placeholder="Search notes..."
              style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:11.5, flex:1 } as any} />
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${C.border}`, borderTop:'none', fontSize:11.5 }}>
            <thead style={TBL_HEAD}>
              <tr>{['Adjuster','Date','Message'].map(h=><th key={h} style={{ padding:'6px 9px', textAlign:'left', color:C.white, fontWeight:600, fontSize:11 }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {claim.notes.filter(n=>!noteQ||n.message.toLowerCase().includes(noteQ.toLowerCase())).map((n,i)=>(
                <tr key={i} style={{ background:i%2?C.rowAlt:C.white }}>
                  <td style={{ padding:'6px 9px', color:C.text }}>{n.adjuster}</td>
                  <td style={{ padding:'6px 9px', color:C.text, whiteSpace:'nowrap' }}>{n.date}</td>
                  <td style={{ padding:'6px 9px', color:C.text }}>{n.message}</td>
                </tr>
              ))}
              {claim.notes.length===0&&<tr><td colSpan={3} style={{ padding:16, textAlign:'center', color:C.faint, fontSize:12 }}>No notes</td></tr>}
            </tbody>
          </table>
          <div style={{ fontSize:10, color:'#C0CAD8', marginTop:4 }}>🔌 GW: GET /claim/{claim.claimNumber}/notes</div>
        </div>
      </div>

      {/* RIGHT — Timeline (fixed header, scrollable body) */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Sticky controls */}
        <div style={{ padding:'12px 14px 10px', borderBottom:`1px solid ${C.border}`, flexShrink:0, background:C.white }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:13, fontWeight:700, color:C.text }}>〜 Claim Timeline</span>
            <span style={{ fontSize:10.5, color:C.faint }}>{claim.timeline.length} events</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            {/* Filter */}
            <span style={{ fontSize:11, color:C.muted, fontWeight:500 }}>Filter:</span>
            <select value={tlFilter} onChange={e=>setTlFilter(e.target.value)}
              style={{ fontSize:11.5, border:`1px solid ${C.border}`, borderRadius:6, padding:'3px 8px', color:C.text, background:C.white, cursor:'pointer' }}>
              <option>All Events</option>
              {tlCategories.map(c=><option key={c}>{c}</option>)}
            </select>
            {/* Sort */}
            <span style={{ fontSize:11, color:C.muted, fontWeight:500, marginLeft:4 }}>Sort:</span>
            <div style={{ display:'flex', border:`1px solid ${C.border}`, borderRadius:6, overflow:'hidden' }}>
              {(['latest','oldest'] as const).map(s=>(
                <button key={s} onClick={()=>setTlSort(s)}
                  style={{ fontSize:11, fontWeight:600, padding:'4px 10px', border:'none', cursor:'pointer',
                    background: tlSort===s ? C.navy : C.white, color: tlSort===s ? C.white : C.muted,
                    display:'flex', alignItems:'center', gap:3, whiteSpace:'nowrap' }}>
                  <ArrowUpDown size={10} />
                  {s==='latest' ? '↓ Latest first' : '↑ Oldest first'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable events */}
        <div style={{ overflowY:'auto', flex:1, padding:'8px 14px' }}>
          {orderedTl.map((evt, i) => {
            const isActive = evt.status === 'active'
            const isPend   = evt.status === 'upcoming'
            const nextEvt  = orderedTl[i+1]
            const showDiv  = !isPend && nextEvt?.status === 'upcoming' && tlSort === 'latest'
            return (
              <div key={evt.id}>
                <div style={{ display:'flex', gap:8, padding:'9px 0', borderBottom: i<orderedTl.length-1 ? `1px solid ${C.bg}` : 'none' }}>
                  {/* Dot + line */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:14, flexShrink:0 }}>
                    <div style={{ width:9, height:9, borderRadius:'50%', marginTop:4, flexShrink:0,
                      background: dotColor(evt.status),
                      border: isPend ? '2px solid #4A8FD4' : 'none',
                      boxShadow: isActive ? `0 0 0 3px rgba(2,64,153,.2)` : 'none' }} />
                    {i < orderedTl.length-1 && (
                      <div style={{ width:2, flex:1, marginTop:3,
                        background: evt.status==='done' ? C.green
                          : isActive ? `linear-gradient(${C.navy},#93C5FD)`
                          : isPend   ? 'repeating-linear-gradient(to bottom,#93C5FD 0,#93C5FD 4px,transparent 4px,transparent 8px)'
                          : '#DDE3EA' }} />
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex:1,
                    ...(isActive ? { background:C.bluePale, borderRadius:7, padding:'8px 10px', margin:'-2px -4px' } : {}),
                    ...(isPend  ? { background:'#F8FBFF', borderRadius:7, padding:'6px 8px', margin:'-2px -4px', borderLeft:'3px solid #93C5FD' } : {}),
                  }}>
                    <div style={{ fontSize:9.5, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.05em',
                      color: isPend ? '#2563EB' : catColor(evt.category), marginBottom:1 }}>
                      {evt.category}{isPend ? ' · Upcoming' : ''}
                    </div>
                    <div style={{ fontSize:12, fontWeight:600,
                      color: isActive?C.navy : isPend?'#1E40AF':C.text, lineHeight:1.3, marginBottom:1 }}>
                      {evt.title}
                    </div>
                    <div style={{ fontSize:11, color: isActive?C.blue : isPend?'#3B5998':C.mid, lineHeight:1.4 }}>
                      {evt.sub}
                    </div>
                    <div style={{ fontSize:10, color: isActive?'#6B8EC7' : isPend?'#60A5FA':C.faint, marginTop:2 }}>{evt.date}</div>
                    <span style={badgeStyle(evt.status)}>{isPend ? '⏳ Scheduled' : evt.badge}</span>
                  </div>
                </div>
                {showDiv && (
                  <div style={{ textAlign:'center', padding:'6px 0', fontSize:10, fontWeight:600,
                    color:C.faint, letterSpacing:'.06em', textTransform:'uppercase',
                    borderTop:`1px dashed ${C.border}`, margin:'2px 0' }}>Upcoming</div>
                )}
              </div>
            )
          })}
          {orderedTl.length===0&&<div style={{ textAlign:'center', padding:24, fontSize:12, color:C.faint }}>No events match filter.</div>}
          <div style={{ fontSize:10, color:'#C0CAD8', marginTop:6, paddingBottom:4 }}>
            🔌 GW + CCC + ARMS + HiMarley: aggregated claim events
          </div>
        </div>
      </div>
    </div>
  )

  const PaymentsTab = () => (
    <div style={{ border:`1px solid ${C.border}`, borderTop:'none', background:C.white }}>
      <div style={{ background:C.tblHead, padding:'8px 12px', display:'flex', alignItems:'center', gap:6 }}>
        <Search size={14} color="rgba(255,255,255,.6)" />
        <input value={payQ} onChange={e=>{setPayQ(e.target.value);setPayPage(1)}} placeholder="Search payments..."
          style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:12, flex:1 } as any} />
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
          <thead style={TBL_HEAD}>
            <tr>{['Check Number','Pay To','Gross Amount','Issue Date','Scheduled Send Date','Status'].map(h=>(
              <th key={h} style={{ padding:'9px 12px', textAlign:'left', color:C.white, fontWeight:600, fontSize:12, borderRight:`1px solid rgba(255,255,255,.1)`, whiteSpace:'nowrap' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {pagedPay.length===0
              ? <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:C.faint }}>No payments found</td></tr>
              : pagedPay.map((p,i)=>(
                <tr key={i} style={{ background:i%2?C.rowAlt:C.white }}>
                  <td style={{ padding:'8px 12px', color:C.text }}>{p.checkNumber||'—'}</td>
                  <td style={{ padding:'8px 12px', color:C.blue, fontWeight:500 }}>{p.payTo}</td>
                  <td style={{ padding:'8px 12px', color:C.text, fontWeight:600 }}>${p.grossAmount.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                  <td style={{ padding:'8px 12px', color:C.text }}>{p.issueDate||'—'}</td>
                  <td style={{ padding:'8px 12px', color:C.text }}>{p.scheduledSendDate||'—'}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:12,
                      background: p.status==='Cleared'?C.greenLight:p.status==='Notifying'?C.bluePale:'#FFF3E0',
                      color:      p.status==='Cleared'?'#1B5E20':p.status==='Notifying'?C.navy:'#E65100',
                      border:`1px solid ${p.status==='Cleared'?C.greenBorder:p.status==='Notifying'?C.blueBorder:'#FFCC80'}` }}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
      <Pagination total={filtPay.length} page={payPage} pageSize={paySize} pageSizeOpts={[5,10,25]} onPage={setPayPage} onPageSize={setPaySize} />
      <div style={{ fontSize:10, color:'#C0CAD8', padding:'4px 14px 8px' }}>🔌 GW: GET /claim/{claim.claimNumber}/checks</div>
    </div>
  )

  const EmptyTable = ({ cols, api }: { cols:string[]; api:string }) => (
    <div style={{ border:`1px solid ${C.border}`, borderTop:'none', background:C.white }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
        <thead style={TBL_HEAD}>
          <tr>{cols.map(h=><th key={h} style={{ padding:'9px 12px', textAlign:'left', color:C.white, fontWeight:600, fontSize:12 }}>{h}</th>)}</tr>
        </thead>
        <tbody><tr><td colSpan={cols.length} style={{ padding:24, textAlign:'center', color:C.faint }}>No rows found</td></tr></tbody>
      </table>
      <div style={{ padding:'6px 14px 8px', borderTop:`1px solid ${C.border}` }}>
        <div style={{ fontSize:10, color:'#C0CAD8' }}>{api}</div>
      </div>
    </div>
  )

  const TABS = [
    { id:'info'     as const, label:'Info'     },
    { id:'payments' as const, label:'Payments' },
    { id:'contacts' as const, label:'Contacts' },
    { id:'services' as const, label:'Services' },
  ]

  const renderContent = (t: typeof activeTab) => {
    if (t==='info')     return tabView ? <InfoTab /> : <div style={{ padding:20, color:C.muted, fontSize:13 }}>Scroll view — Info</div>
    if (t==='payments') return <PaymentsTab />
    if (t==='contacts') return <EmptyTable cols={['Name','Created Date','Phone','Email']} api={`🔌 GW: GET /claim/${claim.claimNumber}/contacts`} />
    return <EmptyTable cols={['Service Number','Service Type','Expected Completion']} api={`🔌 GW: GET /claim/${claim.claimNumber}/services`} />
  }

  return (
    <div style={{ marginTop:16 }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:0,
        background:C.white, border:`1px solid ${C.border}`, borderRadius:'8px 8px 0 0', padding:'10px 16px', borderBottom:'none' }}>
        <h2 style={{ fontSize:17, fontWeight:700, color:C.text }}>Claim {claim.claimNumber} Details</h2>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:C.muted }}>Show Tab View</span>
          <div onClick={()=>setTabView(v=>!v)} style={{ width:40, height:22, borderRadius:11,
            background:tabView?C.navy:'#CBD5E0', cursor:'pointer', position:'relative', transition:'background .2s' }}>
            <div style={{ position:'absolute', top:2, left:tabView?20:2, width:18, height:18,
              borderRadius:'50%', background:C.white, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', background:C.white, border:`1px solid ${C.border}`, borderTop:'none', borderBottom:'none' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)}
            style={{ padding:'9px 16px', fontSize:12.5, fontWeight:600, background:'transparent', border:'none',
              borderBottom:`2px solid ${activeTab===t.id?C.navy:'transparent'}`,
              color:activeTab===t.id?C.navy:C.muted, cursor:'pointer', transition:'color .15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {renderContent(activeTab)}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POLICY CLAIMS LIST
   ═══════════════════════════════════════════════════════════════ */
function PolicyList({ policyNum, onSelect }: { policyNum:string; onSelect:(c:PolicyClaim)=>void }) {
  const [q, setQ]         = useState('')
  const [sort, setSort]   = useState({ col:'claimNumber', dir:'asc' as 'asc'|'desc' })
  const [page, setPage]   = useState(1)
  const [size, setSize]   = useState(10)

  const claims = MOCK_POLICIES[policyNum] || []
  const filtered = claims.filter(c =>
    [c.claimNumber,c.insuredName,c.adjusterName,c.status,c.vehicle,c.lossType].some(v=>v.toLowerCase().includes(q.toLowerCase())))
  const sorted = [...filtered].sort((a:any,b:any)=>{
    const av=a[sort.col]??'',bv=b[sort.col]??''
    return sort.dir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av))
  })
  const paged = sorted.slice((page-1)*size, page*size)
  const SortTH = ({ label, col }: { label:string; col:string }) => (
    <th onClick={()=>setSort(s=>({col,dir:s.col===col&&s.dir==='asc'?'desc':'asc'}))}
      style={{ padding:'9px 12px', textAlign:'left', fontSize:12, fontWeight:600, color:C.white,
        cursor:'pointer', userSelect:'none', borderRight:`1px solid rgba(255,255,255,.1)`, whiteSpace:'nowrap' }}>
      {label} {sort.col===col?(sort.dir==='asc'?'↑':'↓'):''}
    </th>
  )

  return (
    <div style={{ marginTop:16 }}>
      <h2 style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:10 }}>
        Claims for Policy: {policyNum}
        <span style={{ fontSize:10, color:'#C0CAD8', marginLeft:10 }}>🔌 GW: GET /api/v1/policies/{policyNum}/claims</span>
      </h2>
      <div style={{ background:C.tblHead, borderRadius:'6px 6px 0 0', padding:'8px 12px', display:'flex', alignItems:'center', gap:6 }}>
        <Search size={14} color="rgba(255,255,255,.6)" />
        <input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search claims..."
          style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:12, flex:1 } as any} />
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
          <thead style={{ background:C.tblHead }}>
            <tr>
              <SortTH label="Claim Number"  col="claimNumber"  />
              <SortTH label="Insured Name"  col="insuredName"  />
              <SortTH label="Vehicle"       col="vehicle"      />
              <SortTH label="Loss Type"     col="lossType"     />
              <SortTH label="Adjuster"      col="adjusterName" />
              <SortTH label="Status"        col="status"       />
              <SortTH label="Created Date"  col="createdDate"  />
            </tr>
          </thead>
          <tbody>
            {paged.map((c,i)=>(
              <tr key={i} onClick={()=>onSelect(c)} style={{ background:i%2?C.rowAlt:C.white, cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='#DBEAFE'}
                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=i%2?C.rowAlt:C.white}>
                <td style={{ padding:'8px 12px', color:C.blue, fontWeight:700 }}>{c.claimNumber}</td>
                <td style={{ padding:'8px 12px', color:C.text }}>{c.insuredName}</td>
                <td style={{ padding:'8px 12px', color:C.text }}>{c.vehicle}</td>
                <td style={{ padding:'8px 12px', color:C.text }}>{c.lossType}</td>
                <td style={{ padding:'8px 12px', color:C.text }}>{c.adjusterName}</td>
                <td style={{ padding:'8px 12px' }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:12,
                    background:c.status==='Open'?C.greenLight:'#F5F5F5',
                    color:c.status==='Open'?'#1B5E20':'#718096',
                    border:`1px solid ${c.status==='Open'?C.greenBorder:'#E0E0E0'}` }}>{c.status}</span>
                </td>
                <td style={{ padding:'8px 12px', color:C.text }}>{c.createdDate}</td>
              </tr>
            ))}
            {paged.length===0&&<tr><td colSpan={7} style={{ padding:24, textAlign:'center', color:C.faint }}>No claims found</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination total={filtered.length} page={page} pageSize={size} pageSizeOpts={[10,25,50]} onPage={setPage} onPageSize={setSize} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ClaimSearch() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTab,   setSearchTab]   = useState<'claim'|'policy'>('claim')
  const [claimInput,  setClaimInput]  = useState('')
  const [policyInput, setPolicyInput] = useState('')
  const [error,       setError]       = useState('')
  const [foundClaim,  setFoundClaim]  = useState<ClaimData|null>(null)
  const [policyNum,   setPolicyNum]   = useState('')
  const [showPolicy,  setShowPolicy]  = useState(false)
  const [selClaim,    setSelClaim]    = useState<ClaimData|null>(null)

  const reset = () => { setFoundClaim(null); setShowPolicy(false); setSelClaim(null); setError('') }

  const searchClaim = () => {
    setError(''); reset()
    const c = MOCK_CLAIMS[claimInput.trim()]
    if (c) setFoundClaim(c)
    else if (claimInput.trim()) setError(`Claim "${claimInput}" not found. Try: 000-00-000480, 000-00-000521, or 000-00-000612`)
    else setError('Please enter a claim number.')
  }

  const searchPolicy = () => {
    setError(''); reset()
    if (!policyInput.trim()) { setError('Please enter a policy number.'); return }
    if (MOCK_POLICIES[policyInput.trim()]) { setPolicyNum(policyInput.trim()); setShowPolicy(true) }
    else setError(`Policy "${policyInput}" not found. Try: 7407354463, 8812047291, 5503819042, or 9901234567`)
  }

  const handlePolicyClaimSelect = (c: PolicyClaim) => {
    const full = MOCK_CLAIMS[c.claimNumber]
    if (full) { setSelClaim(full); setShowPolicy(false) }
    else {
      // Build a basic claim from policy list data when full mock not available
      setSelClaim({
        claimNumber: c.claimNumber, insuredName: c.insuredName, policyNumber: policyInput,
        claimStatus: c.status, adjusterName: c.adjusterName, adjusterPhone: '—',
        reporterName: c.insuredName, reportedType: 'Self / Insured', reportedDate: c.createdDate,
        vehicle: c.vehicle, dateOfLoss: c.createdDate, lossType: c.lossType,
        repairShop: '—', rentalInfo: '—', activeStep: c.status==='Closed'?8:3,
        progressPct: c.status==='Closed'?100:30,
        statusMsg: c.status==='Closed' ? 'This claim is closed.' : 'Your claim is in progress. Contact your adjuster for details.',
        notes:[], payments:[], timeline:[],
      })
      setShowPolicy(false)
    }
  }

  const clearAll = () => { reset(); setClaimInput(''); setPolicyInput('') }

  const S = {
    page:    { minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif' } as React.CSSProperties,
    nav:     { background:C.navy, height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', boxShadow:'0 2px 10px rgba(2,64,153,.3)' } as React.CSSProperties,
    wrap:    { maxWidth:1200, margin:'0 auto', padding:'28px 20px' } as React.CSSProperties,
    card:    { background:C.white, border:`1px solid ${C.border}`, borderRadius:10, padding:'20px 24px', marginBottom:20 } as React.CSSProperties,
    input:   { fontSize:13, border:`1px solid ${C.border}`, borderRadius:6, padding:'6px 10px', color:C.text, outline:'none', width:200 } as React.CSSProperties,
    btnPrimary: { fontSize:13, fontWeight:600, background:C.navy, color:C.white, border:'none', borderRadius:6, padding:'7px 18px', cursor:'pointer' } as React.CSSProperties,
    btnGhost:   { fontSize:13, fontWeight:500, background:C.white, color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 14px', cursor:'pointer' } as React.CSSProperties,
    tabBtn: (on:boolean) => ({ padding:'9px 18px', fontSize:13.5, fontWeight:600, background:'transparent', border:'none',
      borderBottom:`2px solid ${on?C.navy:'transparent'}`, color:on?C.navy:C.muted, cursor:'pointer', marginBottom:-1 } as React.CSSProperties),
    error:   { display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'#DC2626', marginTop:6 } as React.CSSProperties,
  }

  return (
    <div style={S.page}>

      {/* CSS animations */}
      <style>{`
        @keyframes shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(250%)}}
        @keyframes shine  {0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
        @keyframes pulse-seg{0%{box-shadow:0 0 0 0 rgba(2,64,153,.5)}70%{box-shadow:0 0 0 6px rgba(2,64,153,0)}100%{box-shadow:0 0 0 0 rgba(2,64,153,0)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:#E2E8F2;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#BFDBFE}
      `}</style>

      {/* NAV */}
      <nav style={S.nav}>
        <Link to="/" style={{ textDecoration:'none' }}><VMlogo size="md" variant="full-light" /></Link>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {isAuthenticated && <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>{user?.name}</span>}
          <button onClick={()=>{logout();navigate('/')}} style={{ fontSize:12, color:'rgba(255,255,255,.45)', background:'transparent', border:'none', cursor:'pointer' }}>Log Out</button>
        </div>
      </nav>

      <div style={S.wrap}>

        {/* Header */}
        <div style={S.card}>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#1B3A6B', marginBottom:4 }}>Welcome to Claim Notifications</h1>
          <p style={{ fontSize:12.5, color:C.muted, marginBottom:8 }}>Look up your claim or policy details and track updates in real time.</p>
          <ul style={{ paddingLeft:18, marginBottom:12 }}>
            {['Search by Claim Number or Policy Number','Access real-time updates on claim status and progress','Receive instant notifications for important changes'].map(b=>(
              <li key={b} style={{ fontSize:12.5, color:C.muted, marginBottom:2 }}>{b}</li>
            ))}
          </ul>

          {/* Search tabs */}
          <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:14 }}>
            <button style={S.tabBtn(searchTab==='claim')}  onClick={()=>{setSearchTab('claim');reset()}}>Search by claim number</button>
            <button style={S.tabBtn(searchTab==='policy')} onClick={()=>{setSearchTab('policy');reset()}}>Search by Policy number</button>
          </div>

          {/* Input */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input
              value={searchTab==='claim' ? claimInput : policyInput}
              onChange={e => searchTab==='claim' ? setClaimInput(e.target.value) : setPolicyInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && (searchTab==='claim' ? searchClaim() : searchPolicy())}
              placeholder={searchTab==='claim' ? 'e.g. 000-00-000480' : 'e.g. 7407354463'}
              style={{ ...S.input, borderColor: error ? '#DC2626' : C.border }}
            />
            <button onClick={searchTab==='claim' ? searchClaim : searchPolicy} style={S.btnPrimary}>Search</button>
            <button onClick={clearAll} style={S.btnGhost}>Clear Search</button>
          </div>
          {error && <div style={S.error}><AlertCircle size={14}/>{error}</div>}
        </div>

        {/* CLAIM RESULT */}
        {foundClaim && (
          <>
            <ClaimTracker claim={foundClaim} />
            <ClaimDetail  claim={foundClaim} />
          </>
        )}

        {/* POLICY LIST */}
        {showPolicy && !selClaim && (
          <PolicyList policyNum={policyNum} onSelect={handlePolicyClaimSelect} />
        )}

        {/* SELECTED POLICY CLAIM */}
        {selClaim && (
          <>
            <button onClick={()=>{setSelClaim(null);setShowPolicy(true)}}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:C.navy,
                background:'transparent', border:'none', cursor:'pointer', marginBottom:12, fontWeight:600 }}>
              <ChevronLeft size={16}/> Back to claims list
            </button>
            <ClaimTracker claim={selClaim} />
            <ClaimDetail  claim={selClaim} />
          </>
        )}

        <div style={{ textAlign:'center', marginTop:24 }}>
          <Link to="/" style={{ fontSize:13, color:C.muted, textDecoration:'none' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
