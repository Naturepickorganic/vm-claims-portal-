import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'
import VMlogo from '@/components/ui/VMlogo'
import DocumentsTab  from '@/components/DocumentsTab'
import CoverageTab   from '@/components/CoverageTab'
import ClaimsAssistant from '@/components/ClaimsAssistant'
import { useAuth } from '@/lib/authContext'

/* ── Brand tokens ── */
const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB', greenBorder:'#A8E4A2',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
  tblHead:'#1B3A6B', rowAlt:'#F5F8FF',
  orange:'#E65100', purple:'#6A1B9A', teal:'#0F6E56', amber:'#854F0B',
}

/* ── LOB-aware tracker steps ── */
const AUTO_STEPS = ['Filed','Adjuster\nAssigned','Inspection\nComplete','Estimate\nApproved','Rental\nActive','Repair\nIn Progress','Payment','Closed']
const PROP_STEPS = ['Filed','Adjuster\nAssigned','Inspection\nComplete','Estimate\nApproved','Mitigation\nComplete','Rebuild\nIn Progress','Payment','Closed']

type EvtCategory = 'General'|'Repair'|'Rental'|'Payment'|'Inspection'|'Mitigation'|'Rebuild'|'ALE'|'Contents'
type StatusType  = 'on-track'|'action-needed'|'closed'
type LobType     = 'auto'|'property'

interface TimelineEvent {
  id:number; category:EvtCategory; title:string; sub:string
  date:string; status:'done'|'active'|'upcoming'; badge:string
}
interface ContactRow { name:string; role:string; createdDate:string; phone:string; email:string }
interface ServiceRow { serviceNumber:string; serviceType:string; provider:string; serviceStatus:string; expectedCompletion:string }
interface PaymentRow { checkNumber:string; payTo:string; grossAmount:number; issueDate:string; scheduledSendDate:string; status:string }
interface NoteRow    { adjuster:string; date:string; message:string }

interface ClaimData {
  claimNumber:string; insuredName:string; policyNumber:string
  claimStatus:string; statusType:StatusType; lobType:LobType
  adjusterName:string; adjusterPhone:string
  reporterName:string; reportedType:string; reportedDate:string
  /* Auto fields */
  vehicle:string; dateOfLoss:string; lossType:string
  repairShop:string; rentalInfo:string
  /* Property fields */
  propertyAddress?:string; propertyType?:string; peril?:string
  contractor?:string; aleInfo?:string
  activeStep:number; progressPct:number; statusMsg:string
  notes:NoteRow[]; payments:PaymentRow[]
  contacts:ContactRow[]; services:ServiceRow[]
  timeline:TimelineEvent[]
}

interface PolicyClaim {
  claimNumber:string; insuredName:string; adjusterName:string
  status:string; createdDate:string; vehicle:string; lossType:string
  lobType:LobType
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA — 12 fully detailed claims (9 Auto + 3 Property)
   4 Policies + 3 Property policies
   All tabs: Info, Payments, Contacts, Services, Timeline in sync
   Auto events sourced from: GW ClaimCenter, CCC ONE, Mitchell, Enterprise ARMS, HiMarley, ISO
   Property events sourced from: GW ClaimCenter, Xactimate/Symbility, EagleView, Alacrity, HiMarley, OneInc
   🔌 Replace with Guidewire API calls when ready
   ═══════════════════════════════════════════════════════════════ */

const MOCK_CLAIMS: Record<string,ClaimData> = {

  /* ════════════════════════════════════════════════════════
     AUTO CLAIMS
     ════════════════════════════════════════════════════════ */

  /* ── AUTO 1: Rosario — CR-V — Repair + Rental active — GREEN ── */
  '000-00-000480': {
    claimNumber:'000-00-000480', insuredName:'Rosario Marinello',
    policyNumber:'7407354463', claimStatus:'Open', statusType:'on-track', lobType:'auto',
    adjusterName:'Emily Rodriguez', adjusterPhone:'(214) 555-0142',
    reporterName:'Rosario Marinello', reportedType:'Self / Insured',
    reportedDate:'2024-09-15', vehicle:'2022 Honda CR-V EX-L',
    dateOfLoss:'2024-09-15', lossType:'Collision — Rear End',
    repairShop:'Caliber Collision Dallas (4821 Mockingbird Ln)',
    rentalInfo:'Enterprise #ENT-88421 · 2022 Toyota Camry · 9 days remaining',
    activeStep:6, progressPct:68,
    statusMsg:"Body work underway at Caliber Collision. Parts arrived May 19. Enterprise rental active — 9 days remaining. We'll notify you when your vehicle passes quality inspection.",
    notes:[
      { adjuster:'Emily Rodriguez', date:'May 16, 2025', message:'Supplement approved — additional damage behind rear bumper. Revised total $8,267. No deductible change.' },
      { adjuster:'Emily Rodriguez', date:'Sep 15, 2024', message:'Claim opened. ISO ClaimSearch clear. Inspection scheduled at Caliber Collision Dallas for May 14. Rental authorized.' },
    ],
    payments:[
      { checkNumber:'',              payTo:'Rosario Marinello', grossAmount:88,   issueDate:'2025-09-02', scheduledSendDate:'',           status:'Notifying'  },
      { checkNumber:'',              payTo:'Caliber Collision',  grossAmount:7767, issueDate:'',           scheduledSendDate:'2025-05-30', status:'Requesting' },
    ],
    contacts:[
      { name:'Rosario Marinello',        role:'Insured',         createdDate:'Sep 15, 2024', phone:'(214) 555-0181', email:'rosario@email.com'             },
      { name:'Emily Rodriguez',          role:'Adjuster',        createdDate:'Sep 15, 2024', phone:'(214) 555-0142', email:'emily.rodriguez@valuemumt.com' },
      { name:'Caliber Collision Dallas', role:'Repair Shop',     createdDate:'May 13, 2025', phone:'(214) 555-0300', email:'dallas@calibercollision.com'   },
      { name:'Enterprise Rent-A-Car',    role:'Rental Provider', createdDate:'May 14, 2025', phone:'(214) 555-0400', email:'dallas.rental@enterprise.com'  },
    ],
    services:[
      { serviceNumber:'SRV-480-001', serviceType:'Collision Repair',   provider:'Caliber Collision Dallas', serviceStatus:'In Progress', expectedCompletion:'May 28, 2025' },
      { serviceNumber:'SRV-480-002', serviceType:'Rental Vehicle',     provider:'Enterprise Rent-A-Car',   serviceStatus:'Active',      expectedCompletion:'May 28, 2025' },
      { serviceNumber:'SRV-480-003', serviceType:'Quality Inspection', provider:'Caliber Collision Dallas', serviceStatus:'Pending',     expectedCompletion:'May 28, 2025' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL Submitted — Claim #000-00-000480 Assigned',      sub:'Claim created in system. Coverage verified: collision, $500 deductible, rental coverage confirmed. Confirmation sent to rosario@email.com.',                                          date:'Sep 15, 2024 · 9:14 AM',  status:'done',     badge:'✓ Filed'       },
      { id:2,  category:'General',    title:'Emily Rodriguez Assigned — Text Thread Opened',        sub:'Emily Rodriguez (Property — Team B) assigned. Direct: (214) 555-0142. Two-way SMS thread opened via HiMarley. ISO ClaimSearch history: clear.',                                     date:'Sep 15, 2024 · 11:30 AM', status:'done',     badge:'✓ Complete'    },
      { id:3,  category:'Repair',     title:'DRP Shop Selected — Caliber Collision Dallas',         sub:'Caliber Collision Dallas selected from DRP network via CCC Engage based on proximity and capacity. Shop details sent to member.',                                                     date:'May 12, 2025',            status:'done',     badge:'✓ Complete'    },
      { id:4,  category:'Inspection', title:'Inspection Appointment Scheduled',                     sub:'Drop-off: May 14, 10:00 AM · 4821 Mockingbird Ln, Dallas TX. Reminder sent via HiMarley 24 hrs prior.',                                                                              date:'May 13, 2025',            status:'done',     badge:'✓ Complete'    },
      { id:5,  category:'Rental',     title:'Enterprise Rental Reserved — Confirmation #ENT-88421', sub:'Reservation created via Enterprise ARMS: 2022 Toyota Camry, pickup at 2424 Commerce St Dallas. Coverage: up to 30 days, fully covered. No cost to you.',                            date:'May 13, 2025',            status:'done',     badge:'✓ Reserved'    },
      { id:6,  category:'Rental',     title:'Rental Vehicle Picked Up',                             sub:'Pickup confirmed in Enterprise ARMS. Rental period clock started. Coverage countdown: 30 days remaining.',                                                                           date:'May 14, 2025 · 10:05 AM', status:'done',     badge:'✓ Active'      },
      { id:7,  category:'Inspection', title:'Vehicle Received at Caliber — Teardown Started',       sub:'Vehicle checked in 10:22 AM via CCC ONE. Teardown phase begun. Hidden damage discovery begins here.',                                                                                date:'May 14, 2025 · 10:22 AM', status:'done',     badge:'✓ Complete'    },
      { id:8,  category:'Inspection', title:'Estimate Completed — $6,847 (CCC Estimate STP)',       sub:'Full line-item estimate: Parts $3,210 (Honda OEM) · Labor 18.5 hrs $2,490 · Paint $1,147. Transmitted to carrier via CCC API.',                                                    date:'May 14, 2025',            status:'done',     badge:'✓ Complete'    },
      { id:9,  category:'Inspection', title:'Estimate Approved — Repairs Authorized May 16',        sub:'Approved by Emily Rodriguez. Caliber Collision notified via CCC/Mitchell. Repair start date confirmed. HiMarley: "Estimate approved. Repairs begin May 16."',                       date:'May 15, 2025',            status:'done',     badge:'✓ Approved'    },
      { id:10, category:'Repair',     title:'Parts Ordered — Honda OEM ETA May 19',                sub:'Rear bumper assembly ordered via CCC ONE integrated parts ordering. Supplier ETA: May 19. Body work begins on arrival. HiMarley update sent.',                                       date:'May 15, 2025',            status:'done',     badge:'✓ Ordered'     },
      { id:11, category:'Repair',     title:'Body Repair Started',                                  sub:'CCC ONE UpdatePlus: "Repairs have started on your vehicle." Body repair phase logged.',                                                                                               date:'May 16, 2025',            status:'done',     badge:'✓ In Progress' },
      { id:12, category:'Repair',     title:'Hidden Damage Found — Supplement $1,420 Approved',    sub:'Additional damage behind bumper identified during teardown. CCC supplement with photos submitted. Adjuster approved. HiMarley: "No change to your deductible. New ETA: May 28."',   date:'May 17, 2025',            status:'done',     badge:'✓ Approved'    },
      { id:13, category:'Rental',     title:'Enterprise Rental — Active, 9 Days Remaining',         sub:'ARMS rental extension check: repair extends past original end date. Coverage extended to May 28. HiMarley: "Your rental coverage has been extended to May 28. No action needed."',  date:'May 18, 2025',            status:'active',   badge:'● Active'      },
      { id:14, category:'Repair',     title:'OEM Parts Received — Body Work Completed',             sub:'Honda parts received May 19. Body repair completed. Vehicle moving to paint booth. CCC ONE UpdatePlus: "Your CR-V is in the paint booth."',                                         date:'May 19–21, 2025',         status:'done',     badge:'✓ Complete'    },
      { id:15, category:'Repair',     title:'Paint & Refinish In Progress',                         sub:'Vehicle in paint booth at Caliber Collision. Paint phase typically 2–3 days. Next update when paint is complete and reassembly begins.',                                              date:'Today · May 21, 2025',    status:'active',   badge:'● In Progress' },
      { id:16, category:'Repair',     title:'QC Inspection & Vehicle Ready for Pickup',             sub:'CCC ONE UpdatePlus will notify when vehicle passes QC. Pickup notification includes shop hours, address, deductible amount ($500) due, payment methods accepted.',                  date:'Est. May 28, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:17, category:'Rental',     title:'Rental Return',                                        sub:'Return your Enterprise vehicle at Caliber or any Enterprise location by May 28. Enterprise ARMS will confirm closure. No charges — fully covered.',                                   date:'Est. May 28, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:18, category:'Payment',    title:'Final Invoice & Payment — $7,767 to Caliber',          sub:'Shop invoice reconciled against approved estimate via CCC/Mitchell. Payment authorized in GW ClaimCenter. Disbursed via OneInc ACH to Caliber Collision.',                          date:'After repairs complete',  status:'upcoming', badge:'⏳ Scheduled'  },
      { id:19, category:'General',    title:'Member Satisfaction Survey & Claim Closed',             sub:'5-star SMS survey triggered via HiMarley immediately at closure. Closing summary: repair total, your out-of-pocket ($500), rental days used (15), reopen window 60 days.',          date:'Est. ~May 30, 2025',      status:'upcoming', badge:'⏳ Scheduled'  },
    ],
  },

  /* ── AUTO 2: Marcus — F-150 — Hail, action needed — AMBER ── */
  '000-00-000521': {
    claimNumber:'000-00-000521', insuredName:'Marcus T. Williams',
    policyNumber:'8812047291', claimStatus:'Open', statusType:'action-needed', lobType:'auto',
    adjusterName:'Scott Henson', adjusterPhone:'(214) 555-0188',
    reporterName:'Marcus T. Williams', reportedType:'Self / Insured',
    reportedDate:'2025-04-10', vehicle:'2021 Ford F-150 XLT 4WD',
    dateOfLoss:'2025-04-10', lossType:'Comprehensive — Hail / Weather',
    repairShop:'Joe Myers Ford Collision — Houston (13602 Northwest Fwy)',
    rentalInfo:'Enterprise rental authorized — available at time of vehicle drop-off',
    activeStep:3, progressPct:30,
    statusMsg:'Action needed: Please drop off your F-150 at Joe Myers Ford Collision by May 23, 8:30 AM. Your Enterprise rental will be ready at that location. No deductible for hail under your policy.',
    notes:[
      { adjuster:'Scott Henson', date:'May 20, 2025', message:'Inspection confirmed May 23 at 8:30 AM at Joe Myers Ford. Please bring insurance card and license. Enterprise rental will be ready at drop-off — no separate pickup needed.' },
      { adjuster:'Scott Henson', date:'Apr 11, 2025', message:'Large hail event confirmed Apr 10 in Houston metro via Verisk storm data (1.75" hail, NW Houston). Comprehensive coverage verified — no deductible applies for hail.' },
    ],
    payments:[],
    contacts:[
      { name:'Marcus T. Williams',       role:'Insured',       createdDate:'Apr 10, 2025', phone:'(832) 555-0210', email:'marcus.williams@email.com'      },
      { name:'Scott Henson',             role:'Adjuster',      createdDate:'Apr 11, 2025', phone:'(214) 555-0188', email:'scott.henson@valuemumt.com'     },
      { name:'Joe Myers Ford Collision', role:'Repair Shop',   createdDate:'May 20, 2025', phone:'(713) 555-0500', email:'collision@joemyersford.com'     },
    ],
    services:[
      { serviceNumber:'SRV-521-001', serviceType:'Hail Damage Inspection', provider:'Joe Myers Ford Collision', serviceStatus:'Scheduled',  expectedCompletion:'May 23, 2025'   },
      { serviceNumber:'SRV-521-002', serviceType:'Paintless Dent Repair',  provider:'Joe Myers Ford Collision', serviceStatus:'Pending',    expectedCompletion:'Est. Jun 2025'  },
      { serviceNumber:'SRV-521-003', serviceType:'Rental Vehicle',          provider:'Enterprise Rent-A-Car',   serviceStatus:'Authorized', expectedCompletion:'During repairs'  },
    ],
    timeline:[
      { id:1, category:'General',    title:'FNOL Submitted — Hail Damage, Claim #000-00-000521',  sub:'Claim created. Verisk storm data confirms Apr 10 hail event (1.75") at member location. ISO ClaimSearch: clear. Confirmation sent to marcus.williams@email.com.',             date:'Apr 10, 2025 · 6:42 PM', status:'done',     badge:'✓ Filed'        },
      { id:2, category:'General',    title:'Scott Henson Assigned — Text Thread Opened',           sub:'Scott Henson (Hail — Team A) assigned. Direct: (214) 555-0188. Comprehensive coverage confirmed. No deductible for hail. HiMarley thread opened.',                          date:'Apr 11, 2025 · 9:00 AM', status:'done',     badge:'✓ Complete'     },
      { id:3, category:'General',    title:'Coverage Verified — No Deductible for Hail',           sub:'Comprehensive coverage confirmed. Hail peril covered. No deductible applies. Member statement collected via HiMarley guided text questionnaire.',                           date:'Apr 12, 2025',           status:'done',     badge:'✓ Verified'     },
      { id:4, category:'Inspection', title:'⚡ Action Needed — Drop Off Vehicle by May 23, 8:30 AM',sub:'Joe Myers Ford Collision, 13602 Northwest Fwy, Houston TX. Enterprise rental will be ready at shop on arrival. Bring insurance card and license. HiMarley reminder set.',  date:'May 20, 2025',           status:'active',   badge:'● Action Needed' },
      { id:5, category:'Rental',     title:'Enterprise Rental Authorized — Ready at Drop-off',     sub:'Enterprise ARMS reservation authorized. Pickup at Joe Myers Ford on vehicle drop-off. Up to 21 days covered — no separate pickup needed.',                                   date:'Pending drop-off',        status:'upcoming', badge:'⏳ Authorized'   },
      { id:6, category:'Inspection', title:'Estimate — CCC AI Hail Assessment',                   sub:'CCC AI-assisted hail damage assessment with photo analysis. Damage mapped per vehicle zone. Full line-item estimate (PDR + paint) transmitted to adjuster for approval.',    date:'Est. May 23–24, 2025',   status:'upcoming', badge:'⏳ Scheduled'    },
      { id:7, category:'Repair',     title:'Repairs Begin — Paintless Dent Repair',                sub:'PDR for hail damage on hood, roof, trunk, quarter panels. Typically 5–10 business days. Mitchell RepairCenter tracks each phase.',                                          date:'Est. late May 2025',      status:'upcoming', badge:'⏳ Scheduled'    },
      { id:8, category:'Repair',     title:'QC Inspection & Vehicle Ready',                        sub:"CCC ONE UpdatePlus will notify when your truck passes QC. Rental return instructions included.",                                                                             date:'Est. early Jun 2025',     status:'upcoming', badge:'⏳ Scheduled'    },
      { id:9, category:'Payment',    title:'Payment & Claim Closure',                              sub:'No deductible. Payment direct to shop via OneInc. HiMarley closing summary: repair total, rental days used, reopen window.',                                                date:'After repairs',           status:'upcoming', badge:'⏳ Scheduled'    },
    ],
  },

  /* ── AUTO 3: Jennifer — Camry — Total Loss, closed — STEEL ── */
  '000-00-000612': {
    claimNumber:'000-00-000612', insuredName:'Jennifer K. Okafor',
    policyNumber:'5503819042', claimStatus:'Closed', statusType:'closed', lobType:'auto',
    adjusterName:'Linda Park', adjusterPhone:'(214) 555-0166',
    reporterName:'Jennifer K. Okafor', reportedType:'Self / Insured',
    reportedDate:'2025-01-08', vehicle:'2020 Toyota Camry SE',
    dateOfLoss:'2025-01-07', lossType:'Comprehensive — Vehicle Theft',
    repairShop:'N/A — Total Loss Settlement',
    rentalInfo:'Enterprise — Closed Jan 28, 2025. 20 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Total loss settlement of $24,800 issued Jan 29, 2025. Rental closed after 20 days, fully covered. Thank you for trusting us with your claim.',
    notes:[
      { adjuster:'Linda Park', date:'Jan 22, 2025', message:'Vehicle declared total loss. ACV $24,800 per Verisk/CCC market valuation. Settlement letter sent by email and certified mail. Lien release obtained from Bank of America.' },
      { adjuster:'Linda Park', date:'Jan 08, 2025', message:'Theft reported. Police report #DPD-2025-00812 filed. ISO ClaimSearch: no prior theft flags on VIN. Rental approved immediately. Total loss team engaged.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-4421', payTo:'Jennifer K. Okafor',              grossAmount:24300, issueDate:'2025-01-29', scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2025-3812', payTo:'Bank of America (Lienholder)',     grossAmount:500,   issueDate:'2025-01-29', scheduledSendDate:'', status:'Cleared' },
    ],
    contacts:[
      { name:'Jennifer K. Okafor',           role:'Insured',          createdDate:'Jan 08, 2025', phone:'(469) 555-0320', email:'jennifer.okafor@email.com'    },
      { name:'Linda Park',                   role:'Adjuster',         createdDate:'Jan 08, 2025', phone:'(214) 555-0166', email:'linda.park@valuemumt.com'     },
      { name:'Bank of America Auto Finance', role:'Lienholder',       createdDate:'Jan 18, 2025', phone:'(800) 555-0100', email:'autoloss@bankofamerica.com'   },
      { name:'Enterprise Rent-A-Car',        role:'Rental Provider',  createdDate:'Jan 08, 2025', phone:'(469) 555-0400', email:'dallas.rental@enterprise.com' },
    ],
    services:[
      { serviceNumber:'SRV-612-001', serviceType:'ACV Vehicle Valuation',    provider:'CCC / Verisk Valuation', serviceStatus:'Completed', expectedCompletion:'Jan 15, 2025' },
      { serviceNumber:'SRV-612-002', serviceType:'Title Transfer Processing', provider:'Title Express',           serviceStatus:'Completed', expectedCompletion:'Jan 22, 2025' },
      { serviceNumber:'SRV-612-003', serviceType:'Rental Vehicle',           provider:'Enterprise Rent-A-Car',  serviceStatus:'Completed', expectedCompletion:'Jan 28, 2025' },
    ],
    timeline:[
      { id:1, category:'General',    title:'FNOL — Vehicle Theft Reported, Claim #000-00-000612', sub:'Theft reported. Police report #DPD-2025-00812 filed. ISO ClaimSearch: no prior theft on VIN or member identity. Confirmation sent to jennifer.okafor@email.com.',    date:'Jan 08, 2025 · 7:15 AM',  status:'done', badge:'✓ Filed'     },
      { id:2, category:'General',    title:'Linda Park Assigned — Total Loss Team Engaged',        sub:'Linda Park (Total Loss — Team C). Direct: (214) 555-0166. HiMarley thread opened. Total loss pathway initiated.',                                                   date:'Jan 08, 2025 · 10:00 AM', status:'done', badge:'✓ Complete'  },
      { id:3, category:'Rental',     title:'Enterprise Rental Reserved & Active',                  sub:'Enterprise #ENT-44129 · 2021 Honda Accord · Fully covered while claim is open. Confirmed via ARMS.',                                                               date:'Jan 08, 2025',            status:'done', badge:'✓ Active'    },
      { id:4, category:'Inspection', title:'ACV Valuation Completed — $24,800 (CCC / Verisk)',    sub:'Actual Cash Value determined at $24,800 using CCC market valuation: 12 comparable vehicles, adjusted for mileage (41,200), condition, and options.',              date:'Jan 15, 2025',            status:'done', badge:'✓ Complete'  },
      { id:5, category:'Inspection', title:'Total Loss Declared — Settlement $24,800',             sub:'Repair cost exceeds 75% of ACV threshold. Total loss declared. Settlement letter issued. Title transfer initiated with Bank of America lienholder.',              date:'Jan 18, 2025',            status:'done', badge:'✓ Declared'  },
      { id:6, category:'Inspection', title:'Settlement Accepted — Signed Title Received',          sub:'Jennifer accepted settlement of $24,800. Signed title received. Lien release obtained from Bank of America. OneInc payment disbursement initiated.',              date:'Jan 22, 2025',            status:'done', badge:'✓ Accepted'  },
      { id:7, category:'Payment',    title:'Payment Issued — $24,300 ACH + $500 to BofA',         sub:'$24,300 to Jennifer\'s account (ending 4421) via OneInc ACH. $500 lien payoff to Bank of America. Both cleared Jan 31. HiMarley: "Payment sent."',              date:'Jan 29, 2025',            status:'done', badge:'✓ Cleared'   },
      { id:8, category:'Rental',     title:'Rental Closed — 20 Days, Fully Covered',              sub:'Enterprise rental closed Jan 28. ARMS confirms: 20 days, fully covered, no charges to member. Billing summary generated.',                                       date:'Jan 28, 2025',            status:'done', badge:'✓ Closed'    },
      { id:9, category:'General',    title:'Satisfaction Survey & Claim Closed',                   sub:'HiMarley 5-star survey sent. Claim closed Jan 30, 2025. Closing SMS: total paid $24,800, rental 20 days, reopen within 60 days if needed.',                     date:'Jan 30, 2025',            status:'done', badge:'✓ Closed'    },
    ],
  },

  /* ── AUTO 4: Rosario — CR-V — Hail, closed 2023 — STEEL ── */
  '000-00-000312': {
    claimNumber:'000-00-000312', insuredName:'Rosario Marinello',
    policyNumber:'7407354463', claimStatus:'Closed', statusType:'closed', lobType:'auto',
    adjusterName:'Jonah Egertson', adjusterPhone:'(214) 555-0177',
    reporterName:'Rosario Marinello', reportedType:'Self / Insured',
    reportedDate:'2023-06-22', vehicle:'2022 Honda CR-V EX-L',
    dateOfLoss:'2023-06-22', lossType:'Comprehensive — Hail / Weather',
    repairShop:'Service King Dallas (7800 Forest Ln)',
    rentalInfo:'Enterprise — Closed Jun 30, 2023. 8 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Hail damage repaired at Service King Dallas. Settlement of $3,240 issued Jun 30, 2023. No deductible applied.',
    notes:[{ adjuster:'Jonah Egertson', date:'Jun 22, 2023', message:'Hail damage confirmed from June 22 storm (Verisk: 1.5" hail, DFW). Full roof and hood PDR required. Comprehensive coverage — no deductible.' }],
    payments:[{ checkNumber:'CHK-2023-8812', payTo:'Service King Dallas', grossAmount:3240, issueDate:'2023-06-30', scheduledSendDate:'', status:'Cleared' }],
    contacts:[
      { name:'Rosario Marinello',  role:'Insured',         createdDate:'Jun 22, 2023', phone:'(214) 555-0181', email:'rosario@email.com'            },
      { name:'Jonah Egertson',     role:'Adjuster',        createdDate:'Jun 22, 2023', phone:'(214) 555-0177', email:'jonah.egertson@valuemumt.com' },
      { name:'Service King Dallas',role:'Repair Shop',     createdDate:'Jun 24, 2023', phone:'(214) 555-0600', email:'dallas@serviceking.com'       },
      { name:'Enterprise Rent-A-Car', role:'Rental Provider', createdDate:'Jun 24, 2023', phone:'(214) 555-0400', email:'dallas.rental@enterprise.com' },
    ],
    services:[
      { serviceNumber:'SRV-312-001', serviceType:'Hail / PDR Repair', provider:'Service King Dallas',   serviceStatus:'Completed', expectedCompletion:'Jun 30, 2023' },
      { serviceNumber:'SRV-312-002', serviceType:'Rental Vehicle',    provider:'Enterprise Rent-A-Car', serviceStatus:'Completed', expectedCompletion:'Jun 30, 2023' },
    ],
    timeline:[
      { id:1, category:'General',    title:'FNOL — Hail Damage, Claim #000-00-000312',  sub:'June 22 hail event confirmed via Verisk. ISO ClaimSearch: clear. Confirmation sent to rosario@email.com.',          date:'Jun 22, 2023', status:'done', badge:'✓ Filed'    },
      { id:2, category:'General',    title:'Jonah Egertson Assigned',                   sub:'Jonah Egertson (Hail — Team A). Direct: (214) 555-0177. Comprehensive confirmed, no deductible.',                   date:'Jun 22, 2023', status:'done', badge:'✓ Complete' },
      { id:3, category:'Inspection', title:'Estimate Completed & Approved — $3,240',    sub:'PDR estimate via CCC: roof and hood. Approved Jun 25. Repairs begin Jun 26 at Service King Dallas.',                date:'Jun 24–25, 2023',status:'done', badge:'✓ Approved' },
      { id:4, category:'Rental',     title:'Enterprise Rental Active — 8 Days',          sub:'Rental active during repairs. Fully covered, no cost to member.',                                                    date:'Jun 24, 2023', status:'done', badge:'✓ Complete' },
      { id:5, category:'Repair',     title:'PDR Repairs Complete — QC Passed',           sub:'Paintless dent repair on roof, hood, trunk lid. QC passed Jun 29 via CCC ONE.',                                    date:'Jun 29, 2023', status:'done', badge:'✓ Complete' },
      { id:6, category:'Rental',     title:'Rental Closed — 8 Days',                    sub:'Enterprise rental returned. ARMS confirms: 8 days, fully covered, no charges.',                                     date:'Jun 30, 2023', status:'done', badge:'✓ Closed'   },
      { id:7, category:'Payment',    title:'Payment — $3,240 to Service King via OneInc',sub:'No cost to member. Insurance paid shop directly via OneInc ACH.',                                                  date:'Jun 30, 2023', status:'done', badge:'✓ Cleared'  },
      { id:8, category:'General',    title:'Satisfaction Survey & Claim Closed',         sub:'HiMarley 5-star survey sent. Claim closed Jul 3, 2023. Summary sent to rosario@email.com.',                        date:'Jul 03, 2023', status:'done', badge:'✓ Closed'   },
    ],
  },

  /* ── AUTO 5: Rosario — Civic — Glass chip, closed 2022 — STEEL ── */
  '000-00-000201': {
    claimNumber:'000-00-000201', insuredName:'Rosario Marinello',
    policyNumber:'7407354463', claimStatus:'Closed', statusType:'closed', lobType:'auto',
    adjusterName:'Spencer Dunn', adjusterPhone:'(214) 555-0155',
    reporterName:'Rosario Marinello', reportedType:'Self / Insured',
    reportedDate:'2022-11-04', vehicle:'2019 Honda Civic LX',
    dateOfLoss:'2022-11-04', lossType:'Comprehensive — Glass / Windshield',
    repairShop:'Safelite AutoGlass Dallas (Mobile)',
    rentalInfo:'N/A — Same-day glass repair, no rental required',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Windshield chip repaired same day by Safelite mobile. Texas deductible waiver applied — no out-of-pocket cost.',
    notes:[{ adjuster:'Spencer Dunn', date:'Nov 04, 2022', message:'Chip repair same-day via Safelite mobile. Texas deductible waiver applied per Tex. Ins. Code §1952.061. No cost to insured.' }],
    payments:[],
    contacts:[
      { name:'Rosario Marinello',           role:'Insured',     createdDate:'Nov 04, 2022', phone:'(214) 555-0181', email:'rosario@email.com'          },
      { name:'Spencer Dunn',                role:'Adjuster',    createdDate:'Nov 04, 2022', phone:'(214) 555-0155', email:'spencer.dunn@valuemumt.com' },
      { name:'Safelite AutoGlass (Mobile)', role:'Glass Repair', createdDate:'Nov 04, 2022', phone:'(800) 638-8958', email:'—'                         },
    ],
    services:[{ serviceNumber:'SRV-201-001', serviceType:'Windshield Chip Repair', provider:'Safelite AutoGlass (Mobile)', serviceStatus:'Completed', expectedCompletion:'Nov 04, 2022' }],
    timeline:[
      { id:1, category:'General',    title:'Glass Claim Filed — Windshield Chip',       sub:'Chip reported. Safelite mobile dispatched. TX deductible waiver confirmed (§1952.061).',  date:'Nov 04, 2022 · 9:00 AM',  status:'done', badge:'✓ Filed'     },
      { id:2, category:'Inspection', title:'Safelite Mobile Technician Dispatched',      sub:'Technician en route. ETA 11:30 AM. HiMarley: "Your tech is 20 minutes away."',           date:'Nov 04, 2022 · 9:15 AM',  status:'done', badge:'✓ Dispatched' },
      { id:3, category:'Repair',     title:'Windshield Chip Repair Complete',            sub:'30-minute chip repair completed. QC passed. No cost to you.',                             date:'Nov 04, 2022 · 11:55 AM', status:'done', badge:'✓ Complete'   },
      { id:4, category:'Payment',    title:'Texas Deductible Waiver Applied',            sub:'Safelite billed insurance directly. No out-of-pocket per Tex. Ins. Code §1952.061.',     date:'Nov 04, 2022',            status:'done', badge:'✓ Waived'     },
      { id:5, category:'General',    title:'Claim Closed — Same Day',                   sub:'HiMarley satisfaction survey sent. Summary sent to rosario@email.com.',                  date:'Nov 04, 2022',            status:'done', badge:'✓ Closed'     },
    ],
  },

  /* ── AUTO 6: Marcus — F-150 — Collision closed 2024 — STEEL ── */
  '000-00-000398': {
    claimNumber:'000-00-000398', insuredName:'Marcus T. Williams',
    policyNumber:'8812047291', claimStatus:'Closed', statusType:'closed', lobType:'auto',
    adjusterName:'Jonah Egertson', adjusterPhone:'(214) 555-0177',
    reporterName:'Marcus T. Williams', reportedType:'Self / Insured',
    reportedDate:'2024-03-15', vehicle:'2021 Ford F-150 XLT 4WD',
    dateOfLoss:'2024-03-15', lossType:'Collision — Side Impact',
    repairShop:'Caliber Collision Houston (9210 Katy Fwy)',
    rentalInfo:'Enterprise — Closed Apr 2, 2024. 18 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Side panel repairs completed at Caliber Collision Houston. Settlement of $5,340 issued Apr 2, 2024. Subrogation ongoing — we will notify you if $500 deductible is recovered.',
    notes:[
      { adjuster:'Jonah Egertson', date:'Mar 19, 2024', message:'Other driver 100% at fault — police report and witness statement confirm. Subrogation demand filed via ISO ARB Forum. Marcus\'s $500 deductible recovery in progress.' },
      { adjuster:'Jonah Egertson', date:'Mar 15, 2024', message:'Side impact collision, passenger side. $500 collision deductible applies. Rental approved. ISO ClaimSearch: clear.' },
    ],
    payments:[{ checkNumber:'CHK-2024-2210', payTo:'Caliber Collision Houston', grossAmount:5340, issueDate:'2024-04-02', scheduledSendDate:'', status:'Cleared' }],
    contacts:[
      { name:'Marcus T. Williams',         role:'Insured',         createdDate:'Mar 15, 2024', phone:'(832) 555-0210', email:'marcus.williams@email.com'        },
      { name:'Jonah Egertson',             role:'Adjuster',        createdDate:'Mar 15, 2024', phone:'(214) 555-0177', email:'jonah.egertson@valuemumt.com'     },
      { name:'Caliber Collision Houston',  role:'Repair Shop',     createdDate:'Mar 18, 2024', phone:'(713) 555-0550', email:'houston@calibercollision.com'     },
      { name:'Enterprise Rent-A-Car',      role:'Rental Provider', createdDate:'Mar 18, 2024', phone:'(713) 555-0400', email:'houston.rental@enterprise.com'   },
    ],
    services:[
      { serviceNumber:'SRV-398-001', serviceType:'Collision Repair',     provider:'Caliber Collision Houston', serviceStatus:'Completed',   expectedCompletion:'Apr 02, 2024' },
      { serviceNumber:'SRV-398-002', serviceType:'Rental Vehicle',       provider:'Enterprise Rent-A-Car',    serviceStatus:'Completed',   expectedCompletion:'Apr 02, 2024' },
      { serviceNumber:'SRV-398-003', serviceType:'Subrogation Recovery', provider:'ISO ARB Forum',             serviceStatus:'In Progress', expectedCompletion:'Ongoing'      },
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL — Side Impact Collision, Claim #000-00-000398', sub:'Police report filed. ISO ClaimSearch: clear. Liability investigation initiated. Confirmation to marcus.williams@email.com.', date:'Mar 15, 2024 · 2:30 PM', status:'done', badge:'✓ Filed'     },
      { id:2,  category:'General',    title:'Jonah Egertson Assigned — Liability Investigation',  sub:'Jonah Egertson (Collision — Team B). Direct: (214) 555-0177. Police report and witness statement collected via HiMarley.', date:'Mar 15, 2024',           status:'done', badge:'✓ Complete'  },
      { id:3,  category:'Inspection', title:'Vehicle at Caliber — Estimate $5,840 Approved',      sub:'Passenger door and quarter panel. CCC Estimate: Labor 14.5 hrs, parts $2,890. Approved Mar 19.',                       date:'Mar 18–19, 2024',        status:'done', badge:'✓ Approved'  },
      { id:4,  category:'General',    title:'Other Driver 100% At Fault — Subrogation Filed',     sub:'Police report and witness confirm other driver at fault. Subrogation demand filed via ISO ARB Forum. Deductible recovery in progress.', date:'Mar 19, 2024', status:'done', badge:'✓ Confirmed' },
      { id:5,  category:'Rental',     title:'Enterprise Rental Active — 18 Days',                 sub:'Enterprise #ENT-77234 · 2022 Ford F-150 · Fully covered.',                                                             date:'Mar 18, 2024',           status:'done', badge:'✓ Complete'  },
      { id:6,  category:'Repair',     title:'Repairs Complete — QC Passed',                       sub:'Passenger door and quarter panel repaired. CCC ONE QC pass Apr 1. Vehicle ready for pickup.',                          date:'Apr 01, 2024',           status:'done', badge:'✓ Complete'  },
      { id:7,  category:'Rental',     title:'Rental Closed — 18 Days',                            sub:'ARMS confirms: 18 days, fully covered, no charges.',                                                                   date:'Apr 02, 2024',           status:'done', badge:'✓ Closed'    },
      { id:8,  category:'Payment',    title:'Payment — $5,340 to Caliber via OneInc',              sub:'You paid $500 deductible to Caliber. Insurance paid $5,340 balance via OneInc ACH.',                                  date:'Apr 02, 2024',           status:'done', badge:'✓ Cleared'   },
      { id:9,  category:'General',    title:'Claim Closed — Subrogation Ongoing',                  sub:'Closed Apr 5, 2024. ISO ARB Forum subrogation to recover your $500 deductible — we will notify you of recovery.',     date:'Apr 05, 2024',           status:'done', badge:'✓ Closed'    },
    ],
  },

  /* ── AUTO 7: David — Tesla — EV repair, step 5, GREEN ── */
  '000-00-006000': {
    claimNumber:'000-00-006000', insuredName:'David Chen',
    policyNumber:'9901234567', claimStatus:'Open', statusType:'on-track', lobType:'auto',
    adjusterName:'Lynzi Farrell', adjusterPhone:'(214) 555-0199',
    reporterName:'David Chen', reportedType:'Self / Insured',
    reportedDate:'2025-05-05', vehicle:'2023 Tesla Model 3 Long Range',
    dateOfLoss:'2025-05-05', lossType:'Collision — Rear End',
    repairShop:'Tesla Certified Collision Dallas (4200 Lemmon Ave)',
    rentalInfo:'Enterprise #ENT-99102 · 2023 Hyundai Ioniq 5 EV · 11 days remaining',
    activeStep:5, progressPct:55,
    statusMsg:"Estimate approved at Tesla Certified Collision. OEM parts ordered — 7–10 day lead time. EV rental active. ADAS sensor recalibration will be required after body repairs.",
    notes:[{ adjuster:'Lynzi Farrell', date:'May 08, 2025', message:'Tesla OEM parts ordered (bumper, sensors, quarter panel). 7–10 day lead time. Estimate $9,420 approved. EV-compatible Ioniq 5 rental authorized via ARMS.' }],
    payments:[{ checkNumber:'', payTo:'Tesla Certified Collision Dallas', grossAmount:8920, issueDate:'', scheduledSendDate:'2025-06-10', status:'Requesting' }],
    contacts:[
      { name:'David Chen',                      role:'Insured',         createdDate:'May 05, 2025', phone:'(972) 555-0301', email:'david.chen@email.com'           },
      { name:'Lynzi Farrell',                   role:'Adjuster',        createdDate:'May 05, 2025', phone:'(214) 555-0199', email:'lynzi.farrell@valuemumt.com'    },
      { name:'Tesla Certified Collision Dallas', role:'Repair Shop',     createdDate:'May 07, 2025', phone:'(214) 555-0700', email:'collision@tesladallas.com'      },
      { name:'Enterprise Rent-A-Car',           role:'Rental Provider', createdDate:'May 07, 2025', phone:'(972) 555-0400', email:'dallas.rental@enterprise.com'  },
    ],
    services:[
      { serviceNumber:'SRV-6000-001', serviceType:'EV Collision Repair',     provider:'Tesla Certified Collision Dallas', serviceStatus:'In Progress', expectedCompletion:'Jun 10, 2025' },
      { serviceNumber:'SRV-6000-002', serviceType:'Rental Vehicle (EV)',     provider:'Enterprise Rent-A-Car',           serviceStatus:'Active',      expectedCompletion:'Jun 10, 2025' },
      { serviceNumber:'SRV-6000-003', serviceType:'ADAS Sensor Recalibration',provider:'Tesla Certified Collision Dallas', serviceStatus:'Pending',   expectedCompletion:'Jun 10, 2025' },
    ],
    timeline:[
      { id:1, category:'General',    title:'FNOL — Tesla Rear End Collision, #000-00-006000',  sub:'Claim created. CCC EV specialist pathway initiated. Tesla Certified shop search via CCC Engage. ISO: clear. Confirmation to david.chen@email.com.',        date:'May 05, 2025',           status:'done',     badge:'✓ Filed'      },
      { id:2, category:'General',    title:'Lynzi Farrell Assigned — EV Specialist',           sub:'Lynzi Farrell (EV Specialist — Team D). Direct: (214) 555-0199. Tesla Certified Collision Dallas selected from DRP network.',                              date:'May 05, 2025',           status:'done',     badge:'✓ Complete'   },
      { id:3, category:'Rental',     title:'EV Rental Reserved — Hyundai Ioniq 5',             sub:'Enterprise ARMS: EV-compatible Ioniq 5 reserved. Pickup at Tesla shop on drop-off. 30-day coverage authorized.',                                          date:'May 06, 2025',           status:'done',     badge:'✓ Reserved'   },
      { id:4, category:'Inspection', title:'Vehicle Received at Tesla Certified — Teardown',   sub:'Vehicle checked in May 7, 9:15 AM. Teardown begun. Tesla OEM parts requirement confirmed.',                                                                date:'May 07, 2025',           status:'done',     badge:'✓ Complete'   },
      { id:5, category:'Inspection', title:'Estimate Approved — $9,420 (Tesla OEM)',           sub:'Tesla OEM parts required (bumper, rear sensors, quarter panel). Labor 22 hrs. ADAS recalibration included in scope. Approved by Lynzi Farrell.',           date:'May 08, 2025',           status:'done',     badge:'✓ Approved'   },
      { id:6, category:'Rental',     title:'EV Rental Active — 11 Days Remaining',             sub:'Ioniq 5 pickup confirmed in Enterprise ARMS. Coverage countdown: 30 days. HiMarley: "Your EV rental is active."',                                         date:'May 07, 2025',           status:'active',   badge:'● Active'     },
      { id:7, category:'Repair',     title:'Tesla OEM Parts Ordered — 7–10 Day Lead Time',    sub:'Bumper, sensors, and rear quarter panel ordered via Tesla parts portal. Supplier ETA: May 16–18. Body work begins on arrival.',                             date:'May 08, 2025',           status:'active',   badge:'● In Progress'},
      { id:8, category:'Repair',     title:'Body Repair & ADAS Recalibration',                 sub:'After body repairs: all Tesla cameras, radar, and ultrasonic sensors recalibrated at certified facility. Autopilot verification required before delivery.',  date:'Est. May 18 – Jun 5',    status:'upcoming', badge:'⏳ Scheduled'  },
      { id:9, category:'Repair',     title:'QC — Software Verification & Vehicle Ready',       sub:'Tesla verifies all software, ADAS, and safety systems before delivery. Full Autopilot function test required.',                                             date:'Est. Jun 10, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:10,category:'Payment',    title:'Payment & Claim Closure',                           sub:'$500 deductible due at pickup. Insurance pays $8,920 to Tesla shop via OneInc. HiMarley closing summary.',                                                date:'After repairs',           status:'upcoming', badge:'⏳ Scheduled'  },
    ],
  },

  /* ── AUTO 8: David — BMW X5 — Hail, closed — STEEL ── */
  '000-00-006001': {
    claimNumber:'000-00-006001', insuredName:'David Chen',
    policyNumber:'9901234567', claimStatus:'Closed', statusType:'closed', lobType:'auto',
    adjusterName:'Trevor Gunderson', adjusterPhone:'(214) 555-0183',
    reporterName:'David Chen', reportedType:'Self / Insured',
    reportedDate:'2025-02-18', vehicle:'2022 BMW X5 xDrive40i',
    dateOfLoss:'2025-02-18', lossType:'Comprehensive — Hail / Weather',
    repairShop:'Park Place BMW Collision Dallas',
    rentalInfo:'Enterprise — Closed Mar 5, 2025. 15 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Hail damage repaired at Park Place BMW. Settlement of $6,120 issued Mar 5, 2025. No deductible applied.',
    notes:[{ adjuster:'Trevor Gunderson', date:'Feb 18, 2025', message:'Feb 18 DFW hail event confirmed via Verisk (1.25" hail). BMW requires OEM-certified PDR repair. Park Place BMW authorized. No deductible — comprehensive.' }],
    payments:[{ checkNumber:'CHK-2025-9901', payTo:'Park Place BMW Collision', grossAmount:6120, issueDate:'2025-03-05', scheduledSendDate:'', status:'Cleared' }],
    contacts:[
      { name:'David Chen',               role:'Insured',         createdDate:'Feb 18, 2025', phone:'(972) 555-0301', email:'david.chen@email.com'           },
      { name:'Trevor Gunderson',         role:'Adjuster',        createdDate:'Feb 18, 2025', phone:'(214) 555-0183', email:'trevor.gunderson@valuemumt.com' },
      { name:'Park Place BMW Collision', role:'Repair Shop',     createdDate:'Feb 20, 2025', phone:'(214) 555-0800', email:'collision@parkplacebmw.com'     },
      { name:'Enterprise Rent-A-Car',    role:'Rental Provider', createdDate:'Feb 20, 2025', phone:'(214) 555-0400', email:'dallas.rental@enterprise.com'  },
    ],
    services:[
      { serviceNumber:'SRV-6001-001', serviceType:'Hail / PDR Repair', provider:'Park Place BMW Collision', serviceStatus:'Completed', expectedCompletion:'Mar 05, 2025' },
      { serviceNumber:'SRV-6001-002', serviceType:'Rental Vehicle',    provider:'Enterprise Rent-A-Car',   serviceStatus:'Completed', expectedCompletion:'Mar 05, 2025' },
    ],
    timeline:[
      { id:1, category:'General',    title:'FNOL — BMW Hail Damage, #000-00-006001', sub:'Verisk storm data: Feb 18 DFW hail 1.25". BMW OEM shop required. Park Place BMW selected. ISO: clear.',   date:'Feb 18, 2025',    status:'done', badge:'✓ Filed'    },
      { id:2, category:'General',    title:'Trevor Gunderson Assigned',              sub:'Trevor Gunderson (Hail — Team C). Direct: (214) 555-0183. Comprehensive, no deductible.',                 date:'Feb 18, 2025',    status:'done', badge:'✓ Complete' },
      { id:3, category:'Inspection', title:'Estimate & Approval — $6,120',          sub:'BMW OEM PDR: hood, roof, trunk. Approved Feb 21 via CCC. No deductible.',                                  date:'Feb 20–21, 2025', status:'done', badge:'✓ Approved' },
      { id:4, category:'Rental',     title:'Enterprise Rental — 15 Days',            sub:'Rental active during repairs. Fully covered. ARMS closure: 15 days, no charges.',                         date:'Feb 20, 2025',    status:'done', badge:'✓ Complete' },
      { id:5, category:'Repair',     title:'PDR Repairs & QC Passed',               sub:'OEM PDR on hood, roof, trunk. QC passed Mar 4 via CCC ONE. No paint required.',                           date:'Mar 04, 2025',    status:'done', badge:'✓ Complete' },
      { id:6, category:'Payment',    title:'Payment — $6,120 to Park Place BMW',    sub:'OneInc ACH payment. No cost to David. HiMarley confirmation sent.',                                        date:'Mar 05, 2025',    status:'done', badge:'✓ Cleared'  },
      { id:7, category:'General',    title:'Claim Closed',                           sub:'Closed Mar 6, 2025. Summary sent to david.chen@email.com.',                                               date:'Mar 06, 2025',    status:'done', badge:'✓ Closed'   },
    ],
  },

  /* ── AUTO 9: David — Audi A4 — Glass, closed — STEEL ── */
  '000-00-006002': {
    claimNumber:'000-00-006002', insuredName:'David Chen',
    policyNumber:'9901234567', claimStatus:'Closed', statusType:'closed', lobType:'auto',
    adjusterName:'Spencer Dunn', adjusterPhone:'(214) 555-0155',
    reporterName:'David Chen', reportedType:'Self / Insured',
    reportedDate:'2024-11-12', vehicle:'2021 Audi A4 Premium Plus',
    dateOfLoss:'2024-11-12', lossType:'Comprehensive — Glass / Windshield',
    repairShop:'Safelite AutoGlass Plano (Drop-off)',
    rentalInfo:'N/A — Glass repair completed same day, no rental needed',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Audi OEM windshield replaced at Safelite Plano. ADAS camera recalibrated. $200 deductible collected.',
    notes:[{ adjuster:'Spencer Dunn', date:'Nov 12, 2024', message:'8-inch crack requires full replacement (chip repair waiver does not apply). Audi OEM glass required per policy. $200 comprehensive deductible. ADAS forward camera recalibration required post-replacement.' }],
    payments:[{ checkNumber:'CHK-2024-8801', payTo:'Safelite AutoGlass Plano', grossAmount:1240, issueDate:'2024-11-15', scheduledSendDate:'', status:'Cleared' }],
    contacts:[
      { name:'David Chen',               role:'Insured',     createdDate:'Nov 12, 2024', phone:'(972) 555-0301', email:'david.chen@email.com'          },
      { name:'Spencer Dunn',             role:'Adjuster',    createdDate:'Nov 12, 2024', phone:'(214) 555-0155', email:'spencer.dunn@valuemumt.com'    },
      { name:'Safelite AutoGlass Plano', role:'Glass Repair',createdDate:'Nov 12, 2024', phone:'(800) 638-8958', email:'plano@safelite.com'            },
    ],
    services:[
      { serviceNumber:'SRV-6002-001', serviceType:'Windshield Replacement (OEM)', provider:'Safelite AutoGlass Plano', serviceStatus:'Completed', expectedCompletion:'Nov 14, 2024' },
      { serviceNumber:'SRV-6002-002', serviceType:'ADAS Camera Recalibration',    provider:'Safelite AutoGlass Plano', serviceStatus:'Completed', expectedCompletion:'Nov 14, 2024' },
    ],
    timeline:[
      { id:1, category:'General',    title:'Glass Claim — Windshield Replacement Required', sub:'8-inch crack (full replacement). Audi OEM required. ADAS recalibration needed. $200 deductible.',             date:'Nov 12, 2024', status:'done', badge:'✓ Filed'    },
      { id:2, category:'Inspection', title:'Vehicle Dropped at Safelite Plano',             sub:'Audi OEM glass ordered from supplier. Replacement and recalibration scheduled Nov 14.',                       date:'Nov 13, 2024', status:'done', badge:'✓ Complete' },
      { id:3, category:'Repair',     title:'OEM Windshield Replaced + ADAS Recalibrated',  sub:'Audi OEM windshield installed. Forward-facing camera recalibrated, adaptive cruise and lane assist verified.', date:'Nov 14, 2024', status:'done', badge:'✓ Complete' },
      { id:4, category:'Payment',    title:'$200 Deductible + $1,240 Insurance Paid',       sub:'$200 deductible paid at Safelite. Insurance paid $1,240 balance via OneInc.',                                 date:'Nov 15, 2024', status:'done', badge:'✓ Cleared'  },
      { id:5, category:'General',    title:'Claim Closed',                                   sub:'Summary sent to david.chen@email.com.',                                                                       date:'Nov 15, 2024', status:'done', badge:'✓ Closed'   },
    ],
  },

  /* ════════════════════════════════════════════════════════
     PROPERTY CLAIMS — Events distinct from Auto
     Vendor sources: EagleView, Xactimate/Symbility, Alacrity,
     Verisk Geomni, HiMarley, OneInc (no CCC/Mitchell/ARMS)
     ════════════════════════════════════════════════════════ */

  /* ── PROP 1: Sarah Mitchell — Wind/Hail, active rebuild — GREEN ── */
  '000-00-000750': {
    claimNumber:'000-00-000750', insuredName:'Sarah Mitchell',
    policyNumber:'6601234500', claimStatus:'Open', statusType:'on-track', lobType:'property',
    adjusterName:'Maria Delgado', adjusterPhone:'(214) 555-0220',
    reporterName:'Sarah Mitchell', reportedType:'Self / Insured',
    reportedDate:'2025-04-28', vehicle:'N/A — Property Claim',
    dateOfLoss:'2025-04-28', lossType:'Wind / Hail — Roof & Interior Water Intrusion',
    repairShop:'N/A — Property Claim',
    rentalInfo:'N/A — Homeowner not displaced',
    propertyAddress:'4512 Oak Ridge Dr, Plano TX 75024',
    propertyType:'Single Family Dwelling (HO-3)',
    peril:'Wind / Hail — Major storm Apr 28, 2025',
    contractor:'ABC Restoration & Roofing (Alacrity Network)',
    aleInfo:'N/A — Home habitable during repairs',
    activeStep:6, progressPct:70,
    statusMsg:"Rebuild is underway at your property. Roofing phase is complete. Interior drywall and insulation work started May 19. Estimated completion June 6. Framing and rough-in inspections passed.",
    notes:[
      { adjuster:'Maria Delgado', date:'May 12, 2025', message:'Xactimate estimate $28,400 approved. Scope: full roof replacement (38 squares, OC Duration), siding repairs (east elevation), and interior: master bedroom ceiling and closet drywall/insulation. ACV payment $24,850 issued.' },
      { adjuster:'Maria Delgado', date:'Apr 29, 2025', message:'EagleView aerial imagery confirms severe roof damage across all slopes. Verisk storm data: 2.25" hail, 62mph winds Apr 28. CAT code DFW-2504 applied. ABC Restoration assigned via Alacrity within 24hrs.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-5501', payTo:'Sarah Mitchell',              grossAmount:24850, issueDate:'2025-05-13', scheduledSendDate:'',           status:'Cleared'    },
      { checkNumber:'',              payTo:'ABC Restoration & Roofing',   grossAmount:3550,  issueDate:'',           scheduledSendDate:'2025-06-10', status:'Requesting' },
    ],
    contacts:[
      { name:'Sarah Mitchell',             role:'Insured',       createdDate:'Apr 28, 2025', phone:'(972) 555-0441', email:'sarah.mitchell@email.com'          },
      { name:'Maria Delgado',              role:'Adjuster',      createdDate:'Apr 29, 2025', phone:'(214) 555-0220', email:'maria.delgado@valuemumt.com'       },
      { name:'ABC Restoration & Roofing',  role:'Contractor',    createdDate:'Apr 30, 2025', phone:'(972) 555-0600', email:'claims@abcrestoration.com'         },
      { name:'City of Plano Inspections',  role:'Municipality',  createdDate:'May 09, 2025', phone:'(972) 941-7114', email:'buildingpermits@plano.gov'         },
    ],
    services:[
      { serviceNumber:'SRV-750-001', serviceType:'Roof Replacement',       provider:'ABC Restoration & Roofing', serviceStatus:'Completed',   expectedCompletion:'May 09, 2025' },
      { serviceNumber:'SRV-750-002', serviceType:'Siding Repair',          provider:'ABC Restoration & Roofing', serviceStatus:'Completed',   expectedCompletion:'May 12, 2025' },
      { serviceNumber:'SRV-750-003', serviceType:'Interior Drywall/Insulation', provider:'ABC Restoration & Roofing', serviceStatus:'In Progress', expectedCompletion:'Jun 06, 2025' },
      { serviceNumber:'SRV-750-004', serviceType:'Interior Paint & Finish', provider:'ABC Restoration & Roofing', serviceStatus:'Pending',     expectedCompletion:'Jun 06, 2025' },
      { serviceNumber:'SRV-750-005', serviceType:'Xactimate Estimating',   provider:'Verisk / Xactimate',        serviceStatus:'Completed',   expectedCompletion:'May 10, 2025' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL Submitted — Wind/Hail Damage, #000-00-000750',       sub:'Claim created. Verisk Geomni storm data confirms Apr 28 DFW storm: 2.25" hail, 62mph wind. CAT code DFW-2504 applied. ISO ClaimSearch: clear. Confirmation sent to sarah.mitchell@email.com.',    date:'Apr 28, 2025 · 11:30 PM', status:'done',     badge:'✓ Filed'       },
      { id:2,  category:'General',    title:'Maria Delgado Assigned — HiMarley Thread Opened',         sub:'Maria Delgado (CAT — Team SW) assigned. Direct: (214) 555-0220. HiMarley thread opened. Member prompted to upload damage photos via text.',                                                        date:'Apr 29, 2025 · 8:00 AM',  status:'done',     badge:'✓ Complete'    },
      { id:3,  category:'Inspection', title:'EagleView Aerial Imagery Ordered & Delivered',             sub:'EagleView Premium Report ordered via API. Delivered within 4 hrs: roof pitch, 38 squares total, all slope measurements, penetration count (chimney, vents, skylights). Loaded directly into Xactimate.', date:'Apr 29, 2025',           status:'done',     badge:'✓ Complete'    },
      { id:4,  category:'General',    title:'ABC Restoration Assigned via Alacrity Network',            sub:'Carrier-approved contractor ABC Restoration assigned via Alacrity within 24-hr CAT SLA. HiMarley: "ABC Restoration has been assigned. They will contact you within 2 hours."',                     date:'Apr 30, 2025',           status:'done',     badge:'✓ Assigned'    },
      { id:5,  category:'Inspection', title:'Field Inspection Completed — Cause of Loss Confirmed',     sub:'On-site inspection by Maria Delgado. Symbility mobile app: full damage scope documented (exterior + interior water intrusion in master bedroom and closet). Photos geo-tagged.',                    date:'May 01, 2025',           status:'done',     badge:'✓ Complete'    },
      { id:6,  category:'Inspection', title:'Estimate Built in Xactimate — $28,400 Approved',           sub:'Full Xactimate line items: Roofing 38 sq OC Duration ($14,200), siding east elevation ($5,800), interior drywall/insulation ($6,400), paint ($2,000). ACV $24,850 (depreciation $3,550). Approved by Maria Delgado.', date:'May 10–12, 2025',        status:'done',     badge:'✓ Approved'    },
      { id:7,  category:'Payment',    title:'ACV Payment Issued — $24,850 to Sarah Mitchell',           sub:'Initial ACV payment $24,850 issued via OneInc ACH. HiMarley: "Payment sent. You will receive the remaining $3,550 (recoverable depreciation) once repairs are complete."',                        date:'May 13, 2025',           status:'done',     badge:'✓ Cleared'     },
      { id:8,  category:'Rebuild',    title:'Emergency Roof Tarping — Dry-in Complete',                 sub:'ABC Restoration tarped roof May 1 to prevent further water intrusion while permit was pulled. Dry-in complete. Interior protected.',                                                                date:'May 01–02, 2025',        status:'done',     badge:'✓ Complete'    },
      { id:9,  category:'Rebuild',    title:'Building Permit Pulled — City of Plano',                   sub:'Permit #PLN-2025-04419 issued by City of Plano. Roofing, siding, and interior structural work authorized. Required before structural repairs begin.',                                              date:'May 06, 2025',           status:'done',     badge:'✓ Issued'      },
      { id:10, category:'Rebuild',    title:'Roof Replacement Complete — 38 Squares OC Duration',       sub:'Full tear-off and replacement: OC Duration shingles, synthetic underlayment, ice & water shield, ridge cap, drip edge, all flashing. Passed City of Plano roof inspection May 10.',               date:'May 07–09, 2025',        status:'done',     badge:'✓ Complete'    },
      { id:11, category:'Rebuild',    title:'Siding Repairs — East Elevation Complete',                  sub:'East elevation siding replaced. Color matched to existing. Passed final siding inspection.',                                                                                                       date:'May 12, 2025',           status:'done',     badge:'✓ Complete'    },
      { id:12, category:'Rebuild',    title:'Interior Demo & Drywall Underway',                          sub:'Damaged drywall and insulation removed from master bedroom ceiling and closet. New insulation installed. Drywall phase started May 19. ABC Restoration update: "Framing and rough-in inspections passed."', date:'May 15–21, 2025',        status:'active',   badge:'● In Progress' },
      { id:13, category:'Rebuild',    title:'Paint & Interior Finish',                                   sub:'Final paint and finish work after drywall complete. Color matching documented. Flooring reinstalled if needed. Punch list completed.',                                                              date:'Est. May 28 – Jun 4',    status:'upcoming', badge:'⏳ Scheduled'  },
      { id:14, category:'Rebuild',    title:'Final Punch List & Member Walkthrough',                     sub:'Sarah signs off on completed work. Digital completion certificate uploaded to Alacrity. Triggers RCV holdback release.',                                                                          date:'Est. Jun 5, 2025',        status:'upcoming', badge:'⏳ Scheduled'  },
      { id:15, category:'Payment',    title:'RCV Holdback Released — $3,550',                            sub:'Recoverable depreciation of $3,550 released after completion certificate received. Disbursed via OneInc. HiMarley: "Your final payment is on its way."',                                         date:'Est. Jun 6, 2025',        status:'upcoming', badge:'⏳ Scheduled'  },
      { id:16, category:'General',    title:'Member Satisfaction Survey & Claim Closed',                 sub:'5-star SMS survey via HiMarley. Closing summary: repair total $28,400, your out-of-pocket ($0 — no deductible for wind/hail), ACV $24,850 + RCV $3,550, reopen window 60 days.',               date:'Est. ~Jun 8, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
    ],
  },

  /* ── PROP 2: James & Carol Webb — Burst Pipe, ALE active — AMBER ── */
  '000-00-000751': {
    claimNumber:'000-00-000751', insuredName:'James & Carol Webb',
    policyNumber:'7702345601', claimStatus:'Open', statusType:'action-needed', lobType:'property',
    adjusterName:'Kevin Tran', adjusterPhone:'(214) 555-0233',
    reporterName:'James Webb', reportedType:'Self / Insured',
    reportedDate:'2025-05-02', vehicle:'N/A — Property Claim',
    dateOfLoss:'2025-05-02', lossType:'Water Damage — Burst Pipe (2nd Floor Bathroom)',
    repairShop:'N/A — Property Claim',
    rentalInfo:'N/A — Property Claim',
    propertyAddress:'2201 Willow Creek Rd, Frisco TX 75034',
    propertyType:'Single Family Dwelling (HO-3)',
    peril:'Water Damage — Burst supply line, 2nd floor bathroom',
    contractor:'ServiceMaster by Cornerstone (Alacrity Network)',
    aleInfo:'Extended Stay America, Frisco — ALE approved $3,200/mo · $2,100 used · $1,100 remaining',
    activeStep:5, progressPct:55,
    statusMsg:'Action needed: Please provide your contractor selection by May 24 to avoid rebuild delays. Dry-out is complete. Mold clearance passed. Demo phase is complete and property is ready for rebuild.',
    notes:[
      { adjuster:'Kevin Tran', date:'May 16, 2025', message:'Mold clearance test results received — CLEAR per industrial hygienist report. Demo complete. Xactimate rebuild estimate $41,200 approved. ACV payment $36,100 issued. Member has not yet selected rebuild contractor from approved list — follow-up required.' },
      { adjuster:'Kevin Tran', date:'May 03, 2025', message:'Burst supply line behind 2nd floor bathroom vanity. Approximately 6 hours of water flow before discovered. ISO: clear. Affected areas: 2nd floor bathroom, hallway, and 1st floor kitchen ceiling below. ALE authorized — family displaced. ServiceMaster assigned via Alacrity within 4 hrs.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-6601', payTo:'James & Carol Webb',              grossAmount:36100, issueDate:'2025-05-18', scheduledSendDate:'',           status:'Cleared'    },
      { checkNumber:'',              payTo:'ServiceMaster by Cornerstone',    grossAmount:4800,  issueDate:'2025-05-16', scheduledSendDate:'',           status:'Cleared'    },
      { checkNumber:'',              payTo:'Rebuild Contractor (TBD)',        grossAmount:5100,  issueDate:'',           scheduledSendDate:'2025-07-01', status:'Requesting' },
    ],
    contacts:[
      { name:'James Webb',                       role:'Insured',     createdDate:'May 02, 2025', phone:'(469) 555-0881', email:'james.webb@email.com'              },
      { name:'Carol Webb',                       role:'Insured',     createdDate:'May 02, 2025', phone:'(469) 555-0882', email:'carol.webb@email.com'              },
      { name:'Kevin Tran',                       role:'Adjuster',    createdDate:'May 03, 2025', phone:'(214) 555-0233', email:'kevin.tran@valuemumt.com'          },
      { name:'ServiceMaster by Cornerstone',     role:'Contractor',  createdDate:'May 03, 2025', phone:'(972) 555-0710', email:'frisco@servicemastercornerstone.com'},
      { name:'Extended Stay America Frisco',     role:'ALE Housing', createdDate:'May 03, 2025', phone:'(972) 555-0900', email:'frisco@extendedstay.com'          },
    ],
    services:[
      { serviceNumber:'SRV-751-001', serviceType:'Emergency Water Extraction',  provider:'ServiceMaster by Cornerstone', serviceStatus:'Completed',  expectedCompletion:'May 03, 2025' },
      { serviceNumber:'SRV-751-002', serviceType:'Dry-out (Air Movers/Dehumid)',provider:'ServiceMaster by Cornerstone', serviceStatus:'Completed',  expectedCompletion:'May 10, 2025' },
      { serviceNumber:'SRV-751-003', serviceType:'Demo / Tearout',              provider:'ServiceMaster by Cornerstone', serviceStatus:'Completed',  expectedCompletion:'May 14, 2025' },
      { serviceNumber:'SRV-751-004', serviceType:'Mold Assessment & Clearance', provider:'ProTech IH Consultants',       serviceStatus:'Completed',  expectedCompletion:'May 16, 2025' },
      { serviceNumber:'SRV-751-005', serviceType:'Rebuild & Reconstruction',    provider:'TBD — Awaiting Selection',     serviceStatus:'Pending',    expectedCompletion:'Est. Jul 2025'},
      { serviceNumber:'SRV-751-006', serviceType:'ALE Housing',                 provider:'Extended Stay America Frisco', serviceStatus:'Active',     expectedCompletion:'During rebuild'},
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL — Burst Pipe, Water Damage, #000-00-000751',      sub:'Burst supply line discovered May 2 behind 2nd floor bathroom vanity. ~6 hrs flow. ISO ClaimSearch: clear. HiMarley opened. ALE authorized immediately — family displaced. Confirmation to james.webb@email.com.',  date:'May 02, 2025 · 11:15 PM', status:'done',     badge:'✓ Filed'       },
      { id:2,  category:'General',    title:'Kevin Tran Assigned — ALE & Contractor Dispatched',    sub:'Kevin Tran (Water — Team E). Direct: (214) 555-0233. ALE authorized ($3,200/mo). ServiceMaster by Cornerstone assigned via Alacrity within 4 hrs of FNOL. HiMarley: "ServiceMaster is on the way."',              date:'May 03, 2025 · 1:00 AM',  status:'done',     badge:'✓ Complete'    },
      { id:3,  category:'ALE',        title:'ALE Housing Arranged — Extended Stay America',          sub:'James and Carol checked into Extended Stay America, Frisco. ALE authorized: up to $3,200/month. HiMarley: "Keep all hotel, meal, and laundry receipts. Text photos here — no email needed."',                      date:'May 03, 2025',           status:'active',   badge:'● Active'      },
      { id:4,  category:'Mitigation', title:'Emergency Water Extraction Started',                    sub:'ServiceMaster on-site. Emergency water extraction begun: 2nd floor bath, hallway, and 1st floor kitchen ceiling. Industrial extractors deployed. Moisture meter baseline readings documented at all surfaces.',        date:'May 03, 2025 · 3:30 AM',  status:'done',     badge:'✓ Complete'    },
      { id:5,  category:'Mitigation', title:'Dry-out Equipment Installed — 8 Air Movers, 3 Dehumidifiers', sub:'Equipment deployed at all affected areas. Daily moisture readings begun. ServiceMaster targets IICRC S500 standard (Goal: ≤12% moisture). HiMarley daily updates sent.',                                   date:'May 03, 2025',           status:'done',     badge:'✓ Complete'    },
      { id:6,  category:'Inspection', title:'Field Inspection Completed — Damage Scope Documented', sub:'Kevin Tran on-site with Symbility mobile app. Full scope: 2nd floor bathroom (complete gutting), hallway flooring (150 sq ft), 1st floor kitchen ceiling (drywall, insulation). Photos mapped per room.',           date:'May 05, 2025',           status:'done',     badge:'✓ Complete'    },
      { id:7,  category:'Mitigation', title:'Dry-out Complete — Moisture Targets Achieved',          sub:'Final readings: all surfaces ≤12% moisture per IICRC S500. Equipment removed May 10. Site cleared for demolition. ServiceMaster daily readings logged: Days 1–7.',                                                 date:'May 10, 2025',           status:'done',     badge:'✓ Complete'    },
      { id:8,  category:'Rebuild',    title:'Demo / Tearout Complete',                               sub:'Damaged drywall, insulation, vanity, flooring removed from all affected areas. Disposal receipts captured. Site ready for mold assessment.',                                                                         date:'May 14, 2025',           status:'done',     badge:'✓ Complete'    },
      { id:9,  category:'Inspection', title:'Estimate Built in Xactimate — $41,200 Approved',       sub:'Full Xactimate rebuild estimate: bathroom rebuild $18,400, hallway flooring $4,200, kitchen ceiling $5,800, plumbing repair $4,100, painting $3,200, contents $5,500. ACV $36,100. Approved May 18.',              date:'May 15–18, 2025',        status:'done',     badge:'✓ Approved'    },
      { id:10, category:'Mitigation', title:'Mold Assessment — CLEAR',                               sub:'Industrial hygienist (ProTech IH) clearance test: all samples below action levels. Mold-free clearance issued May 16. Rebuild can proceed.',                                                                        date:'May 16, 2025',           status:'done',     badge:'✓ Cleared'     },
      { id:11, category:'Payment',    title:'ACV Payment Issued — $36,100 to Webbs',                 sub:'ACV payment $36,100 via OneInc ACH. HiMarley: "Payment sent. You will receive $5,100 recoverable depreciation after rebuild is complete." Mitigation payment $4,800 to ServiceMaster issued same day.',           date:'May 18, 2025',           status:'done',     badge:'✓ Cleared'     },
      { id:12, category:'ALE',        title:'⚡ Action Needed — Select Rebuild Contractor by May 24', sub:'Please select a contractor from the approved list sent to james.webb@email.com. Delay in selection will extend your ALE stay and rebuild timeline. Kevin Tran available to assist: (214) 555-0233.',              date:'May 20, 2025',           status:'active',   badge:'● Action Needed'},
      { id:13, category:'Rebuild',    title:'Rebuild Begins — Plumbing, Framing, Drywall',           sub:'Once contractor selected: permit pulled, plumbing repair, framing, insulation, drywall. Estimated 6–8 weeks for full rebuild. Weekly HiMarley updates during rebuild.',                                           date:'Est. late May 2025',      status:'upcoming', badge:'⏳ Scheduled'  },
      { id:14, category:'ALE',        title:'ALE Balance Update',                                    sub:'Current ALE usage: $2,100 of $3,200 monthly allowance. Estimated 6–8 more weeks of ALE needed during rebuild. Kevin will request ALE extension if rebuild exceeds current authorization.',                         date:'May 24, 2025',           status:'upcoming', badge:'⏳ Scheduled'  },
      { id:15, category:'Contents',   title:'Contents Settlement',                                   sub:'Contents inventory submitted. Xactimate contents module valuation in progress. ACV and RCV calculated per item. Separate settlement will be issued.',                                                                 date:'In progress',            status:'upcoming', badge:'⏳ In Progress'},
      { id:16, category:'Rebuild',    title:'Final Inspection & Member Walkthrough',                  sub:'Final contractor sign-off. Municipal final inspection. Completion certificate triggers RCV holdback ($5,100) release.',                                                                                              date:'Est. Jul 2025',           status:'upcoming', badge:'⏳ Scheduled'  },
      { id:17, category:'Payment',    title:'RCV Holdback — $5,100 Released',                        sub:'Recoverable depreciation released after completion. Disbursed via OneInc.',                                                                                                                                         date:'After rebuild complete',  status:'upcoming', badge:'⏳ Scheduled'  },
      { id:18, category:'ALE',        title:'Member Returns Home — ALE Closed',                      sub:'HiMarley: "Has your family moved back in? Reply YES to close your ALE, or let us know if you need more time." ALE closure confirmed.',                                                                              date:'After rebuild complete',  status:'upcoming', badge:'⏳ Scheduled'  },
      { id:19, category:'General',    title:'Claim Closed',                                           sub:'HiMarley closing summary: total claim paid, ACV + RCV, ALE days used, rebuild complete date, contractor, reopen window 60 days.',                                                                                  date:'Est. ~Jul 15, 2025',      status:'upcoming', badge:'⏳ Scheduled'  },
    ],
  },

  /* ── PROP 3: Robert Chen — Fire, fully closed — STEEL ── */
  '000-00-000752': {
    claimNumber:'000-00-000752', insuredName:'Robert Chen',
    policyNumber:'9901234567', claimStatus:'Closed', statusType:'closed', lobType:'property',
    adjusterName:'Patricia Vasquez', adjusterPhone:'(214) 555-0244',
    reporterName:'Robert Chen', reportedType:'Self / Insured',
    reportedDate:'2024-08-14', vehicle:'N/A — Property Claim',
    dateOfLoss:'2024-08-14', lossType:'Fire — Kitchen Grease Fire',
    repairShop:'N/A — Property Claim',
    rentalInfo:'N/A — Property Claim',
    propertyAddress:'5801 Clearwater Blvd, Allen TX 75013',
    propertyType:'Single Family Dwelling (HO-3)',
    peril:'Fire — Kitchen grease fire, smoke damage throughout',
    contractor:'Servpro of Allen / McKinney (Alacrity Network)',
    aleInfo:'Closed — ALE total used: $8,400 over 42 days. Fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Fire damage fully remediated and rebuilt by Servpro. Final settlement of $62,400 paid. ALE covered 42 days ($8,400). Thank you — your home has been fully restored.',
    notes:[
      { adjuster:'Patricia Vasquez', date:'Nov 08, 2024', message:'Claim closed. Final settlement: dwelling $52,800 + contents $9,600. RCV holdback $7,200 released after completion. ALE $8,400 (42 days). Total claim paid: $71,400. Member satisfaction: 5 stars.' },
      { adjuster:'Patricia Vasquez', date:'Aug 15, 2024', message:'Kitchen grease fire Aug 14. Fire dept confirmed. Smoke damage to kitchen, living room, and HVAC system. ISO ClaimSearch: clear. ALE authorized. Servpro assigned via Alacrity for emergency board-up and smoke mitigation.' },
    ],
    payments:[
      { checkNumber:'CHK-2024-9210', payTo:'Robert Chen (ACV dwelling)',   grossAmount:45600, issueDate:'2024-09-05',  scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2024-9310', payTo:'Robert Chen (Contents ACV)',   grossAmount:7200,  issueDate:'2024-09-05',  scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2024-9841', payTo:'Servpro Allen/McKinney',       grossAmount:4800,  issueDate:'2024-09-10',  scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2024-0221', payTo:'Robert Chen (RCV holdback)',   grossAmount:7200,  issueDate:'2024-11-01',  scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2024-0310', payTo:'Robert Chen (Contents RCV)',   grossAmount:2400,  issueDate:'2024-11-01',  scheduledSendDate:'', status:'Cleared' },
    ],
    contacts:[
      { name:'Robert Chen',                  role:'Insured',     createdDate:'Aug 14, 2024', phone:'(972) 555-0301', email:'robert.chen@email.com'              },
      { name:'Patricia Vasquez',             role:'Adjuster',    createdDate:'Aug 15, 2024', phone:'(214) 555-0244', email:'patricia.vasquez@valuemumt.com'     },
      { name:'Servpro of Allen / McKinney',  role:'Contractor',  createdDate:'Aug 15, 2024', phone:'(972) 555-0800', email:'allen@servpro.com'                  },
      { name:'City of Allen Building Dept.', role:'Municipality',createdDate:'Aug 20, 2024', phone:'(214) 509-4730', email:'buildingpermits@allenusa.org'       },
    ],
    services:[
      { serviceNumber:'SRV-752-001', serviceType:'Emergency Board-up & Securing',       provider:'Servpro Allen / McKinney', serviceStatus:'Completed', expectedCompletion:'Aug 15, 2024' },
      { serviceNumber:'SRV-752-002', serviceType:'Smoke & Soot Mitigation',             provider:'Servpro Allen / McKinney', serviceStatus:'Completed', expectedCompletion:'Aug 25, 2024' },
      { serviceNumber:'SRV-752-003', serviceType:'Kitchen Demo & Rebuild',              provider:'Servpro Allen / McKinney', serviceStatus:'Completed', expectedCompletion:'Oct 28, 2024' },
      { serviceNumber:'SRV-752-004', serviceType:'HVAC Cleaning & Replacement',         provider:'Servpro Allen / McKinney', serviceStatus:'Completed', expectedCompletion:'Sep 20, 2024' },
      { serviceNumber:'SRV-752-005', serviceType:'Contents Cleaning & Pack-out',        provider:'Servpro Allen / McKinney', serviceStatus:'Completed', expectedCompletion:'Sep 05, 2024' },
      { serviceNumber:'SRV-752-006', serviceType:'ALE Housing',                         provider:'Marriott Towneplace Allen', serviceStatus:'Completed', expectedCompletion:'Sep 25, 2024' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL — Kitchen Fire, #000-00-000752',                sub:'Fire dept confirmed kitchen grease fire. Smoke throughout kitchen, living room, HVAC. ISO ClaimSearch: clear. ALE authorized immediately. Confirmation to robert.chen@email.com.',             date:'Aug 14, 2024 · 9:45 PM',  status:'done', badge:'✓ Filed'     },
      { id:2,  category:'General',    title:'Patricia Vasquez Assigned — Emergency Response',      sub:'Patricia Vasquez (Fire — Team F). Servpro Allen/McKinney dispatched via Alacrity within 2 hrs. HiMarley: "Servpro is on the way for emergency board-up and smoke assessment."',            date:'Aug 15, 2024 · 1:00 AM',  status:'done', badge:'✓ Complete'  },
      { id:3,  category:'ALE',        title:'ALE Authorized — Marriott Towneplace Allen',          sub:'ALE authorized: $4,200/month. Robert checked into Marriott Towneplace Allen. HiMarley: receipt collection via text thread — hotel, meals, laundry covered.',                               date:'Aug 15, 2024',            status:'done', badge:'✓ Active'    },
      { id:4,  category:'Mitigation', title:'Emergency Board-up & Property Secured',               sub:'Servpro emergency board-up completed. Kitchen opening secured. Property protected from weather and intrusion.',                                                                               date:'Aug 15, 2024',            status:'done', badge:'✓ Complete'  },
      { id:5,  category:'Inspection', title:'Field Inspection — Damage Scope Documented',          sub:'Patricia Vasquez on-site with Symbility mobile app. Full fire and smoke damage scope: kitchen (total loss), living room (smoke/soot), HVAC system (smoke contamination), contents.',      date:'Aug 16, 2024',            status:'done', badge:'✓ Complete'  },
      { id:6,  category:'Mitigation', title:'Smoke & Soot Mitigation Started',                     sub:'Servpro began smoke and soot cleaning. HEPA air scrubbers deployed. HVAC system isolated to prevent further smoke spread throughout home.',                                                 date:'Aug 17, 2024',            status:'done', badge:'✓ Complete'  },
      { id:7,  category:'Contents',   title:'Contents Pack-out & Inventory',                        sub:'Salvageable contents packed out by Servpro. ContentsTrack mobile app: 847 items photographed and cataloged. AI auto-populated item descriptions and replacement values. Delivered to climate storage.', date:'Aug 20–25, 2024',        status:'done', badge:'✓ Complete'  },
      { id:8,  category:'Inspection', title:'Xactimate Estimate Approved — $52,800 ACV Dwelling', sub:'Full Xactimate line items: kitchen rebuild $28,400, living room $8,200, HVAC replacement $9,800, smoke remediation $6,400. ACV $52,800 (depreciation $7,200). Approved Sep 3.',           date:'Sep 01–03, 2024',         status:'done', badge:'✓ Approved'  },
      { id:9,  category:'Payment',    title:'ACV Payments Issued — $45,600 Dwelling + $7,200 Contents', sub:'$45,600 (dwelling ACV) + $7,200 (contents ACV) issued via OneInc ACH Sep 5. Mitigation payment $4,800 to Servpro Sep 10. HiMarley payment confirmation sent.',                    date:'Sep 05, 2024',            status:'done', badge:'✓ Cleared'   },
      { id:10, category:'Rebuild',    title:'Building Permit & Rebuild Begins',                    sub:'City of Allen permit #ALN-2024-08891 issued Sep 8. Kitchen demo, framing, and HVAC rough-in started. Servpro weekly progress photos uploaded to Alacrity portal.',                       date:'Sep 08, 2024',            status:'done', badge:'✓ Started'   },
      { id:11, category:'Rebuild',    title:'Kitchen Rebuild & HVAC Complete',                     sub:'New kitchen (cabinets, countertops, appliances, tile), new HVAC unit installed and tested. All rough-in inspections passed.',                                                               date:'Oct 15, 2024',            status:'done', badge:'✓ Complete'  },
      { id:12, category:'ALE',        title:'Member Returns Home — ALE Closed',                    sub:'Robert returned home Sep 25 after smoke mitigation and initial rebuild phase complete. ALE total: 42 days, $8,400. Fully covered. HiMarley ALE closure confirmed.',                     date:'Sep 25, 2024',            status:'done', badge:'✓ Closed'    },
      { id:13, category:'Rebuild',    title:'Final Punch List & Member Walkthrough',               sub:'Robert signed off on all completed work Oct 28. Digital completion certificate uploaded. Triggers RCV holdback release.',                                                                  date:'Oct 28, 2024',            status:'done', badge:'✓ Complete'  },
      { id:14, category:'Contents',   title:'Contents Return & Replacement Settlement',             sub:'Cleaned contents returned. Replacement items settled: $9,600 ACV + $2,400 RCV (on replaced items). Both issued via OneInc.',                                                              date:'Nov 01, 2024',            status:'done', badge:'✓ Settled'   },
      { id:15, category:'Payment',    title:'RCV Holdback Released — $7,200 Dwelling + $2,400 Contents', sub:'Recoverable depreciation released after walkthrough sign-off. OneInc disbursement. HiMarley: "Your final payments are on the way. Your home is fully restored."',             date:'Nov 01, 2024',            status:'done', badge:'✓ Cleared'   },
      { id:16, category:'General',    title:'5-Star Survey & Claim Closed',                        sub:'HiMarley 5-star rating received. Claim closed Nov 8, 2024. Final summary: total claim paid $71,400 (dwelling $52,800 + contents $9,600 + ALE $8,400 + RCV $7,200). Reopen 60 days.',  date:'Nov 08, 2024',            status:'done', badge:'✓ Closed'    },
    ],
  },

  /* ════════════════════════════════════════════════════════
     NEW CLAIMS — Full event coverage for all HTML doc scenarios
     ════════════════════════════════════════════════════════ */

  /* ── AUTO 10: Diana Torres — Chevy Tahoe — Police report, QC fail, deductible at shop — STEEL ── */
  '000-00-000830': {
    claimNumber:'000-00-000830', insuredName:'Diana Torres',
    policyNumber:'5504321098', claimStatus:'Closed', statusType:'closed', lobType:'auto' as const,
    adjusterName:'Carlos Mendez', adjusterPhone:'(214) 555-0261',
    reporterName:'Diana Torres', reportedType:'Self / Insured',
    reportedDate:'2025-03-10', vehicle:'2023 Chevrolet Tahoe LT 4WD',
    dateOfLoss:'2025-03-10', lossType:'Collision — Intersection (Other Driver At Fault)',
    repairShop:'Hendrick Collision Center — Dallas (5700 LBJ Fwy)',
    rentalInfo:'Enterprise — Closed Apr 3, 2025. 24 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Repairs completed at Hendrick Collision. Settlement of $11,840 paid. Other driver 100% at fault — subrogation demand filed for your $500 deductible recovery.',
    notes:[
      { adjuster:'Carlos Mendez', date:'Mar 28, 2025', message:'QC inspection failed Mar 26 — paint texture mismatch on rear quarter panel. Shop scheduled rework. QC passed Mar 28. Vehicle delivered Mar 31.' },
      { adjuster:'Carlos Mendez', date:'Mar 12, 2025', message:'Police report #DPD-2025-03891 received via LexisNexis automated retrieval. Other driver cited for running red light. 100% liability confirmed. Subrogation to recover Diana\'s $500 deductible.' },
      { adjuster:'Carlos Mendez', date:'Mar 10, 2025', message:'Intersection collision, other driver at fault per Diana\'s statement (collected via HiMarley guided questionnaire) and witness corroboration. $500 collision deductible applies pending subrogation.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-7741', payTo:'Hendrick Collision Center', grossAmount:11340, issueDate:'2025-04-01', scheduledSendDate:'', status:'Cleared' },
    ],
    contacts:[
      { name:'Diana Torres',                role:'Insured',         createdDate:'Mar 10, 2025', phone:'(469) 555-0501', email:'diana.torres@email.com'         },
      { name:'Carlos Mendez',               role:'Adjuster',        createdDate:'Mar 10, 2025', phone:'(214) 555-0261', email:'carlos.mendez@valuemumt.com'    },
      { name:'Hendrick Collision Dallas',   role:'Repair Shop',     createdDate:'Mar 14, 2025', phone:'(214) 555-0900', email:'dallas@hendrickcollision.com'   },
      { name:'Enterprise Rent-A-Car',       role:'Rental Provider', createdDate:'Mar 11, 2025', phone:'(469) 555-0400', email:'dallas.rental@enterprise.com'  },
      { name:'Other Driver (John Keller)',  role:'Third Party',     createdDate:'Mar 10, 2025', phone:'(214) 555-0999', email:'—'                              },
    ],
    services:[
      { serviceNumber:'SRV-830-001', serviceType:'Collision Repair',     provider:'Hendrick Collision Dallas', serviceStatus:'Completed',   expectedCompletion:'Mar 28, 2025' },
      { serviceNumber:'SRV-830-002', serviceType:'Rental Vehicle',       provider:'Enterprise Rent-A-Car',    serviceStatus:'Completed',   expectedCompletion:'Apr 03, 2025' },
      { serviceNumber:'SRV-830-003', serviceType:'Subrogation Recovery', provider:'ISO ARB Forum',             serviceStatus:'In Progress', expectedCompletion:'Ongoing'      },
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL Submitted — Intersection Collision, #000-00-000830',         sub:'Claim created. Collision coverage confirmed. $500 deductible applies. ISO ClaimSearch: no prior claims on VIN or identity. HiMarley thread opened.',                                                                  date:'Mar 10, 2025 · 4:22 PM',  status:'done', badge:'✓ Filed'       },
      { id:2,  category:'General',    title:'Carlos Mendez Assigned — Liability Investigation Opened',          sub:'Carlos Mendez (Collision — Team C). HiMarley guided statement questionnaire sent to Diana. Statement completed in 8 minutes: intersection diagram, signal status, witness contact info collected.',                    date:'Mar 10, 2025 · 5:00 PM',  status:'done', badge:'✓ Complete'    },
      { id:3,  category:'General',    title:'Police Report Retrieved — LexisNexis Automated Retrieval',         sub:'Police report #DPD-2025-03891 retrieved automatically via LexisNexis API (eliminates manual DMV follow-up). Other driver cited for running red light. Witness statement attached. 100% liability confirmed.',        date:'Mar 12, 2025',            status:'done', badge:'✓ Retrieved'   },
      { id:4,  category:'General',    title:'Liability Determined — Other Driver 100% At Fault',                sub:'Police report + Diana\'s HiMarley statement + witness confirm John Keller ran red light. Subrogation initiated via ISO ARB Forum to recover Diana\'s $500 deductible.',                                              date:'Mar 12, 2025',            status:'done', badge:'✓ Confirmed'   },
      { id:5,  category:'Rental',     title:'Enterprise Rental Reserved & Picked Up',                           sub:'Enterprise ARMS: Reservation confirmed (#ENT-20341). 2023 Chevy Equinox. Pickup Mar 11, 9:00 AM. ARMS confirms pickup event — rental clock started.',                                                               date:'Mar 11, 2025',            status:'done', badge:'✓ Active'      },
      { id:6,  category:'Inspection', title:'DRP Shop Assigned — Hendrick Collision Dallas',                    sub:'Hendrick Collision selected via CCC Engage DRP network. OEM-certified for GM vehicles. Shop notified via Mitchell WorkCenter. Drop-off: Mar 14.',                                                                    date:'Mar 13, 2025',            status:'done', badge:'✓ Assigned'    },
      { id:7,  category:'Inspection', title:'Vehicle Received — Teardown & Disassembly Started',                sub:'Vehicle checked in via CCC ONE Mar 14, 8:45 AM. Initial teardown started. Hidden damage discovery phase. Member prompted not to call shop — CCC UpdatePlus will notify proactively.',                                date:'Mar 14, 2025 · 8:45 AM',  status:'done', badge:'✓ Complete'    },
      { id:8,  category:'Inspection', title:'Estimate Completed & Approved — $12,340 (CCC Estimate STP)',      sub:'Full CCC line-item estimate: structural repair rear frame $4,200, body $3,800, paint $2,100, ADAS sensors $2,240. Approved by Carlos Mendez. Repairs begin Mar 17.',                                                 date:'Mar 15–16, 2025',         status:'done', badge:'✓ Approved'    },
      { id:9,  category:'Repair',     title:'Parts Ordered — GM OEM Parts, ETA Mar 19',                        sub:'GM OEM structural, body, and ADAS parts ordered via CCC ONE integrated parts ordering. Supplier ETA confirmed Mar 19. Body work begins on arrival.',                                                                  date:'Mar 16, 2025',            status:'done', badge:'✓ Ordered'     },
      { id:10, category:'Repair',     title:'Body Repair Started',                                              sub:'CCC ONE UpdatePlus: "Repairs have started on your Tahoe." Body repair phase logged in Mitchell RepairCenter.',                                                                                                        date:'Mar 19, 2025',            status:'done', badge:'✓ Started'     },
      { id:11, category:'Repair',     title:'Vehicle in Paint Booth',                                           sub:'CCC ONE UpdatePlus: "Your Tahoe is in the paint booth — typically 2 days." Mitchell RepairCenter paint phase observable via OData API.',                                                                              date:'Mar 24, 2025',            status:'done', badge:'✓ In Progress' },
      { id:12, category:'Repair',     title:'QC Failed — Paint Texture Mismatch, Rework Ordered',               sub:'QC inspection Mar 26: rear quarter panel paint texture mismatch vs. OEM finish. Shop assigned rework task. Completion date revised to Mar 28. HiMarley: "A minor quality issue was found — your shop is correcting it at no cost or delay to you."', date:'Mar 26, 2025',  status:'done', badge:'✓ Rework'      },
      { id:13, category:'Repair',     title:'QC Rework Complete — Second Inspection Passed',                    sub:'Rework completed. Second QC inspection passed Mar 28. CCC ONE: paint texture and color match confirmed. Vehicle cleared for delivery.',                                                                               date:'Mar 28, 2025',            status:'done', badge:'✓ QC Passed'   },
      { id:14, category:'Repair',     title:'Member Notified — Vehicle Ready for Pickup',                       sub:'CCC ONE Engage pickup notification: shop hours, address, deductible ($500) due at pickup, payment methods. HiMarley + Enterprise ARMS rental return instructions in one SMS.',                                       date:'Mar 28, 2025',            status:'done', badge:'✓ Ready'       },
      { id:15, category:'Repair',     title:'Deductible Collected at Shop — $500',                              sub:'Diana paid $500 deductible directly to Hendrick Collision at vehicle pickup. OneInc integration: deductible payment logged and routed.',                                                                               date:'Mar 31, 2025',            status:'done', badge:'✓ Paid'        },
      { id:16, category:'Rental',     title:'Rental Returned — 24 Days, Fully Covered',                         sub:'Enterprise rental returned Apr 3. ARMS confirms: 24 days, fully covered, no charges to Diana. Billing summary generated.',                                                                                            date:'Apr 03, 2025',            status:'done', badge:'✓ Closed'      },
      { id:17, category:'Payment',    title:'Final Invoice Reconciled — $11,340 to Hendrick via OneInc',        sub:'CCC electronic invoice reconciled against approved estimate. Payment authorized in GW ClaimCenter. Disbursed via OneInc ACH to Hendrick Collision. Cleared Apr 3.',                                                  date:'Apr 01–03, 2025',         status:'done', badge:'✓ Cleared'     },
      { id:18, category:'Payment',    title:'Reserve Adjustment — Final Incurred Costs Reconciled',              sub:'GW ClaimCenter: final reserves adjusted to match actual incurred costs ($12,340 estimate vs $11,340 final — ADAS recal not required). Actuarial reserve released.',                                                 date:'Apr 05, 2025',            status:'done', badge:'✓ Complete'    },
      { id:19, category:'General',    title:'5-Star Survey & Claim Closed — Subrogation Ongoing',               sub:'HiMarley 5-star survey: Diana rated 5 stars. Claim closed Apr 5, 2025. Closing summary sent. ISO ARB Forum subrogation active — we will notify Diana when $500 deductible is recovered.',                          date:'Apr 05, 2025',            status:'done', badge:'✓ Closed'      },
    ],
  },

  /* ── PROPERTY 4: Michael & Susan Park — Hail + Ordinance & Law, ROR, XactAnalysis — GREEN ── */
  '000-00-000831': {
    claimNumber:'000-00-000831', insuredName:'Michael & Susan Park',
    policyNumber:'8803210099', claimStatus:'Open', statusType:'on-track', lobType:'property' as const,
    adjusterName:'Rachel Kim', adjusterPhone:'(214) 555-0277',
    reporterName:'Michael Park', reportedType:'Self / Insured',
    reportedDate:'2025-03-22', vehicle:'N/A — Property Claim',
    dateOfLoss:'2025-03-22', lossType:'Wind / Hail — Roof, Siding + Ordinance & Law (Code Upgrade)',
    repairShop:'N/A — Property Claim',
    rentalInfo:'N/A — Property Claim',
    propertyAddress:'9210 Stonegate Dr, McKinney TX 75070',
    propertyType:'Single Family Dwelling (HO-3 + Ordinance & Law endorsement)',
    peril:'Wind / Hail — Major storm Mar 22, 2025. CAT code DFW-2503.',
    contractor:'Texas Star Roofing & Restoration (Alacrity Network)',
    aleInfo:'N/A — Home habitable during repairs',
    activeStep:6, progressPct:68,
    statusMsg:"Rebuild is in progress. Roofing and siding phases are complete. Interior drywall underway. Ordinance & Law supplement for code-required drip edge and ridge vent upgrades approved. Estimated completion June 12.",
    notes:[
      { adjuster:'Rachel Kim', date:'Apr 15, 2025', message:'XactAnalysis flagged estimate line item for ridge cap labor hours as 12% above regional benchmark. Reviewed and confirmed: steeper-than-average roof pitch (8/12) justifies the variance. Estimate approved as submitted at $34,600 ACV. O&L supplement $4,200 approved separately.' },
      { adjuster:'Rachel Kim', date:'Mar 24, 2025', message:'EagleView Premium Report delivered within 2 hrs: 42 sq roof, 8/12 pitch, 4 penetrations. Verisk storm data: 2.1" hail, 58mph wind Mar 22 McKinney. CAT DFW-2503 applied. Symbility 3D property sketch generated remotely — no field inspection required for initial estimate. ROR letter issued pending O&L coverage confirmation.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-8831', payTo:'Michael & Susan Park',              grossAmount:30240, issueDate:'2025-04-20', scheduledSendDate:'',           status:'Cleared'    },
      { checkNumber:'',              payTo:'Texas Star Roofing & Restoration',  grossAmount:4360,  issueDate:'',           scheduledSendDate:'2025-06-15', status:'Requesting' },
    ],
    contacts:[
      { name:'Michael Park',                     role:'Insured',      createdDate:'Mar 22, 2025', phone:'(972) 555-0610', email:'michael.park@email.com'           },
      { name:'Susan Park',                        role:'Insured',      createdDate:'Mar 22, 2025', phone:'(972) 555-0611', email:'susan.park@email.com'             },
      { name:'Rachel Kim',                        role:'Adjuster',     createdDate:'Mar 23, 2025', phone:'(214) 555-0277', email:'rachel.kim@valuemumt.com'         },
      { name:'Texas Star Roofing & Restoration',  role:'Contractor',   createdDate:'Mar 25, 2025', phone:'(972) 555-0700', email:'claims@texasstarroofing.com'      },
      { name:'City of McKinney Inspections',      role:'Municipality', createdDate:'Apr 05, 2025', phone:'(972) 547-7400', email:'permits@mckinneytexas.org'        },
    ],
    services:[
      { serviceNumber:'SRV-831-001', serviceType:'EagleView Aerial Imagery',        provider:'EagleView / Verisk',         serviceStatus:'Completed',   expectedCompletion:'Mar 23, 2025' },
      { serviceNumber:'SRV-831-002', serviceType:'3D Property Scan (Symbility)',     provider:'Symbility / CoreLogic',      serviceStatus:'Completed',   expectedCompletion:'Mar 24, 2025' },
      { serviceNumber:'SRV-831-003', serviceType:'Xactimate Estimating + XactAnalysis QA', provider:'Verisk / Xactimate', serviceStatus:'Completed',   expectedCompletion:'Apr 12, 2025' },
      { serviceNumber:'SRV-831-004', serviceType:'Roof Replacement (42 sq)',        provider:'Texas Star Roofing',         serviceStatus:'Completed',   expectedCompletion:'May 02, 2025' },
      { serviceNumber:'SRV-831-005', serviceType:'Siding Repair',                   provider:'Texas Star Roofing',         serviceStatus:'Completed',   expectedCompletion:'May 08, 2025' },
      { serviceNumber:'SRV-831-006', serviceType:'Interior Drywall & Finish',       provider:'Texas Star Roofing',         serviceStatus:'In Progress', expectedCompletion:'Jun 12, 2025' },
      { serviceNumber:'SRV-831-007', serviceType:'Ordinance & Law Code Upgrades',   provider:'Texas Star Roofing',         serviceStatus:'Completed',   expectedCompletion:'May 02, 2025' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL — Wind/Hail, #000-00-000831',                                sub:'Claim created. Verisk Geomni geocoding: property matched to CAT DFW-2503 storm footprint (2.1" hail, 58mph wind). CAT code applied automatically. ISO ClaimSearch: clear. HiMarley thread opened. Member uploaded damage photos via text.',    date:'Mar 22, 2025 · 8:30 PM', status:'done',     badge:'✓ Filed'      },
      { id:2,  category:'General',    title:'Rachel Kim Assigned — Subrogation Review Initiated',              sub:'Rachel Kim (CAT — Team NE). HiMarley: adjuster name and direct line shared. Verisk weather data confirms storm cause. Third-party subrogation review initiated (was roofing contractor doing work on roof? No — natural event).',              date:'Mar 23, 2025',           status:'done',     badge:'✓ Complete'   },
      { id:3,  category:'Inspection', title:'EagleView Aerial Imagery Delivered — 42 Sq, 8/12 Pitch',         sub:'EagleView Premium Report via API (2 hr delivery): 42 squares total, 8/12 pitch (steep), 4 penetrations, all slope measurements. Measurements loaded directly into Xactimate — no manual entry.',                                              date:'Mar 23, 2025',           status:'done',     badge:'✓ Delivered'  },
      { id:4,  category:'Inspection', title:'Verisk Storm Data Pulled — 2.1" Hail, 58mph Wind Confirmed',     sub:'Hail size and wind speed at exact property location corroborated vs. member-reported cause of loss. Eliminates coverage dispute. Confirms peril is wind/hail, not pre-existing wear.',                                                         date:'Mar 23, 2025',           status:'done',     badge:'✓ Confirmed'  },
      { id:5,  category:'Inspection', title:'3D Property Scan Generated — Symbility Remote Sketch',            sub:'Symbility / CoreLogic 3D remote sketch: exterior dimensions, room layout, garage, detached structures — all structured for estimating. Full remote scope without field visit. Saved 3–5 days vs. traditional field inspection approach.',         date:'Mar 24, 2025',           status:'done',     badge:'✓ Complete'   },
      { id:6,  category:'General',    title:'Reservation of Rights Letter Issued',                             sub:'O&L endorsement coverage under review — confirmation of when house was built vs. current code requirements needed. ROR issued to Michael and Susan. HiMarley: "We sent a letter explaining we are reviewing one aspect of coverage. This does not mean your claim is denied."', date:'Mar 25, 2025', status:'done', badge:'✓ Issued'    },
      { id:7,  category:'General',    title:'Texas Star Roofing Assigned — Alacrity Network',                  sub:'Texas Star Roofing assigned within Alacrity 48-hr CAT SLA. HiMarley: "Texas Star Roofing has been assigned. They will contact you within 2 hours to schedule site visit."',                                                                    date:'Mar 25, 2025',           status:'done',     badge:'✓ Assigned'   },
      { id:8,  category:'Inspection', title:'Pre-Inspection Reminder & Inspector En Route Notification',       sub:'HiMarley reminder 24 hrs before: "Your inspection is tomorrow Mar 27 at 10 AM." Morning of: "Your inspector David Ruiz is 20 minutes away." Reduces no-shows and missed appointments.',                                                      date:'Mar 26–27, 2025',        status:'done',     badge:'✓ Complete'   },
      { id:9,  category:'Inspection', title:'On-Site Inspection Completed — Cause of Loss & Scope Documented', sub:'Rachel Kim on-site with Symbility mobile app. Full exterior scope: roof (all slopes), siding (north and west elevations), gutters and downspouts. Interior: attic moisture check, no active leak. Photos geo-tagged and mapped to damage zones.', date:'Mar 27, 2025',          status:'done',     badge:'✓ Complete'   },
      { id:10, category:'Inspection', title:'O&L Coverage Confirmed — Ordinance & Law Endorsement Active',    sub:'House built 2003. Current McKinney code requires: drip edge on all eaves (not in original construction), ridge vent system (original had box vents). O&L endorsement covers required upgrades. ROR resolved — full coverage confirmed.',         date:'Apr 02, 2025',           status:'done',     badge:'✓ Confirmed'  },
      { id:11, category:'Inspection', title:'Xactimate Estimate Built — $34,600 (Roof + Siding + Interior)',  sub:'Full Xactimate line items: Roofing 42 sq ($17,800 + O&L upgrades $4,200), siding north/west ($7,400), interior attic-related ceiling repair ($3,200), gutters/downspouts ($2,000). Separate O&L supplement.',                                date:'Apr 10, 2025',           status:'done',     badge:'✓ Built'      },
      { id:12, category:'Inspection', title:'XactAnalysis QA Review — Estimate Approved',                     sub:'Verisk XactAnalysis flagged ridge cap labor hours as 12% above regional benchmark. Rachel Kim reviewed: steep 8/12 pitch justifies variance. Approved as-is. O&L supplement $4,200 separately authorized.',                                    date:'Apr 12–15, 2025',        status:'done',     badge:'✓ Approved'   },
      { id:13, category:'Inspection', title:'Estimate Approved — ACV $30,240 + O&L $4,200 Authorized',       sub:'Total scope: $34,600 dwelling + $4,200 O&L upgrades. ACV payment $30,240 (depreciation $4,360 recoverable). O&L $4,200 paid in full (not subject to depreciation). Texas Star notified to begin repairs.',                                    date:'Apr 18, 2025',           status:'done',     badge:'✓ Authorized' },
      { id:14, category:'Payment',    title:'ACV Payment Issued — $30,240 + O&L $4,200',                     sub:'ACV $30,240 + O&L supplement $4,200 disbursed via OneInc ACH. HiMarley: "Payment sent. You will receive $4,360 (recoverable depreciation) after repairs are complete."',                                                                       date:'Apr 20, 2025',           status:'done',     badge:'✓ Cleared'    },
      { id:15, category:'Rebuild',    title:'Building Permit Issued — City of McKinney',                       sub:'Permit #MCK-2025-03991 issued by City of McKinney. Roofing, siding, and O&L code upgrades authorized. Texas Star roofing crew mobilized.',                                                                                                     date:'Apr 24, 2025',           status:'done',     badge:'✓ Issued'     },
      { id:16, category:'Rebuild',    title:'Roof Replacement Complete — 42 Sq + O&L Upgrades',               sub:'Full tear-off and replacement: OC Duration Pro shingles, synthetic underlayment, ice & water shield, drip edge (O&L), continuous ridge vent system (O&L). City of McKinney roof inspection passed May 2.',                                    date:'Apr 28 – May 2, 2025',   status:'done',     badge:'✓ Complete'   },
      { id:17, category:'Rebuild',    title:'Ordinance & Law — Final Code Inspection Passed',                  sub:'City of McKinney final O&L inspection: drip edge and ridge vent system confirmed code-compliant. Permit closed. O&L portion of claim fully satisfied.',                                                                                          date:'May 02, 2025',           status:'done',     badge:'✓ Passed'     },
      { id:18, category:'Rebuild',    title:'Siding Repairs Complete',                                         sub:'North and west elevations re-sided. Color matched to existing. Texas Star contractor portal: completion photos uploaded and approved.',                                                                                                           date:'May 08, 2025',           status:'done',     badge:'✓ Complete'   },
      { id:19, category:'Rebuild',    title:'Interior Drywall & Finish In Progress',                           sub:'Ceiling repair in attic-adjacent bedroom underway. Drywall, texture, and paint. Texas Star weekly HiMarley update: "Interior finish work is progressing on schedule."',                                                                          date:'May 12–21, 2025',        status:'active',   badge:'● In Progress'},
      { id:20, category:'Rebuild',    title:'Final Punch List & Member Walkthrough',                           sub:'Michael and Susan sign off on all completed work. Digital completion certificate triggers RCV holdback ($4,360) release.',                                                                                                                        date:'Est. Jun 10, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:21, category:'Payment',    title:'RCV Holdback Released — $4,360',                                  sub:'Recoverable depreciation $4,360 released via OneInc after completion certificate. HiMarley: "Your final payment is on its way."',                                                                                                               date:'Est. Jun 12, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:22, category:'General',    title:'5-Star Survey & Claim Closed',                                    sub:'HiMarley closing summary: repair total $34,600 + O&L $4,200, your out-of-pocket $0 (no deductible for wind/hail), ACV + RCV breakdown, rebuild dates, reopen window 60 days.',                                                              date:'Est. ~Jun 14, 2025',      status:'upcoming', badge:'⏳ Scheduled'  },
    ],
  },

  /* ── PROPERTY 5: Elena Vasquez — Water (frozen pipe) + Contents + ALE closed — STEEL ── */
  '000-00-000832': {
    claimNumber:'000-00-000832', insuredName:'Elena Vasquez',
    policyNumber:'3302198700', claimStatus:'Closed', statusType:'closed', lobType:'property' as const,
    adjusterName:'David Nguyen', adjusterPhone:'(214) 555-0288',
    reporterName:'Elena Vasquez', reportedType:'Self / Insured',
    reportedDate:'2025-01-19', vehicle:'N/A — Property Claim',
    dateOfLoss:'2025-01-19', lossType:'Water Damage — Frozen/Burst Pipe (Winter Storm)',
    repairShop:'N/A — Property Claim',
    rentalInfo:'N/A — Property Claim',
    propertyAddress:'1802 Pinewood Ct, Garland TX 75044',
    propertyType:'Single Family Dwelling (HO-3)',
    peril:'Water Damage — Frozen supply pipe burst during Winter Storm Ezra, Jan 19, 2025',
    contractor:'PuroClean of Garland + Allied Restoration Group',
    aleInfo:'Closed — ALE total: $4,200 over 21 days. Hilton Garden Inn Garland. Fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Frozen pipe water damage fully remediated. Rebuild and contents settled. Total claim paid: $38,700. ALE covered 21 days. Thank you — your home is fully restored.',
    notes:[
      { adjuster:'David Nguyen', date:'Apr 02, 2025', message:'Claim closed. Final settlement: dwelling ACV $22,400 + RCV holdback $3,100 released Apr 2. Contents ACV $8,800 + contents RCV $1,400. ALE $4,200. Total: $39,900. Member satisfaction: 5 stars.' },
      { adjuster:'David Nguyen', date:'Jan 22, 2025', message:'Winter Storm Ezra: frozen supply pipe in unheated garage wall burst, affecting garage, utility room, and adjacent kitchen. ISO ClaimSearch: no prior water losses on address. PuroClean dispatched via Alacrity within 3 hrs. ALE authorized — kitchen and utility not functional.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-1920', payTo:'Elena Vasquez (ACV Dwelling)',  grossAmount:22400, issueDate:'2025-02-10', scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2025-1921', payTo:'Elena Vasquez (Contents ACV)',  grossAmount:8800,  issueDate:'2025-02-10', scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2025-2210', payTo:'PuroClean of Garland',          grossAmount:3800,  issueDate:'2025-02-12', scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2025-3301', payTo:'Elena Vasquez (RCV Dwelling)',  grossAmount:3100,  issueDate:'2025-04-02', scheduledSendDate:'', status:'Cleared' },
      { checkNumber:'CHK-2025-3302', payTo:'Elena Vasquez (Contents RCV)',  grossAmount:1400,  issueDate:'2025-04-02', scheduledSendDate:'', status:'Cleared' },
    ],
    contacts:[
      { name:'Elena Vasquez',              role:'Insured',     createdDate:'Jan 19, 2025', phone:'(972) 555-0740', email:'elena.vasquez@email.com'          },
      { name:'David Nguyen',               role:'Adjuster',    createdDate:'Jan 20, 2025', phone:'(214) 555-0288', email:'david.nguyen@valuemumt.com'       },
      { name:'PuroClean of Garland',       role:'Contractor',  createdDate:'Jan 19, 2025', phone:'(972) 555-0815', email:'garland@puroclean.com'            },
      { name:'Allied Restoration Group',   role:'Contractor',  createdDate:'Jan 28, 2025', phone:'(972) 555-0820', email:'claims@alliedrestoration.com'     },
      { name:'Hilton Garden Inn Garland',  role:'ALE Housing', createdDate:'Jan 19, 2025', phone:'(972) 555-0950', email:'garland@hiltongarden.com'         },
    ],
    services:[
      { serviceNumber:'SRV-832-001', serviceType:'Emergency Water Extraction',       provider:'PuroClean of Garland',     serviceStatus:'Completed', expectedCompletion:'Jan 20, 2025' },
      { serviceNumber:'SRV-832-002', serviceType:'Dry-out (Air Movers/Dehumidifiers)',provider:'PuroClean of Garland',     serviceStatus:'Completed', expectedCompletion:'Jan 27, 2025' },
      { serviceNumber:'SRV-832-003', serviceType:'Mold Assessment',                  provider:'EnviroCheck IH Services',  serviceStatus:'Completed', expectedCompletion:'Jan 28, 2025' },
      { serviceNumber:'SRV-832-004', serviceType:'Demo & Rebuild',                   provider:'Allied Restoration Group', serviceStatus:'Completed', expectedCompletion:'Mar 25, 2025' },
      { serviceNumber:'SRV-832-005', serviceType:'Contents Pack-out & Cleaning',     provider:'PuroClean of Garland',     serviceStatus:'Completed', expectedCompletion:'Jan 25, 2025' },
      { serviceNumber:'SRV-832-006', serviceType:'ALE Housing',                      provider:'Hilton Garden Inn Garland',serviceStatus:'Completed', expectedCompletion:'Feb 09, 2025' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'FNOL — Frozen Pipe Burst, Winter Storm, #000-00-000832',        sub:'Burst pipe in garage wall during Winter Storm Ezra. ~4 hrs of water flow. ISO ClaimSearch: no prior water losses on address. ALE authorized immediately. Hilton Garden Inn Garland booked.',                                              date:'Jan 19, 2025 · 11:00 PM', status:'done', badge:'✓ Filed'      },
      { id:2,  category:'General',    title:'David Nguyen Assigned — PuroClean Dispatched 3 hrs',            sub:'David Nguyen (Water — Team G). Direct: (214) 555-0288. PuroClean of Garland dispatched via Alacrity within 3 hrs of FNOL. HiMarley: "PuroClean is on the way. They will arrive by 2 AM."',                                            date:'Jan 19, 2025',            status:'done', badge:'✓ Complete'  },
      { id:3,  category:'ALE',        title:'ALE Authorized — Hilton Garden Inn Garland',                    sub:'ALE authorized up to $200/night. Elena and family checked in Jan 19. HiMarley: "Keep all hotel, meal, and laundry receipts — text photos here. We cover up to $200/night." ALE receipt collection via HiMarley thread begins.',         date:'Jan 19, 2025',            status:'done', badge:'✓ Active'    },
      { id:4,  category:'Mitigation', title:'Emergency Water Extraction & Pipe Emergency Repair',             sub:'PuroClean on-site by 2:15 AM. Emergency plumber dispatched to stop source. Water extraction: garage (500 sq ft), utility room (120 sq ft), kitchen floor (partial). Moisture baseline readings documented at all surfaces.',             date:'Jan 19–20, 2025',         status:'done', badge:'✓ Complete'  },
      { id:5,  category:'Mitigation', title:'Dry-out Equipment Deployed — 12 Air Movers, 4 Dehumidifiers',  sub:'Equipment deployed at all affected areas per IICRC S500. Daily moisture readings: Day 1 readings 28–45% at affected surfaces. Target: ≤12%. HiMarley daily update: "Moisture levels: Day 1 of drying. Estimated 6–8 days."',             date:'Jan 20, 2025',            status:'done', badge:'✓ Complete'  },
      { id:6,  category:'ALE',        title:'ALE Receipts Collected — Day 3 Balance Update',                 sub:'Elena texted hotel, meal, and laundry receipts via HiMarley thread (no email needed). Day 3 balance: $800 of $4,200 total estimated allowance used. HiMarley: "You have used $800 of your ALE allowance so far."',                      date:'Jan 22, 2025',            status:'done', badge:'✓ Tracked'   },
      { id:7,  category:'Inspection', title:'Field Inspection — Damage Scope Documented',                    sub:'David Nguyen on-site with Symbility mobile app. Scope: garage drywall (3 walls), utility room (complete), kitchen subflooring (partial). Plumbing repair scope documented. Photos geo-tagged per room.',                                  date:'Jan 21, 2025',            status:'done', badge:'✓ Complete'  },
      { id:8,  category:'Mitigation', title:'Dry-out Complete — Day 7, All Surfaces ≤12%',                   sub:'Final PuroClean moisture readings: all surfaces ≤12% per IICRC S500. Equipment removed Jan 27. Site cleared for mold assessment and demo.',                                                                                               date:'Jan 27, 2025',            status:'done', badge:'✓ Complete'  },
      { id:9,  category:'Mitigation', title:'Mold Assessment — CLEAR (EnviroCheck IH)',                       sub:'Industrial hygienist EnviroCheck conducted air sampling and surface sampling. Results: all below action levels. Mold-free clearance issued Jan 28. Rebuild can proceed.',                                                                 date:'Jan 28, 2025',            status:'done', badge:'✓ Cleared'   },
      { id:10, category:'Contents',   title:'Contents Pack-out — 312 Items Inventoried via ContentsTrack',   sub:'PuroClean contents pack-out team: 312 salvageable items photographed, cataloged, and cleaned. ContentsTrack mobile app AI auto-populated item descriptions, brands, ages, and replacement values. Items delivered to climate-controlled storage.', date:'Jan 24–25, 2025',    status:'done', badge:'✓ Complete'  },
      { id:11, category:'Inspection', title:'Xactimate Estimate — $25,500 ACV + $3,800 Mitigation Approved', sub:'Full Xactimate rebuild estimate: garage drywall/insulation $5,800, utility room complete $7,200, kitchen subfloor $3,400, plumbing repair $2,800, painting $3,100, miscellaneous $3,200. ACV $25,500. Mitigation $3,800. Both approved Feb 9.',  date:'Feb 05–09, 2025',         status:'done', badge:'✓ Approved'  },
      { id:12, category:'Contents',   title:'Contents Valuation — ACV $8,800 + RCV Available',               sub:'Xactimate Contents module: 312 items valued. ACV $8,800 (depreciation $1,400 recoverable). RCV available after replacement receipts submitted. Items: kitchen appliances, garage tools, utility room equipment. Settlement issued.',          date:'Feb 09, 2025',            status:'done', badge:'✓ Complete'  },
      { id:13, category:'ALE',        title:'ALE Balance Alert — $3,600 Used, $600 Remaining',               sub:'HiMarley ALE balance alert: "You have used $3,600 of your $4,200 ALE allowance. Estimated $600 remaining. Your rebuild is progressing on schedule — you should be home by Feb 10."',                                                     date:'Feb 06, 2025',            status:'done', badge:'✓ Alert'     },
      { id:14, category:'Payment',    title:'ACV Payments Issued — $22,400 Dwelling + $8,800 Contents',      sub:'$22,400 dwelling ACV + $8,800 contents ACV issued via OneInc ACH Feb 10. PuroClean mitigation: $3,800 paid directly. HiMarley: "Payment sent. Keep contents replacement receipts to claim the additional $1,400."',                    date:'Feb 10–12, 2025',         status:'done', badge:'✓ Cleared'   },
      { id:15, category:'Rebuild',    title:'Rebuild Started — Allied Restoration Group',                     sub:'Allied Restoration Group assigned after PuroClean mitigation. Building permit #GRL-2025-00441 issued by City of Garland. Demo, plumbing repair, framing, and drywall begun Jan 28.',                                                       date:'Jan 28, 2025',            status:'done', badge:'✓ Started'   },
      { id:16, category:'ALE',        title:'Member Returns Home — ALE Closed (21 Days, $4,200)',             sub:'Elena and family returned home Feb 9. Kitchen and utility room restored. ALE total: 21 days, $4,200 — fully covered. HiMarley: "Has your family moved back in? Reply YES." Elena replied YES. ALE closed.',                               date:'Feb 09, 2025',            status:'done', badge:'✓ Closed'    },
      { id:17, category:'Rebuild',    title:'Rebuild Complete — City of Garland Inspection Passed',           sub:'Allied Restoration: all scope complete. City of Garland final inspection passed Mar 25. Permit closed. Elena signed digital completion certificate via Alacrity portal.',                                                                   date:'Mar 25, 2025',            status:'done', badge:'✓ Complete'  },
      { id:18, category:'Contents',   title:'Contents Returned + RCV Supplement for Replaced Items',          sub:'Cleaned contents returned Mar 28. Elena submitted replacement receipts (appliances, tools) totaling $1,400. Contents RCV supplement issued. No contents left in storage.',                                                                  date:'Mar 28 – Apr 2, 2025',    status:'done', badge:'✓ Complete'  },
      { id:19, category:'Payment',    title:'RCV Holdback Released — $3,100 Dwelling + $1,400 Contents',     sub:'Completion certificate confirmed. RCV holdback: $3,100 dwelling + $1,400 contents. Both issued via OneInc Apr 2. Total claim paid: $39,900.',                                                                                             date:'Apr 02, 2025',            status:'done', badge:'✓ Cleared'   },
      { id:20, category:'General',    title:'5-Star Survey & Claim Closed',                                   sub:'HiMarley 5-star rating received. Closing summary: dwelling $25,500 + mitigation $3,800 + contents $10,200 + ALE $4,200 = $43,700 total (includes RCV). Reopen 60 days.',                                                               date:'Apr 02, 2025',            status:'done', badge:'✓ Closed'    },
    ],
  },
}

/* ── MOCK POLICIES ── */
const MOCK_POLICIES: Record<string,PolicyClaim[]> = {
  '7407354463': [
    { claimNumber:'000-00-000480', insuredName:'Rosario Marinello', adjusterName:'Emily Rodriguez', status:'Open',   createdDate:'2024-09-15', vehicle:'2022 Honda CR-V EX-L',   lossType:'Collision',     lobType:'auto' },
    { claimNumber:'000-00-000312', insuredName:'Rosario Marinello', adjusterName:'Jonah Egertson',  status:'Closed', createdDate:'2023-06-22', vehicle:'2022 Honda CR-V EX-L',   lossType:'Hail / Weather',lobType:'auto' },
    { claimNumber:'000-00-000201', insuredName:'Rosario Marinello', adjusterName:'Spencer Dunn',    status:'Closed', createdDate:'2022-11-04', vehicle:'2019 Honda Civic LX',    lossType:'Glass / Chip',  lobType:'auto' },
  ],
  '8812047291': [
    { claimNumber:'000-00-000521', insuredName:'Marcus T. Williams', adjusterName:'Scott Henson',   status:'Open',   createdDate:'2025-04-10', vehicle:'2021 Ford F-150 XLT 4WD',lossType:'Hail / Weather',lobType:'auto' },
    { claimNumber:'000-00-000398', insuredName:'Marcus T. Williams', adjusterName:'Jonah Egertson', status:'Closed', createdDate:'2024-03-15', vehicle:'2021 Ford F-150 XLT 4WD',lossType:'Collision',     lobType:'auto' },
  ],
  '5503819042': [
    { claimNumber:'000-00-000612', insuredName:'Jennifer K. Okafor', adjusterName:'Linda Park', status:'Closed', createdDate:'2025-01-08', vehicle:'2020 Toyota Camry SE', lossType:'Vehicle Theft', lobType:'auto' },
  ],
  '6601234500': [
    { claimNumber:'000-00-000750', insuredName:'Sarah Mitchell', adjusterName:'Maria Delgado',   status:'Open',   createdDate:'2025-04-28', vehicle:'4512 Oak Ridge Dr, Plano TX',     lossType:'Wind / Hail',   lobType:'property' },
  ],
  '7702345601': [
    { claimNumber:'000-00-000751', insuredName:'James & Carol Webb', adjusterName:'Kevin Tran',  status:'Open',   createdDate:'2025-05-02', vehicle:'2201 Willow Creek Rd, Frisco TX', lossType:'Water / Burst Pipe', lobType:'property' },
  ],
  '9901234567': [
    { claimNumber:'000-00-006000', insuredName:'David Chen', adjusterName:'Lynzi Farrell',    status:'Open',   createdDate:'2025-05-05', vehicle:'2023 Tesla Model 3 LR',    lossType:'Collision',     lobType:'auto'     },
    { claimNumber:'000-00-006001', insuredName:'David Chen', adjusterName:'Trevor Gunderson', status:'Closed', createdDate:'2025-02-18', vehicle:'2022 BMW X5 xDrive40i',    lossType:'Hail / Weather',lobType:'auto'     },
    { claimNumber:'000-00-006002', insuredName:'David Chen', adjusterName:'Spencer Dunn',     status:'Closed', createdDate:'2024-11-12', vehicle:'2021 Audi A4 Premium Plus', lossType:'Glass',         lobType:'auto'     },
    { claimNumber:'000-00-000752', insuredName:'Robert Chen', adjusterName:'Patricia Vasquez',status:'Closed', createdDate:'2024-08-14', vehicle:'5801 Clearwater Blvd, Allen TX', lossType:'Fire',     lobType:'property' },
    ...Array.from({ length:21 }, (_,i) => ({
      claimNumber:`000-00-00${6003+i}`,
      insuredName: i%3===0?'David Chen':'Sarah Chen',
      adjusterName:['Emily Rodriguez','Scott Henson','Linda Park','Jonah Egertson','Spencer Dunn'][i%5],
      status:'Closed', createdDate:`2024-${String(Math.floor(i/3)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`,
      vehicle:['2023 Tesla Model 3','2022 BMW X5','2021 Audi A4'][i%3],
      lossType:['Collision','Hail','Glass','Collision','Hail'][i%5],
      lobType:'auto' as const,
    })),
  ],
}


/* ═══════════════════════════════════════════════════════════════
   PAGINATION
   ═══════════════════════════════════════════════════════════════ */
function Pagination({ total, page, pageSize, pageSizeOpts, onPage, onPageSize }:{
  total:number; page:number; pageSize:number; pageSizeOpts:number[]
  onPage:(p:number)=>void; onPageSize:(s:number)=>void
}) {
  const totalPages = Math.ceil(total/pageSize) || 1
  const from = (page-1)*pageSize+1, to = Math.min(page*pageSize,total)
  const pages = useMemo(()=>{
    if(totalPages<=7) return Array.from({length:totalPages},(_,i)=>i+1)
    if(page<=4) return [1,2,3,4,5,'...',totalPages]
    if(page>=totalPages-3) return [1,'...',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
    return [1,'...',page-1,page,page+1,'...',totalPages]
  },[page,totalPages])
  const PB = (dis:boolean,fn:()=>void,ch:React.ReactNode) => (
    <button onClick={fn} disabled={dis} style={{ border:`1px solid ${C.border}`,borderRadius:6,width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',background:dis?C.bg:C.white,cursor:dis?'not-allowed':'pointer',opacity:dis?.4:1 }}>{ch}</button>
  )
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderTop:`1px solid ${C.border}`,flexWrap:'wrap',gap:8,background:C.white }}>
      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
        <select value={pageSize} onChange={e=>{onPageSize(Number(e.target.value));onPage(1)}} style={{ fontSize:12,border:`1px solid ${C.border}`,borderRadius:6,padding:'3px 8px',color:C.text }}>
          {pageSizeOpts.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize:12,color:C.muted }}>per page · <strong>{from}–{to}</strong> of <strong>{total}</strong></span>
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:3 }}>
        {PB(page===1,()=>onPage(1),<ChevronsLeft size={13} color={C.muted}/>)}
        {PB(page===1,()=>onPage(page-1),<ChevronLeft size={13} color={C.muted}/>)}
        {pages.map((p,i)=>(
          <button key={i} onClick={()=>typeof p==='number'&&onPage(p)} disabled={p==='...'}
            style={{ border:`1px solid ${p===page?C.navy:C.border}`,borderRadius:6,minWidth:30,height:30,padding:'0 6px',fontSize:12,fontWeight:p===page?700:400,background:p===page?C.navy:C.white,color:p===page?C.white:p==='...'?C.faint:C.text,cursor:p==='...'?'default':'pointer' }}>
            {p}
          </button>
        ))}
        {PB(page===totalPages,()=>onPage(page+1),<ChevronRight size={13} color={C.muted}/>)}
        {PB(page===totalPages,()=>onPage(totalPages),<ChevronsRight size={13} color={C.muted}/>)}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STATUS CARD
   ═══════════════════════════════════════════════════════════════ */
function StatusCard({ claim }: { claim:ClaimData }) {
  const isAmber  = claim.statusType === 'action-needed'
  const isClosed = claim.statusType === 'closed'
  const bg = isClosed ? 'linear-gradient(135deg,#1A2744 0%,#1E3A6B 60%,#24488A 100%)'
           : isAmber  ? 'linear-gradient(135deg,#7C3A00 0%,#B85A00 60%,#D97706 100%)'
           :             'linear-gradient(135deg,#0A5C2E 0%,#1B8A4B 60%,#25A85C 100%)'
  const icon  = isClosed ? '🎉' : isAmber ? '⚡' : '✓'
  const title = isClosed ? 'Claim fully resolved'
              : isAmber  ? 'Action needed — please review'
              : "You're on track — no action needed"
  const eta   = isClosed ? 'Claim closed' : isAmber ? 'Response needed' : 'Est. completion May 28'
  return (
    <div style={{ background:bg,borderRadius:12,padding:'14px 18px',marginBottom:12,position:'relative',overflow:'hidden',display:'flex',alignItems:'center',gap:16,boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
      {[{w:120,h:120,t:-40,b:'auto',r:120},{w:80,h:80,t:'auto',b:-30,r:60},{w:60,h:60,t:-20,b:'auto',r:20}].map((c,i)=>(
        <div key={i} style={{ position:'absolute',borderRadius:'50%',background:'rgba(255,255,255,.07)',width:c.w,height:c.h,top:c.t as number,bottom:c.b as number,right:c.r,pointerEvents:'none' }}/>
      ))}
      <div style={{ width:50,height:50,borderRadius:'50%',flexShrink:0,zIndex:1,background:'rgba(255,255,255,.15)',border:'2px solid rgba(255,255,255,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>{icon}</div>
      <div style={{ flex:1,zIndex:1,minWidth:0 }}>
        <div style={{ fontSize:14,fontWeight:700,color:'#fff',marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:12,color:'rgba(255,255,255,.85)',lineHeight:1.55 }}>{claim.statusMsg}</div>
      </div>
      <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,zIndex:1,flexShrink:0 }}>
        <div style={{ background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:20,padding:'4px 12px',fontSize:11,fontWeight:700,color:'#fff',whiteSpace:'nowrap' }}>{eta}</div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:22,fontWeight:800,color:'rgba(255,255,255,.95)',lineHeight:1 }}>{claim.progressPct}%</div>
          <div style={{ fontSize:10,color:'rgba(255,255,255,.6)',marginTop:2 }}>Complete</div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DOMINO TRACKER
   ═══════════════════════════════════════════════════════════════ */
function ClaimTracker({ claim }: { claim:ClaimData }) {
  const isClosed  = claim.statusType === 'closed'
  const pct       = claim.progressPct
  const STEPS     = claim.lobType === 'property' ? PROP_STEPS : AUTO_STEPS
  const lobBadge  = claim.lobType === 'property'
    ? { label:'Property', bg:'#E1F5EE', color:'#0F6E56' }
    : { label:'Auto',     bg:C.bluePale, color:C.navy }
  return (
    <div style={{ background:C.white,borderBottom:`1px solid ${C.border}`,padding:'14px 20px 12px' }}>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}>
        <span style={{ fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:12,background:lobBadge.bg,color:lobBadge.color,border:`1px solid ${lobBadge.color}33` }}>
          {lobBadge.label} Claim
        </span>
        {claim.lobType==='property'&&claim.propertyAddress&&(
          <span style={{ fontSize:11,color:C.muted }}>📍 {claim.propertyAddress}</span>
        )}
      </div>
      <StatusCard claim={claim} />
      <div style={{ fontSize:10,fontWeight:700,color:C.faint,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8 }}>Claim Progress</div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:2,marginBottom:7 }}>
        {STEPS.map((s,i)=>{
          const n=i+1,done=n<claim.activeStep||isClosed,act=n===claim.activeStep&&!isClosed
          return <div key={s} style={{ textAlign:'center',fontSize:10,fontWeight:600,lineHeight:1.3,color:done||isClosed?'#1B5E20':act?C.navy:C.faint }}>{s.split('\n').map((l,j)=><div key={j}>{l}</div>)}</div>
        })}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:2,height:38,borderRadius:7,overflow:'hidden',background:'#E8EDF2' }}>
        {STEPS.map((_,i)=>{
          const n=i+1,done=n<claim.activeStep||isClosed,act=n===claim.activeStep&&!isClosed
          return (
            <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',borderRadius:3,background:done||isClosed?C.green:act?C.navy:'#DDE3EA',animation:act?'pulse-seg 2s ease-out infinite':'none' }}>
              {(done||isClosed)&&<span style={{ fontSize:13,fontWeight:700,color:C.white,position:'relative',zIndex:2 }}>✓</span>}
              {act&&<><span style={{ fontSize:9,color:C.white,letterSpacing:2,position:'relative',zIndex:2 }}>● ● ●</span><div style={{ position:'absolute',top:0,left:0,width:'45%',height:'100%',zIndex:1,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)',animation:'shimmer 1.7s ease-in-out infinite' }}/></>}
              {!done&&!act&&!isClosed&&<span style={{ fontSize:12,fontWeight:600,color:'#B0BEC5' }}>{n}</span>}
            </div>
          )
        })}
      </div>
      <div style={{ height:3,background:'#E2E8F2',borderRadius:3,marginTop:5,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.green},${C.navy})`,borderRadius:3,position:'relative',overflow:'hidden',transition:'width 1s ease' }}>
          <div style={{ position:'absolute',top:0,right:0,width:'35%',height:'100%',background:'linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent)',animation:isClosed?'none':'shine 1.8s ease-in-out infinite' }}/>
        </div>
      </div>
      <div style={{ fontSize:10,color:C.faint,textAlign:'center',marginTop:4 }}>{isClosed?'Claim fully resolved':'Tap any step to view details'}</div>
      <style>{`@keyframes shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(250%)}} @keyframes shine{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}} @keyframes pulse-seg{0%{box-shadow:0 0 0 0 rgba(2,64,153,.5)}70%{box-shadow:0 0 0 6px rgba(2,64,153,0)}100%{box-shadow:0 0 0 0 rgba(2,64,153,0)}}`}</style>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CLAIM DETAIL — 4 tabs, all with real data
   ═══════════════════════════════════════════════════════════════ */

function ClaimDetail({ claim }: { claim:ClaimData }) {
  const [tab,    setTab]    = useState<'coverage'|'info'|'payments'|'contacts'|'services'|'documents'>('coverage')
  const [tabView,setTabView]= useState(true)
  const [noteQ,  setNoteQ]  = useState('')
  const [payQ,   setPayQ]   = useState('')
  const [conQ,   setConQ]   = useState('')
  const [svcQ,   setSvcQ]   = useState('')
  const [tlFilter,setTlFilter]=useState('All Events')
  const [tlSort, setTlSort] = useState<'latest'|'oldest'>('latest')
  const [payPage,setPayPage]= useState(1)
  const [paySize,setPaySize]= useState(10)
  const [conPage,setConPage]= useState(1)
  const [svcPage,setSvcPage]= useState(1)

  const TH = { background:C.tblHead }
  const catColor = (c:EvtCategory) => c==='Repair'?C.orange:c==='Rental'?C.purple:c==='Payment'?C.blue:c==='Inspection'?C.green:c==='Mitigation'?'#A32D2D':c==='Rebuild'?'#26215C':c==='ALE'?'#633806':c==='Contents'?'#854F0B':C.text
  const dotColor = (s:string) => s==='done'?C.green:s==='active'?C.navy:'transparent'
  const badgeSt  = (s:string): React.CSSProperties => ({
    display:'inline-flex',fontSize:9.5,fontWeight:700,padding:'1px 7px',borderRadius:10,marginTop:3,
    background:s==='done'?C.greenLight:s==='active'?C.bluePale:'#EFF6FF',
    color:s==='done'?'#1B5E20':s==='active'?C.navy:'#1D4ED8',
    border:`1px solid ${s==='done'?C.greenBorder:s==='active'?C.blueBorder:'#BFDBFE'}`,
  })

  const cats: EvtCategory[] = claim.lobType==='property'
    ? ['General','Inspection','Mitigation','Rebuild','ALE','Contents','Payment']
    : ['General','Repair','Rental','Payment','Inspection']
  const filtTl  = claim.timeline.filter(e=>tlFilter==='All Events'||e.category===tlFilter)
  // Group into 3 sections — never mix statuses
  const doneTl  = [...filtTl.filter(e=>e.status==='done')].sort((a,b)=>tlSort==='latest'?b.id-a.id:a.id-b.id)
  const activeTl= filtTl.filter(e=>e.status==='active')
  const upTl    = filtTl.filter(e=>e.status==='upcoming')
  const ordTl   = [...doneTl, ...activeTl, ...upTl]

  const filtPay = claim.payments.filter(p=>[p.payTo,p.status,String(p.grossAmount)].some(v=>v.toLowerCase().includes(payQ.toLowerCase())))
  const pagedPay = filtPay.slice((payPage-1)*paySize,payPage*paySize)
  const filtCon = claim.contacts.filter(c=>[c.name,c.role,c.phone,c.email].some(v=>v.toLowerCase().includes(conQ.toLowerCase())))
  const pagedCon = filtCon.slice((conPage-1)*10,conPage*10)
  const filtSvc = claim.services.filter(s=>[s.serviceNumber,s.serviceType,s.provider,s.serviceStatus].some(v=>v.toLowerCase().includes(svcQ.toLowerCase())))
  const pagedSvc = filtSvc.slice((svcPage-1)*10,svcPage*10)

  const FIELD = (label:string,value:string,api:string) => (
    <div style={{ display:'grid',gridTemplateColumns:'130px 1fr',padding:'7px 0',borderBottom:`1px solid ${C.bg}` }} title={api}>
      <span style={{ fontSize:11.5,color:C.faint,fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:11.5,fontWeight:600,color:label==='Claim Status'?(value==='Open'?C.green:value==='Closed'?C.muted:'#E65100'):C.text }}>{value||'—'}</span>
    </div>
  )

  const InfoTab = () => (
    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',height:480,overflow:'hidden' }}>
      {/* LEFT */}
      <div style={{ borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',overflow:'hidden' }}>
        <div style={{ overflowY:'auto',flex:1,padding:'14px 16px' }}>
          {FIELD('Insured Name',  claim.insuredName,  '🔌 GW: claim.insured.displayName')}
          {FIELD('Policy Number', claim.policyNumber, '🔌 GW: claim.policy.policyNumber')}
          {FIELD('Claim Status',  claim.claimStatus,  '🔌 GW: claim.state')}
          {FIELD('Adjuster',      claim.adjusterName, '🔌 GW: claim.assignedUser.displayName')}
          {FIELD('Adj. Phone',    claim.adjusterPhone,'🔌 GW: claim.assignedUser.phoneNumber')}
          {FIELD('Reporter',      claim.reporterName, '🔌 GW: claim.reporter.displayName')}
          {FIELD('Reported Type', claim.reportedType, '🔌 GW: claim.reportedByType')}
          {FIELD('Reported Date', claim.reportedDate, '🔌 GW: claim.reportedDate')}
          {FIELD('Date of Loss',  claim.dateOfLoss,   '🔌 GW: claim.dateOfLoss')}
          {FIELD('Loss Type',     claim.lossType,     '🔌 GW: claim.lossType')}
          {claim.lobType==='property'
            ? <>
                {FIELD('Property Address', claim.propertyAddress||'—',  '🔌 GW: claim.property.address')}
                {FIELD('Property Type',    claim.propertyType||'—',     '🔌 GW: claim.property.type')}
                {FIELD('Peril',            claim.peril||'—',            '🔌 GW: claim.peril')}
                {FIELD('Contractor',       claim.contractor||'—',       '🔌 Alacrity: contractor.name')}
                {FIELD('ALE Status',       claim.aleInfo||'N/A',        '🔌 GW: claim.ale.summary')}
              </>
            : <>
                {FIELD('Vehicle',      claim.vehicle,    '🔌 GW: claim.vehicle.displayName')}
                {FIELD('Repair Shop',  claim.repairShop, '🔌 CCC Secure Share: shop.name')}
                {FIELD('Rental',       claim.rentalInfo, '🔌 Enterprise ARMS: reservation.summary')}
              </>
          }
          <div style={{ fontSize:11,fontWeight:700,color:C.text,textTransform:'uppercase',letterSpacing:'.04em',margin:'14px 0 6px' }}>📝 Notes</div>
          <div style={{ background:C.tblHead,borderRadius:'5px 5px 0 0',padding:'6px 10px',display:'flex',alignItems:'center',gap:5 }}>
            <Search size={13} color="rgba(255,255,255,.6)"/>
            <input value={noteQ} onChange={e=>setNoteQ(e.target.value)} placeholder="Search notes..." style={{ background:'transparent',border:'none',outline:'none',color:C.white,fontSize:11.5,flex:1 } as any}/>
          </div>
          <table style={{ width:'100%',borderCollapse:'collapse',border:`1px solid ${C.border}`,borderTop:'none',fontSize:11.5 }}>
            <thead style={TH}><tr>{['Adjuster','Date','Message'].map(h=><th key={h} style={{ padding:'6px 9px',textAlign:'left',color:C.white,fontWeight:600,fontSize:11 }}>{h}</th>)}</tr></thead>
            <tbody>
              {claim.notes.filter(n=>!noteQ||n.message.toLowerCase().includes(noteQ.toLowerCase())).map((n,i)=>(
                <tr key={i} style={{ background:i%2?C.rowAlt:C.white }}>
                  <td style={{ padding:'6px 9px',color:C.text }}>{n.adjuster}</td>
                  <td style={{ padding:'6px 9px',color:C.text,whiteSpace:'nowrap' }}>{n.date}</td>
                  <td style={{ padding:'6px 9px',color:C.text }}>{n.message}</td>
                </tr>
              ))}
              {claim.notes.length===0&&<tr><td colSpan={3} style={{ padding:16,textAlign:'center',color:C.faint }}>No notes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {/* RIGHT — Timeline */}
      <div style={{ display:'flex',flexDirection:'column',overflow:'hidden' }}>
        <div style={{ padding:'12px 14px 10px',borderBottom:`1px solid ${C.border}`,flexShrink:0,background:C.white }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
            <span style={{ fontSize:13,fontWeight:700,color:C.text }}>〜 Claim Timeline</span>
            <span style={{ fontSize:10.5,color:C.faint }}>{claim.timeline.length} events</span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
            <span style={{ fontSize:11,color:C.muted }}>Filter:</span>
            <select value={tlFilter} onChange={e=>setTlFilter(e.target.value)} style={{ fontSize:11.5,border:`1px solid ${C.border}`,borderRadius:6,padding:'3px 8px',color:C.text,background:C.white }}>
              <option>All Events</option>{cats.map(c=><option key={c}>{c}</option>)}
            </select>
            <span style={{ fontSize:11,color:C.muted,marginLeft:4 }}>Sort:</span>
            <div style={{ display:'flex',border:`1px solid ${C.border}`,borderRadius:6,overflow:'hidden' }}>
              {(['latest','oldest'] as const).map(s=>(
                <button key={s} onClick={()=>setTlSort(s)} style={{ fontSize:11,fontWeight:600,padding:'4px 10px',border:'none',cursor:'pointer',background:tlSort===s?C.navy:C.white,color:tlSort===s?C.white:C.muted,display:'flex',alignItems:'center',gap:3,whiteSpace:'nowrap' }}>
                  <ArrowUpDown size={10}/>{s==='latest'?'↓ Latest first':'↑ Oldest first'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ overflowY:'auto',flex:1,padding:'8px 14px' }}>
          {ordTl.map((evt,i)=>{
            const isPend=evt.status==='upcoming', isAct=evt.status==='active'
                        const showDiv = (ordTl[i-1]?.status==='done' && evt.status==='active') || (ordTl[i-1]?.status==='active' && evt.status==='upcoming')
            return (
              <div key={evt.id}>
                <div style={{ display:'flex',gap:8,padding:'9px 0',borderBottom:i<ordTl.length-1?`1px solid ${C.bg}`:'none' }}>
                  <div style={{ display:'flex',flexDirection:'column',alignItems:'center',width:14,flexShrink:0 }}>
                    <div style={{ width:9,height:9,borderRadius:'50%',marginTop:4,flexShrink:0,background:dotColor(evt.status),border:isPend?'2px solid #4A8FD4':'none',boxShadow:isAct?`0 0 0 3px rgba(2,64,153,.2)`:'none' }}/>
                    {i<ordTl.length-1&&<div style={{ width:2,flex:1,marginTop:3,background:evt.status==='done'?C.green:isAct?`linear-gradient(${C.navy},#93C5FD)`:isPend?'repeating-linear-gradient(to bottom,#93C5FD 0,#93C5FD 4px,transparent 4px,transparent 8px)':'#DDE3EA' }}/>}
                  </div>
                  <div style={{ flex:1,
                    ...(isAct?{background:C.bluePale,borderRadius:7,padding:'8px 10px',margin:'-2px -4px'}:{}),
                    ...(isPend?{background:'#F8FBFF',borderRadius:7,padding:'6px 8px',margin:'-2px -4px',borderLeft:'3px solid #93C5FD'}:{})
                  }}>
                    <div style={{ fontSize:9.5,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'.05em',color:isPend?'#2563EB':catColor(evt.category),marginBottom:1 }}>{evt.category}{isPend?' · Upcoming':''}</div>
                    <div style={{ fontSize:12,fontWeight:600,color:isAct?C.navy:isPend?'#1E40AF':C.text,lineHeight:1.3,marginBottom:1 }}>{evt.title}</div>
                    <div style={{ fontSize:11,color:isAct?C.blue:isPend?'#3B5998':C.mid,lineHeight:1.4 }}>{evt.sub}</div>
                    <div style={{ fontSize:10,color:isAct?'#6B8EC7':isPend?'#60A5FA':C.faint,marginTop:2 }}>{evt.date}</div>
                    <span style={badgeSt(evt.status)}>{isPend?'⏳ Scheduled':evt.badge}</span>
                  </div>
                </div>
                {showDiv&&(
                  <div style={{ textAlign:'center',padding:'5px 0',fontSize:10,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',borderTop:`1px dashed ${C.border}`,margin:'2px 0',
                    color: ordTl[i]?.status==='active' ? C.navy : '#60A5FA' }}>
                    {ordTl[i]?.status==='active' ? '⟳  In Progress' : '⏳  Upcoming'}
                  </div>
                )}
              </div>
            )
          })}
          {ordTl.length===0&&<div style={{ textAlign:'center',padding:24,fontSize:12,color:C.faint }}>No events match filter.</div>}
        </div>
      </div>
    </div>
  )

  const PaymentsTab = () => (
    <div style={{ background:C.white }}>
      <div style={{ background:C.tblHead,padding:'8px 12px',display:'flex',alignItems:'center',gap:6 }}>
        <Search size={14} color="rgba(255,255,255,.6)"/>
        <input value={payQ} onChange={e=>{setPayQ(e.target.value);setPayPage(1)}} placeholder="Search payments..." style={{ background:'transparent',border:'none',outline:'none',color:C.white,fontSize:12,flex:1 } as any}/>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12.5 }}>
          <thead style={TH}><tr>{['Check Number','Pay To','Gross Amount','Issue Date','Scheduled Send Date','Status'].map(h=><th key={h} style={{ padding:'9px 12px',textAlign:'left',color:C.white,fontWeight:600,fontSize:12,borderRight:`1px solid rgba(255,255,255,.1)`,whiteSpace:'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>
            {pagedPay.length===0
              ? <tr><td colSpan={6} style={{ padding:24,textAlign:'center',color:C.faint }}>No payments found</td></tr>
              : pagedPay.map((p,i)=>(
                <tr key={i} style={{ background:i%2?C.rowAlt:C.white }}>
                  <td style={{ padding:'8px 12px',color:C.text }}>{p.checkNumber||'—'}</td>
                  <td style={{ padding:'8px 12px',color:C.blue,fontWeight:500 }}>{p.payTo}</td>
                  <td style={{ padding:'8px 12px',color:C.text,fontWeight:600 }}>${p.grossAmount.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                  <td style={{ padding:'8px 12px',color:C.text }}>{p.issueDate||'—'}</td>
                  <td style={{ padding:'8px 12px',color:C.text }}>{p.scheduledSendDate||'—'}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:12,background:p.status==='Cleared'?C.greenLight:p.status==='Notifying'?C.bluePale:'#FFF3E0',color:p.status==='Cleared'?'#1B5E20':p.status==='Notifying'?C.navy:'#E65100',border:`1px solid ${p.status==='Cleared'?C.greenBorder:p.status==='Notifying'?C.blueBorder:'#FFCC80'}` }}>{p.status}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination total={filtPay.length} page={payPage} pageSize={paySize} pageSizeOpts={[5,10,25]} onPage={setPayPage} onPageSize={setPaySize}/>
      <div style={{ fontSize:10,color:'#C0CAD8',padding:'4px 14px 8px' }}>🔌 GW: GET /claim/{claim.claimNumber}/checks</div>
    </div>
  )

  const ContactsTab = () => (
    <div style={{ background:C.white }}>
      <div style={{ background:C.tblHead,padding:'8px 12px',display:'flex',alignItems:'center',gap:6 }}>
        <Search size={14} color="rgba(255,255,255,.6)"/>
        <input value={conQ} onChange={e=>{setConQ(e.target.value);setConPage(1)}} placeholder="Search contacts..." style={{ background:'transparent',border:'none',outline:'none',color:C.white,fontSize:12,flex:1 } as any}/>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12.5 }}>
          <thead style={TH}><tr>{['Name','Role','Created Date','Phone','Email'].map(h=><th key={h} style={{ padding:'9px 12px',textAlign:'left',color:C.white,fontWeight:600,fontSize:12,borderRight:`1px solid rgba(255,255,255,.1)` }}>{h}</th>)}</tr></thead>
          <tbody>
            {pagedCon.length===0
              ? <tr><td colSpan={5} style={{ padding:24,textAlign:'center',color:C.faint }}>No contacts found</td></tr>
              : pagedCon.map((c,i)=>(
                <tr key={i} style={{ background:i%2?C.rowAlt:C.white }}>
                  <td style={{ padding:'8px 12px',color:C.blue,fontWeight:600 }}>{c.name}</td>
                  <td style={{ padding:'8px 12px' }}><span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,background:c.role==='Adjuster'?C.bluePale:c.role==='Insured'?C.greenLight:'#F5F5F5',color:c.role==='Adjuster'?C.navy:c.role==='Insured'?'#1B5E20':'#616161',border:`1px solid ${c.role==='Adjuster'?C.blueBorder:c.role==='Insured'?C.greenBorder:'#E0E0E0'}` }}>{c.role}</span></td>
                  <td style={{ padding:'8px 12px',color:C.text }}>{c.createdDate}</td>
                  <td style={{ padding:'8px 12px',color:C.text }}>{c.phone}</td>
                  <td style={{ padding:'8px 12px',color:C.blue }}>{c.email}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination total={filtCon.length} page={conPage} pageSize={10} pageSizeOpts={[10,25]} onPage={setConPage} onPageSize={()=>{}}/>
      <div style={{ fontSize:10,color:'#C0CAD8',padding:'4px 14px 8px' }}>🔌 GW: GET /claim/{claim.claimNumber}/contacts</div>
    </div>
  )

  const ServicesTab = () => (
    <div style={{ background:C.white }}>
      <div style={{ background:C.tblHead,padding:'8px 12px',display:'flex',alignItems:'center',gap:6 }}>
        <Search size={14} color="rgba(255,255,255,.6)"/>
        <input value={svcQ} onChange={e=>{setSvcQ(e.target.value);setSvcPage(1)}} placeholder="Search services..." style={{ background:'transparent',border:'none',outline:'none',color:C.white,fontSize:12,flex:1 } as any}/>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12.5 }}>
          <thead style={TH}><tr>{['Service Number','Service Type','Provider','Status','Expected Completion'].map(h=><th key={h} style={{ padding:'9px 12px',textAlign:'left',color:C.white,fontWeight:600,fontSize:12,borderRight:`1px solid rgba(255,255,255,.1)`,whiteSpace:'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>
            {pagedSvc.length===0
              ? <tr><td colSpan={5} style={{ padding:24,textAlign:'center',color:C.faint }}>No services found</td></tr>
              : pagedSvc.map((s,i)=>(
                <tr key={i} style={{ background:i%2?C.rowAlt:C.white }}>
                  <td style={{ padding:'8px 12px',color:C.blue,fontWeight:600 }}>{s.serviceNumber}</td>
                  <td style={{ padding:'8px 12px',color:C.text }}>{s.serviceType}</td>
                  <td style={{ padding:'8px 12px',color:C.text }}>{s.provider}</td>
                  <td style={{ padding:'8px 12px' }}>
                    <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:10,
                      background:s.serviceStatus==='Completed'?C.greenLight:s.serviceStatus==='Active'||s.serviceStatus==='In Progress'?C.bluePale:'#FFF8E1',
                      color:s.serviceStatus==='Completed'?'#1B5E20':s.serviceStatus==='Active'||s.serviceStatus==='In Progress'?C.navy:'#E65100',
                      border:`1px solid ${s.serviceStatus==='Completed'?C.greenBorder:s.serviceStatus==='Active'||s.serviceStatus==='In Progress'?C.blueBorder:'#FFCC80'}` }}>
                      {s.serviceStatus}
                    </span>
                  </td>
                  <td style={{ padding:'8px 12px',color:C.text }}>{s.expectedCompletion}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Pagination total={filtSvc.length} page={svcPage} pageSize={10} pageSizeOpts={[10,25]} onPage={setSvcPage} onPageSize={()=>{}}/>
      <div style={{ fontSize:10,color:'#C0CAD8',padding:'4px 14px 8px' }}>🔌 GW: GET /claim/{claim.claimNumber}/services</div>
    </div>
  )

  const TABS = [{id:'coverage' as const,label:'📋 Coverage'},{id:'info' as const,label:'Info'},{id:'contacts' as const,label:'Contacts'},{id:'services' as const,label:'Services'},{id:'documents' as const,label:'📁 Documents'},{id:'payments' as const,label:'Payments'}]

  return (
    <div style={{ marginTop:16 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:C.white,border:`1px solid ${C.border}`,borderRadius:'8px 8px 0 0',padding:'10px 16px',borderBottom:'none' }}>
        <h2 style={{ fontSize:17,fontWeight:700,color:C.text }}>Claim {claim.claimNumber} Details</h2>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:12,color:C.muted }}>Show Tab View</span>
          <div onClick={()=>setTabView(v=>!v)} style={{ width:40,height:22,borderRadius:11,background:tabView?C.navy:'#CBD5E0',cursor:'pointer',position:'relative',transition:'background .2s' }}>
            <div style={{ position:'absolute',top:2,left:tabView?20:2,width:18,height:18,borderRadius:'50%',background:C.white,transition:'left .2s',boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
          </div>
        </div>
      </div>
      {tabView && (
        <div style={{ display:'flex',background:C.white,border:`1px solid ${C.border}`,borderTop:'none',borderBottom:'none' }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'9px 16px',fontSize:12.5,fontWeight:600,background:'transparent',border:'none',borderBottom:`2px solid ${tab===t.id?C.navy:'transparent'}`,color:tab===t.id?C.navy:C.muted,cursor:'pointer',transition:'color .15s' }}>{t.label}</button>
          ))}
        </div>
      )}
      {tabView ? (
        /* ── TAB VIEW — show only the active tab ── */
        <>
          {tab==='info'     &&<InfoTab/>}
          {tab==='payments' &&<PaymentsTab/>}
          {tab==='contacts' &&<ContactsTab/>}
          {tab==='coverage'  &&<CoverageTab claimNumber={claim.claimNumber} policyNumber={claim.policyNumber} lobType={claim.lobType} vehicle={claim.vehicle} adjusterName={claim.adjusterName}/>}
      {tab==='services'  &&<ServicesTab/>}
      {tab==='documents' &&<DocumentsTab claimNumber={claim.claimNumber} lobType={claim.lobType}/>}
        </>
      ) : (
        /* ── SCROLL VIEW — all sections stacked vertically ── */
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {[
            { label:'Coverage', icon:'📋', content:<CoverageTab claimNumber={claim.claimNumber} policyNumber={claim.policyNumber} lobType={claim.lobType} vehicle={claim.vehicle} adjusterName={claim.adjusterName}/> },
            { label:'Info',     icon:'ℹ️', content:<InfoTab/> },
            { label:'Payments', icon:'💳', content:<PaymentsTab/> },
            { label:'Contacts', icon:'👤', content:<ContactsTab/> },
            { label:'Services',   icon:'⚙️', content:<ServicesTab/> },
            { label:'Documents', icon:'📁', content:<DocumentsTab claimNumber={claim.claimNumber} lobType={claim.lobType}/> },
          ].map(s => (
            <div key={s.label} style={{ borderTop:`1px solid ${C.border}` }}>
              <div style={{ padding:'10px 16px', background:C.bg, borderBottom:`1px solid ${C.border}`,
                fontSize:13, fontWeight:700, color:C.text, display:'flex', alignItems:'center', gap:8 }}>
                {s.icon} {s.label}
              </div>
              {s.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POLICY LIST
   ═══════════════════════════════════════════════════════════════ */
function PolicyList({ policyNum, onSelect }:{ policyNum:string; onSelect:(c:PolicyClaim)=>void }) {
  const [q,setQ]=useState(''), [sort,setSort]=useState({col:'claimNumber',dir:'asc' as 'asc'|'desc'}), [page,setPage]=useState(1), [size,setSize]=useState(10)
  const claims=MOCK_POLICIES[policyNum]||[]
  const filtered=claims.filter(c=>[c.claimNumber,c.insuredName,c.adjusterName,c.status,c.vehicle,c.lossType].some(v=>v.toLowerCase().includes(q.toLowerCase())))
  const sorted=[...filtered].sort((a:any,b:any)=>{ const av=a[sort.col]??'',bv=b[sort.col]??''; return sort.dir==='asc'?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av)) })
  const paged=sorted.slice((page-1)*size,page*size)
  const STH=({label,col}:{label:string;col:string})=>(
    <th onClick={()=>setSort(s=>({col,dir:s.col===col&&s.dir==='asc'?'desc':'asc'}))} style={{ padding:'9px 12px',textAlign:'left',fontSize:12,fontWeight:600,color:'#fff',cursor:'pointer',userSelect:'none',borderRight:`1px solid rgba(255,255,255,.1)`,whiteSpace:'nowrap' }}>
      {label} {sort.col===col?(sort.dir==='asc'?'↑':'↓'):''}
    </th>
  )
  return (
    <div style={{ marginTop:16 }}>
      <h2 style={{ fontSize:17,fontWeight:700,color:C.text,marginBottom:10 }}>Claims for Policy: {policyNum}</h2>
      <div style={{ background:C.tblHead,borderRadius:'6px 6px 0 0',padding:'8px 12px',display:'flex',alignItems:'center',gap:6 }}>
        <Search size={14} color="rgba(255,255,255,.6)"/>
        <input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Search claims..." style={{ background:'transparent',border:'none',outline:'none',color:'#fff',fontSize:12,flex:1 } as any}/>
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12.5 }}>
          <thead style={{ background:C.tblHead }}><tr><STH label="Claim Number" col="claimNumber"/><STH label="Insured Name" col="insuredName"/><STH label="LOB" col="lobType"/><STH label="Property / Vehicle" col="vehicle"/><STH label="Loss Type" col="lossType"/><STH label="Adjuster" col="adjusterName"/><STH label="Status" col="status"/><STH label="Created" col="createdDate"/></tr></thead>
          <tbody>
            {paged.map((c,i)=>(
              <tr key={i} onClick={()=>onSelect(c)} style={{ background:i%2?C.rowAlt:C.white,cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='#DBEAFE'}
                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=i%2?C.rowAlt:C.white}>
                <td style={{ padding:'8px 12px',color:C.blue,fontWeight:700 }}>{c.claimNumber}</td>
                <td style={{ padding:'8px 12px',color:C.text }}>{c.insuredName}</td>
                <td style={{ padding:'8px 12px' }}>
                  <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:10,
                    background:c.lobType==='property'?'#E1F5EE':C.bluePale,
                    color:c.lobType==='property'?'#0F6E56':C.navy,
                    border:`1px solid ${c.lobType==='property'?'#9FE1CB':C.blueBorder}` }}>
                    {c.lobType==='property'?'Property':'Auto'}
                  </span>
                </td>
                <td style={{ padding:'8px 12px',color:C.text,fontSize:11.5 }}>{c.vehicle}</td>
                <td style={{ padding:'8px 12px',color:C.text }}>{c.lossType}</td>
                <td style={{ padding:'8px 12px',color:C.text }}>{c.adjusterName}</td>
                <td style={{ padding:'8px 12px' }}><span style={{ fontSize:11,fontWeight:700,padding:'2px 9px',borderRadius:12,background:c.status==='Open'?C.greenLight:'#F5F5F5',color:c.status==='Open'?'#1B5E20':'#718096',border:`1px solid ${c.status==='Open'?C.greenBorder:'#E0E0E0'}` }}>{c.status}</span></td>
                <td style={{ padding:'8px 12px',color:C.text }}>{c.createdDate}</td>
              </tr>
            ))}
            {paged.length===0&&<tr><td colSpan={7} style={{ padding:24,textAlign:'center',color:C.faint }}>No claims found</td></tr>}
          </tbody>
        </table>
      </div>
      <Pagination total={filtered.length} page={page} pageSize={size} pageSizeOpts={[10,25,50]} onPage={setPage} onPageSize={s=>{setSize(s);setPage(1)}}/>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ClaimSearch() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTab,  setSearchTab]  = useState<'claim'|'policy'>('claim')
  const [claimInput, setClaimInput] = useState('')
  const [policyInput,setPolicyInput]= useState('')
  const [error,      setError]      = useState('')
  const [foundClaim, setFoundClaim] = useState<ClaimData|null>(null)
  const [policyNum,  setPolicyNum]  = useState('')
  const [showPolicy, setShowPolicy] = useState(false)
  const [selClaim,   setSelClaim]   = useState<ClaimData|null>(null)

  const reset = () => { setFoundClaim(null); setShowPolicy(false); setSelClaim(null); setError('') }

  const searchClaim = async () => {
    setError(''); reset()
    const num = claimInput.trim()
    if (!num) { setError('Please enter a claim number.'); return }

    /* 1 — Check mock data first */
    const mock = MOCK_CLAIMS[num]
    if (mock) { setFoundClaim(mock); return }

    /* 2 — Live GW lookup via local proxy or Vercel API */
    setError('Searching Guidewire...')
    try {
      const PROXY = (import.meta as any).env?.VITE_PROXY_URL || ''
      const url   = PROXY
        ? `${PROXY}/gw/claim/v1/claims?claimNumber=${num}`
        : `/api/gw/claim/v1/claims?claimNumber=${num}`

      const res  = await fetch(url)
      const data = await res.json()
      const raw  = data?.data?.[0]?.attributes

      if (!raw) { setError(`Claim "${num}" not found in Guidewire ClaimCenter.`); return }

      /* Map GW response to ClaimData */
      const isAuto = raw.lossType?.code === 'AUTO'
      const gwClaim: ClaimData = {
        claimNumber:  raw.claimNumber || num,
        insuredName:  raw.insured?.displayName || raw.mainContact?.displayName || 'Unknown',
        policyNumber: raw.policyNumber || '—',
        claimStatus:  raw.state?.name || 'Open',
        statusType:   raw.state?.code === 'open' ? 'on-track' : 'closed',
        lobType:      isAuto ? 'auto' : 'property',
        adjusterName: raw.assignedUser?.displayName || raw.adjuster || 'Assigned Adjuster',
        adjusterPhone:'Contact via portal',
        reporterName: raw.reporter?.displayName || raw.insured?.displayName || '—',
        reportedType: raw.reportedByType?.name || 'Self / Insured',
        reportedDate: raw.reportedDate ? new Date(raw.reportedDate).toLocaleDateString() : '—',
        vehicle:      isAuto ? 'Vehicle — see adjuster' : 'Property — see adjuster',
        dateOfLoss:   raw.lossDate ? new Date(raw.lossDate).toLocaleDateString() : '—',
        lossType:     raw.lossCause?.name || raw.lossType?.name || '—',
        repairShop:   '—',
        rentalInfo:   '—',
        activeStep:   raw.state?.code === 'open' ? 3 : 8,
        progressPct:  raw.state?.code === 'open' ? 35 : 100,
        statusMsg:    raw.state?.code === 'open'
          ? 'Claim is open and in progress. Loss cause: ' + (raw.lossCause?.name || 'Under review') + '. Adjuster: ' + (raw.assignedUser?.displayName || 'Super User') + '.'
          : 'This claim is closed. Contact your adjuster for details.',
        notes:    (raw.claimHistory || []).slice(0,5).map((h: any) => ({
          date:   new Date(h.eventTimeStamp).toLocaleDateString(),
          author: h.user || 'System',
          text:   h.description || h.type,
          type:   'info',
        })),
        payments:  [],
        contacts:  [{ role:'Adjuster', name: raw.assignedUser?.displayName || 'Super User', phone:'—', email:'—', createdDate: raw.reportedDate ? new Date(raw.reportedDate).toLocaleDateString() : '—' }],
        services:  [],
        timeline:  (raw.claimHistory || []).slice(0,8).map((h: any, i: number) => ({
          step:   i+1,
          label:  h.type,
          date:   new Date(h.eventTimeStamp).toLocaleDateString(),
          status: 'done',
          detail: h.description || h.type,
        })),
      }
      setError('')
      setFoundClaim(gwClaim)
    } catch {
      setError('Could not reach Guidewire. Check that the local proxy is running on port 3001.')
    }
  }

  const searchPolicy = () => {
    setError(''); reset()
    if (!policyInput.trim()) { setError('Please enter a policy number.'); return }
    if (MOCK_POLICIES[policyInput.trim()]) { setPolicyNum(policyInput.trim()); setShowPolicy(true) }
    else setError(`Policy "${policyInput}" not found. Try: 7407354463 (Auto-3 claims), 6601234500 (Property), 9901234567 (Mixed-25 claims)`)
  }

  const handlePolicyClaimSelect = (c:PolicyClaim) => {
    const full = MOCK_CLAIMS[c.claimNumber]
    if (full) { setSelClaim(full); setShowPolicy(false) }
    else {
      setSelClaim({ claimNumber:c.claimNumber, insuredName:c.insuredName, policyNumber:policyInput, claimStatus:c.status, statusType:c.status==='Closed'?'closed':'on-track', lobType:(c.lobType || 'auto') as LobType, adjusterName:c.adjusterName, adjusterPhone:'—', reporterName:c.insuredName, reportedType:'Self / Insured', reportedDate:c.createdDate, vehicle:c.vehicle, dateOfLoss:c.createdDate, lossType:c.lossType, repairShop:'—', rentalInfo:'—', activeStep:c.status==='Closed'?8:3, progressPct:c.status==='Closed'?100:30, statusMsg:c.status==='Closed'?'This claim is closed. Contact your adjuster for full details.':'Your claim is in progress. Contact your adjuster for details.', notes:[], payments:[], contacts:[], services:[], timeline:[] })
      setShowPolicy(false)
    }
  }

  const clearAll = () => { reset(); setClaimInput(''); setPolicyInput('') }

  const S = {
    page: { minHeight:'100vh',background:C.bg,fontFamily:'"DM Sans",system-ui,sans-serif' } as React.CSSProperties,
    nav:  { background:C.navy,height:56,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 28px',boxShadow:'0 2px 10px rgba(2,64,153,.3)' } as React.CSSProperties,
    card: { background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:'20px 24px',marginBottom:20 } as React.CSSProperties,
    tabBtn:(on:boolean)=>({ padding:'9px 18px',fontSize:13.5,fontWeight:600,background:'transparent',border:'none',borderBottom:`2px solid ${on?C.navy:'transparent'}`,color:on?C.navy:C.muted,cursor:'pointer',marginBottom:-1 } as React.CSSProperties),
  }

  return (
    <div style={S.page}>
      <style>{`@keyframes shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(250%)}} @keyframes shine{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}} @keyframes pulse-seg{0%{box-shadow:0 0 0 0 rgba(2,64,153,.5)}70%{box-shadow:0 0 0 6px rgba(2,64,153,0)}100%{box-shadow:0 0 0 0 rgba(2,64,153,0)}} ::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-thumb{background:#E2E8F2;border-radius:4px} ::-webkit-scrollbar-thumb:hover{background:#BFDBFE}`}</style>

      <nav style={S.nav}>
        <Link to="/" style={{ textDecoration:'none' }}><VMlogo size="md" variant="full-light"/></Link>
        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          {isAuthenticated&&<span style={{ fontSize:12,color:'rgba(255,255,255,.55)' }}>{user?.name}</span>}
          <button onClick={()=>{logout();navigate('/')}} style={{ fontSize:12,color:'rgba(255,255,255,.45)',background:'transparent',border:'none',cursor:'pointer' }}>Log Out</button>
        </div>
      </nav>

      <div style={{ maxWidth:1200,margin:'0 auto',padding:'28px 20px' }}>
        <div style={S.card}>
          <h1 style={{ fontSize:22,fontWeight:700,color:'#1B3A6B',marginBottom:4 }}>Welcome to Claim Notifications</h1>
          <p style={{ fontSize:12.5,color:C.muted,marginBottom:8 }}>Look up your claim or policy details and track updates in real time.</p>
          <ul style={{ paddingLeft:18,marginBottom:16 }}>
            {['Search by Claim Number or Policy Number','Access real-time updates on claim status','Receive instant notifications for important changes'].map(b=><li key={b} style={{ fontSize:12.5,color:C.muted,marginBottom:2 }}>{b}</li>)}
          </ul>
          <div style={{ display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:14 }}>
            <button style={S.tabBtn(searchTab==='claim')}  onClick={()=>{setSearchTab('claim');reset()}}>Search by claim number</button>
            <button style={S.tabBtn(searchTab==='policy')} onClick={()=>{setSearchTab('policy');reset()}}>Search by Policy number</button>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <input value={searchTab==='claim'?claimInput:policyInput} onChange={e=>searchTab==='claim'?setClaimInput(e.target.value):setPolicyInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(searchTab==='claim'?searchClaim():searchPolicy())}
              placeholder={searchTab==='claim'?'e.g. 000-00-000480':'e.g. 7407354463'}
              style={{ fontSize:13,border:`1px solid ${error?'#DC2626':C.border}`,borderRadius:6,padding:'6px 10px',color:C.text,outline:'none',width:210 }}/>
            <button onClick={searchTab==='claim'?searchClaim:searchPolicy} style={{ fontSize:13,fontWeight:600,background:C.navy,color:'#fff',border:'none',borderRadius:6,padding:'7px 18px',cursor:'pointer' }}>Search</button>
            <button onClick={clearAll} style={{ fontSize:13,background:C.white,color:C.muted,border:`1px solid ${C.border}`,borderRadius:6,padding:'7px 14px',cursor:'pointer' }}>Clear</button>
          </div>
          {error&&<div style={{ display:'flex',alignItems:'center',gap:6,fontSize:12.5,color:'#DC2626',marginTop:6 }}><AlertCircle size={14}/>{error}</div>}

        </div>

        {foundClaim&&<><ClaimTracker claim={foundClaim}/><ClaimDetail claim={foundClaim}/></>}

        {showPolicy&&!selClaim&&<PolicyList policyNum={policyNum} onSelect={handlePolicyClaimSelect}/>}

        {selClaim&&(
          <>
            <button onClick={()=>{setSelClaim(null);setShowPolicy(true)}} style={{ display:'flex',alignItems:'center',gap:4,fontSize:13,color:C.navy,background:'transparent',border:'none',cursor:'pointer',marginBottom:12,fontWeight:600 }}>
              <ChevronLeft size={16}/> Back to claims list
            </button>
            <ClaimTracker claim={selClaim}/><ClaimDetail claim={selClaim}/>
          </>
        )}

        <div style={{ textAlign:'center',marginTop:24 }}>
          <Link to="/" style={{ fontSize:13,color:C.muted,textDecoration:'none' }}>← Back to Home</Link>
        </div>
      </div>

      {/* ValueMomentum Claims Assistant — auto-injects claim context */}
      {foundClaim && <ClaimsAssistant claimContext={foundClaim as any} mode="full"/>}
      {selClaim   && <ClaimsAssistant claimContext={selClaim   as any} mode="full"/>}
      {!foundClaim && !selClaim && <ClaimsAssistant mode="full"/>}
    </div>
  )
}
