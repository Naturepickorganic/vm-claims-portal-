import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react'
import VMlogo from '@/components/ui/VMlogo'
import { useAuth } from '@/lib/authContext'

/* ── Brand tokens ── */
const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB', greenBorder:'#A8E4A2',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
  tblHead:'#1B3A6B', rowAlt:'#F5F8FF',
  orange:'#E65100', purple:'#6A1B9A',
}

const TRACKER_STEPS = ['Filed','Adjuster\nAssigned','Inspection\nComplete','Estimate\nApproved','Rental\nActive','Repair\nIn Progress','Payment','Closed']

type EvtCategory = 'General'|'Repair'|'Rental'|'Payment'|'Inspection'
type StatusType  = 'on-track'|'action-needed'|'closed'

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
  claimStatus:string; statusType:StatusType
  adjusterName:string; adjusterPhone:string
  reporterName:string; reportedType:string; reportedDate:string
  vehicle:string; dateOfLoss:string; lossType:string
  repairShop:string; rentalInfo:string
  activeStep:number; progressPct:number; statusMsg:string
  notes:NoteRow[]; payments:PaymentRow[]
  contacts:ContactRow[]; services:ServiceRow[]
  timeline:TimelineEvent[]
}

interface PolicyClaim {
  claimNumber:string; insuredName:string; adjusterName:string
  status:string; createdDate:string; vehicle:string; lossType:string
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA — 9 fully detailed claims, 4 policies
   All tabs: Info, Payments, Contacts, Services, Timeline in sync
   🔌 Replace with Guidewire API calls when ready
   ═══════════════════════════════════════════════════════════════ */

const MOCK_CLAIMS: Record<string,ClaimData> = {

  /* ── 1. Rosario — CR-V — Repair + Rental active — GREEN ── */
  '000-00-000480': {
    claimNumber:'000-00-000480', insuredName:'Rosario Marinello',
    policyNumber:'7407354463',   claimStatus:'Open', statusType:'on-track',
    adjusterName:'Emily Rodriguez', adjusterPhone:'(214) 555-0142',
    reporterName:'Rosario Marinello', reportedType:'Self / Insured',
    reportedDate:'2024-09-15', vehicle:'2022 Honda CR-V EX-L',
    dateOfLoss:'2024-09-15',   lossType:'Collision — Rear End',
    repairShop:'Caliber Collision Dallas (4821 Mockingbird Ln)',
    rentalInfo:'Enterprise #ENT-88421 · 2022 Toyota Camry · 9 days remaining',
    activeStep:6, progressPct:68,
    statusMsg:"Body work underway at Caliber Collision. Parts arrived May 19. Enterprise rental active — 9 days remaining. We'll notify you immediately when your vehicle passes quality inspection.",
    notes:[
      { adjuster:'Emily Rodriguez', date:'May 16, 2025', message:'Supplement approved — additional damage behind rear bumper. Revised total $8,267. No deductible change for customer.' },
      { adjuster:'Emily Rodriguez', date:'Sep 15, 2024', message:'Claim opened. Inspection scheduled at Caliber Collision Dallas for May 14. Rental authorized.' },
    ],
    payments:[
      { checkNumber:'',              payTo:'Rosario Marinello', grossAmount:88,   issueDate:'2025-09-02', scheduledSendDate:'',           status:'Notifying'  },
      { checkNumber:'',              payTo:'Caliber Collision',  grossAmount:7767, issueDate:'',           scheduledSendDate:'2025-05-30', status:'Requesting' },
    ],
    contacts:[
      { name:'Rosario Marinello',        role:'Insured',          createdDate:'Sep 15, 2024', phone:'(214) 555-0181', email:'rosario@email.com'             },
      { name:'Emily Rodriguez',          role:'Adjuster',         createdDate:'Sep 15, 2024', phone:'(214) 555-0142', email:'emily.rodriguez@valuemumt.com' },
      { name:'Caliber Collision Dallas', role:'Repair Shop',      createdDate:'May 13, 2025', phone:'(214) 555-0300', email:'dallas@calibercollision.com'   },
      { name:'Enterprise Rent-A-Car',    role:'Rental Provider',  createdDate:'May 14, 2025', phone:'(214) 555-0400', email:'dallas.rental@enterprise.com'  },
    ],
    services:[
      { serviceNumber:'SRV-480-001', serviceType:'Collision Repair',   provider:'Caliber Collision Dallas', serviceStatus:'In Progress', expectedCompletion:'May 28, 2025' },
      { serviceNumber:'SRV-480-002', serviceType:'Rental Vehicle',     provider:'Enterprise Rent-A-Car',   serviceStatus:'Active',      expectedCompletion:'May 28, 2025' },
      { serviceNumber:'SRV-480-003', serviceType:'Quality Inspection', provider:'Caliber Collision Dallas', serviceStatus:'Pending',     expectedCompletion:'May 28, 2025' },
    ],
    timeline:[
      { id:1,  category:'General',    title:'Claim #000-00-000480 Received',                      sub:'Confirmation sent to rosario@email.com and (214) 555-0181.',                                                              date:'Sep 15, 2024 · 9:14 AM',  status:'done',     badge:'✓ Filed'       },
      { id:2,  category:'General',    title:'Emily Rodriguez Assigned',                            sub:'Emily Rodriguez (Property — Team B). Direct: (214) 555-0142.',                                                           date:'Sep 15, 2024 · 11:30 AM', status:'done',     badge:'✓ Complete'    },
      { id:3,  category:'Inspection', title:'Inspection Booked — Caliber Collision Dallas',        sub:'Drop-off: May 14, 10:00 AM · 4821 Mockingbird Ln, Dallas TX.',                                                          date:'May 13, 2025',            status:'done',     badge:'✓ Complete'    },
      { id:4,  category:'Inspection', title:'Vehicle Received at Caliber Collision',               sub:'Vehicle checked in at 10:22 AM. Inspection underway.',                                                                    date:'May 14, 2025',            status:'done',     badge:'✓ Complete'    },
      { id:5,  category:'Inspection', title:'Estimate Completed & Approved — $6,847',              sub:'Parts $3,210 · Labor 18.5 hrs $2,490 · Paint $1,147. Approved by Emily Rodriguez. Repairs begin May 16.',               date:'May 14–15, 2025',         status:'done',     badge:'✓ Approved'    },
      { id:6,  category:'Rental',     title:'Enterprise Rental Reserved & Active',                 sub:'Confirmation #ENT-88421 · 2022 Toyota Camry · 2424 Commerce St Dallas. Fully covered.',                                  date:'May 14, 2025',            status:'active',   badge:'● Active'      },
      { id:7,  category:'Repair',     title:'Hidden Damage Found — Supplement $1,420 Approved',   sub:'Additional damage behind bumper. Deductible unchanged. Revised total $8,267. New ETA May 28.',                           date:'May 17, 2025',            status:'done',     badge:'✓ Approved'    },
      { id:8,  category:'Repair',     title:'Parts Arrived — Body Work Began',                    sub:'Replacement bumper and quarter panel received. Body repair started at Caliber Collision.',                                 date:'May 19, 2025',            status:'done',     badge:'✓ In Progress' },
      { id:9,  category:'Repair',     title:'Body Work Complete — Entering Paint & Refinish',     sub:'Vehicle moving to paint booth. Typically 2–3 days. Next update when paint is complete.',                                   date:'Today · May 21, 2025',    status:'active',   badge:'● In Progress' },
      { id:10, category:'Repair',     title:'Quality Inspection & Vehicle Ready',                  sub:"We'll notify you immediately when your vehicle passes QC. $500 deductible due at pickup.",                               date:'Est. May 28, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:11, category:'Rental',     title:'Rental Return',                                       sub:'Return at Caliber or any Enterprise by May 28. Fully covered — no charges to you.',                                       date:'Est. May 28, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:12, category:'Payment',    title:'Payment — $7,767 to Caliber Collision',               sub:'Balance paid directly to shop after repairs. Your portion: $500 deductible at pickup.',                                   date:'After repairs',           status:'upcoming', badge:'⏳ Scheduled'  },
      { id:13, category:'General',    title:'Claim Closed',                                        sub:'Full summary sent by email. Reopen within 30 days if issues arise.',                                                      date:'Est. ~May 30, 2025',      status:'upcoming', badge:'⏳ Scheduled'  },
    ],
  },

  /* ── 2. Marcus — F-150 — Hail, inspection pending — AMBER ── */
  '000-00-000521': {
    claimNumber:'000-00-000521', insuredName:'Marcus T. Williams',
    policyNumber:'8812047291',   claimStatus:'Open', statusType:'action-needed',
    adjusterName:'Scott Henson', adjusterPhone:'(214) 555-0188',
    reporterName:'Marcus T. Williams', reportedType:'Self / Insured',
    reportedDate:'2025-04-10', vehicle:'2021 Ford F-150 XLT 4WD',
    dateOfLoss:'2025-04-10',   lossType:'Comprehensive — Hail / Weather',
    repairShop:'Joe Myers Ford Collision — Houston (13602 Northwest Fwy)',
    rentalInfo:'Enterprise rental authorized — available at time of vehicle drop-off',
    activeStep:3, progressPct:30,
    statusMsg:'Action needed: Please drop off your F-150 at Joe Myers Ford Collision by May 23, 8:30 AM. Your Enterprise rental will be ready at the same location. No deductible for hail under your policy.',
    notes:[
      { adjuster:'Scott Henson', date:'May 20, 2025', message:'Inspection confirmed May 23 at 8:30 AM at Joe Myers Ford. Please bring insurance card and license. Rental ready at drop-off.' },
      { adjuster:'Scott Henson', date:'Apr 11, 2025', message:'Large hail event confirmed Apr 10 in Houston metro. Comprehensive coverage verified. No deductible applies for hail.' },
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
      { id:1, category:'General',    title:'Claim #000-00-000521 Received — Hail Damage',    sub:'Hail event Apr 10 confirmed. Confirmation sent to marcus.williams@email.com.',                                  date:'Apr 10, 2025 · 6:42 PM', status:'done',     badge:'✓ Filed'        },
      { id:2, category:'General',    title:'Scott Henson Assigned',                           sub:'Scott Henson (Hail — Team A). Direct: (214) 555-0188.',                                                        date:'Apr 11, 2025 · 9:00 AM', status:'done',     badge:'✓ Complete'     },
      { id:3, category:'General',    title:'Coverage Verified — No Deductible',               sub:'Comprehensive coverage confirmed. No deductible applies for hail damage under your current policy.',           date:'Apr 12, 2025',           status:'done',     badge:'✓ Verified'     },
      { id:4, category:'Inspection', title:'⚡ Action Needed — Drop Off Vehicle May 23',      sub:'Joe Myers Ford Collision, 13602 Northwest Fwy, Houston TX. Drop-off: May 23, 8:30 AM. Rental ready at shop.',  date:'May 20, 2025',           status:'active',   badge:'● Action Needed' },
      { id:5, category:'Rental',     title:'Enterprise Rental Authorized — Ready at Drop-off',sub:'Enterprise rental approved. Pickup at Joe Myers when you drop off. Up to 21 days covered.',                    date:'Pending drop-off',        status:'upcoming', badge:'⏳ Authorized'   },
      { id:6, category:'Inspection', title:'Estimate & Approval',                             sub:'Estimate prepared during inspection. Adjuster reviews and authorizes same day.',                               date:'Est. May 23–24, 2025',   status:'upcoming', badge:'⏳ Scheduled'    },
      { id:7, category:'Repair',     title:'Repairs Begin — Paintless Dent Repair',           sub:'PDR for hail damage typically 5–10 business days depending on extent.',                                        date:'Est. late May 2025',      status:'upcoming', badge:'⏳ Scheduled'    },
      { id:8, category:'Repair',     title:'Vehicle Ready for Pickup',                        sub:"We'll notify you when repairs are complete and your truck passes QC.",                                          date:'Est. early Jun 2025',     status:'upcoming', badge:'⏳ Scheduled'    },
      { id:9, category:'Payment',    title:'Payment & Claim Closure',                         sub:'No deductible. Payment direct to shop. Rental billing summary sent after closure.',                            date:'After repairs',           status:'upcoming', badge:'⏳ Scheduled'    },
    ],
  },

  /* ── 3. Jennifer — Camry — Total Loss, closed — STEEL ── */
  '000-00-000612': {
    claimNumber:'000-00-000612', insuredName:'Jennifer K. Okafor',
    policyNumber:'5503819042',   claimStatus:'Closed', statusType:'closed',
    adjusterName:'Linda Park', adjusterPhone:'(214) 555-0166',
    reporterName:'Jennifer K. Okafor', reportedType:'Self / Insured',
    reportedDate:'2025-01-08', vehicle:'2020 Toyota Camry SE',
    dateOfLoss:'2025-01-07',   lossType:'Comprehensive — Vehicle Theft',
    repairShop:'N/A — Total Loss Settlement',
    rentalInfo:'Enterprise — Closed Jan 28, 2025. 20 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Total loss settlement of $24,800 issued Jan 29, 2025. Rental closed after 20 days, fully covered. Thank you for trusting us with your claim.',
    notes:[
      { adjuster:'Linda Park', date:'Jan 22, 2025', message:'Vehicle declared total loss. ACV $24,800 per market analysis. Settlement letter sent by email and certified mail. Lien release obtained from Bank of America.' },
      { adjuster:'Linda Park', date:'Jan 08, 2025', message:'Theft reported. Police report #DPD-2025-00812 filed. Rental approved immediately. Total loss team engaged.' },
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
      { serviceNumber:'SRV-612-001', serviceType:'ACV Vehicle Valuation',   provider:'Total Loss Team',      serviceStatus:'Completed', expectedCompletion:'Jan 15, 2025' },
      { serviceNumber:'SRV-612-002', serviceType:'Title Transfer Processing',provider:'Title Express',        serviceStatus:'Completed', expectedCompletion:'Jan 22, 2025' },
      { serviceNumber:'SRV-612-003', serviceType:'Rental Vehicle',           provider:'Enterprise Rent-A-Car',serviceStatus:'Completed', expectedCompletion:'Jan 28, 2025' },
    ],
    timeline:[
      { id:1, category:'General',    title:'Claim #000-00-000612 — Vehicle Theft Reported',    sub:'Police report #DPD-2025-00812. Confirmation sent to jennifer.okafor@email.com.',                  date:'Jan 08, 2025 · 7:15 AM',  status:'done', badge:'✓ Filed'     },
      { id:2, category:'General',    title:'Linda Park Assigned',                               sub:'Linda Park (Total Loss — Team C). Direct: (214) 555-0166.',                                     date:'Jan 08, 2025 · 10:00 AM', status:'done', badge:'✓ Complete'  },
      { id:3, category:'Rental',     title:'Enterprise Rental Reserved & Active',               sub:'Enterprise #ENT-44129 · 2021 Honda Accord · Fully covered while claim is open.',                date:'Jan 08, 2025',            status:'done', badge:'✓ Active'    },
      { id:4, category:'Inspection', title:'ACV Valuation Completed — $24,800',                sub:'ACV determined from market data, condition, mileage 41,200, and comparable vehicles.',          date:'Jan 15, 2025',            status:'done', badge:'✓ Complete'  },
      { id:5, category:'Inspection', title:'Total Loss Declared',                               sub:'Repair cost exceeds ACV. Settlement $24,800 issued. Title transfer initiated with Bank of America.', date:'Jan 18, 2025',       status:'done', badge:'✓ Declared'  },
      { id:6, category:'Inspection', title:'Settlement Accepted — $24,800',                    sub:'Signed title received. Lien release obtained from Bank of America.',                            date:'Jan 22, 2025',            status:'done', badge:'✓ Accepted'  },
      { id:7, category:'Payment',    title:'Payment Issued — $24,300 + $500 Lienholder',       sub:'ACH $24,300 to your account (ending 4421). $500 to Bank of America. Both cleared Jan 31.',     date:'Jan 29, 2025',            status:'done', badge:'✓ Cleared'   },
      { id:8, category:'Rental',     title:'Rental Closed — 20 Days Covered',                  sub:'Enterprise rental closed Jan 28. 20 days fully covered, no charges to you.',                   date:'Jan 28, 2025',            status:'done', badge:'✓ Closed'    },
      { id:9, category:'General',    title:'Claim Closed',                                      sub:'Claim closed Jan 30, 2025. Full summary sent. Reopen within 30 days if issues arise.',         date:'Jan 30, 2025',            status:'done', badge:'✓ Closed'    },
    ],
  },

  /* ── 4. Rosario — CR-V — Hail, closed 2023 — STEEL ── */
  '000-00-000312': {
    claimNumber:'000-00-000312', insuredName:'Rosario Marinello',
    policyNumber:'7407354463',   claimStatus:'Closed', statusType:'closed',
    adjusterName:'Jonah Egertson', adjusterPhone:'(214) 555-0177',
    reporterName:'Rosario Marinello', reportedType:'Self / Insured',
    reportedDate:'2023-06-22', vehicle:'2022 Honda CR-V EX-L',
    dateOfLoss:'2023-06-22',   lossType:'Comprehensive — Hail / Weather',
    repairShop:'Service King Dallas (7800 Forest Ln)',
    rentalInfo:'Enterprise — Closed Jun 30, 2023. 8 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Hail damage repaired at Service King Dallas. Settlement of $3,240 issued Jun 30, 2023. No deductible applied.',
    notes:[
      { adjuster:'Jonah Egertson', date:'Jun 22, 2023', message:'Hail damage confirmed from June 22 storm. Full roof and hood PDR required. Comprehensive coverage confirmed — no deductible.' },
    ],
    payments:[
      { checkNumber:'CHK-2023-8812', payTo:'Service King Dallas', grossAmount:3240, issueDate:'2023-06-30', scheduledSendDate:'', status:'Cleared' },
    ],
    contacts:[
      { name:'Rosario Marinello',  role:'Insured',     createdDate:'Jun 22, 2023', phone:'(214) 555-0181', email:'rosario@email.com'            },
      { name:'Jonah Egertson',     role:'Adjuster',    createdDate:'Jun 22, 2023', phone:'(214) 555-0177', email:'jonah.egertson@valuemumt.com' },
      { name:'Service King Dallas',role:'Repair Shop', createdDate:'Jun 24, 2023', phone:'(214) 555-0600', email:'dallas@serviceking.com'       },
      { name:'Enterprise Rent-A-Car', role:'Rental Provider', createdDate:'Jun 24, 2023', phone:'(214) 555-0400', email:'dallas.rental@enterprise.com' },
    ],
    services:[
      { serviceNumber:'SRV-312-001', serviceType:'Hail / PDR Repair', provider:'Service King Dallas',   serviceStatus:'Completed', expectedCompletion:'Jun 30, 2023' },
      { serviceNumber:'SRV-312-002', serviceType:'Rental Vehicle',     provider:'Enterprise Rent-A-Car', serviceStatus:'Completed', expectedCompletion:'Jun 30, 2023' },
    ],
    timeline:[
      { id:1, category:'General',    title:'Claim #000-00-000312 — Hail Damage Filed',  sub:'June 22 hail event confirmed. Confirmation sent to rosario@email.com.',                       date:'Jun 22, 2023', status:'done', badge:'✓ Filed'    },
      { id:2, category:'General',    title:'Jonah Egertson Assigned',                   sub:'Jonah Egertson (Hail — Team A). Direct: (214) 555-0177.',                                    date:'Jun 22, 2023', status:'done', badge:'✓ Complete' },
      { id:3, category:'Inspection', title:'Estimate Completed & Approved — $3,240',    sub:'Roof and hood PDR confirmed at Service King. Approved Jun 25. No deductible.',               date:'Jun 24–25, 2023', status:'done', badge:'✓ Approved' },
      { id:4, category:'Rental',     title:'Enterprise Rental Active',                  sub:'Rental active during repairs. 8 days total, fully covered.',                                  date:'Jun 24, 2023', status:'done', badge:'✓ Complete' },
      { id:5, category:'Repair',     title:'Repairs Complete — QC Passed',              sub:'PDR completed on roof, hood, and trunk lid. Quality inspection passed.',                      date:'Jun 29, 2023', status:'done', badge:'✓ Complete' },
      { id:6, category:'Rental',     title:'Rental Closed — 8 Days',                   sub:'Enterprise rental returned. 8 days fully covered, no charges.',                               date:'Jun 30, 2023', status:'done', badge:'✓ Closed'   },
      { id:7, category:'Payment',    title:'Payment — $3,240 to Service King',          sub:'No cost to you. Insurance paid shop directly.',                                               date:'Jun 30, 2023', status:'done', badge:'✓ Cleared'  },
      { id:8, category:'General',    title:'Claim Closed',                              sub:'Claim closed Jul 3, 2023. Summary sent to rosario@email.com.',                               date:'Jul 03, 2023', status:'done', badge:'✓ Closed'   },
    ],
  },

  /* ── 5. Rosario — Civic — Glass chip, closed 2022 — STEEL ── */
  '000-00-000201': {
    claimNumber:'000-00-000201', insuredName:'Rosario Marinello',
    policyNumber:'7407354463',   claimStatus:'Closed', statusType:'closed',
    adjusterName:'Spencer Dunn', adjusterPhone:'(214) 555-0155',
    reporterName:'Rosario Marinello', reportedType:'Self / Insured',
    reportedDate:'2022-11-04', vehicle:'2019 Honda Civic LX',
    dateOfLoss:'2022-11-04',   lossType:'Comprehensive — Glass / Windshield',
    repairShop:'Safelite AutoGlass Dallas (Mobile)',
    rentalInfo:'N/A — Same-day glass repair, no rental required',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Windshield chip repaired same day by Safelite mobile. Texas deductible waiver applied — no out-of-pocket cost to you.',
    notes:[
      { adjuster:'Spencer Dunn', date:'Nov 04, 2022', message:'Windshield chip repair completed same-day by Safelite mobile tech. Texas deductible waiver applied per Tex. Ins. Code §1952.061. No cost to insured.' },
    ],
    payments:[],
    contacts:[
      { name:'Rosario Marinello',           role:'Insured',     createdDate:'Nov 04, 2022', phone:'(214) 555-0181', email:'rosario@email.com'          },
      { name:'Spencer Dunn',                role:'Adjuster',    createdDate:'Nov 04, 2022', phone:'(214) 555-0155', email:'spencer.dunn@valuemumt.com' },
      { name:'Safelite AutoGlass (Mobile)', role:'Glass Repair', createdDate:'Nov 04, 2022', phone:'(800) 638-8958', email:'—'                         },
    ],
    services:[
      { serviceNumber:'SRV-201-001', serviceType:'Windshield Chip Repair', provider:'Safelite AutoGlass (Mobile)', serviceStatus:'Completed', expectedCompletion:'Nov 04, 2022' },
    ],
    timeline:[
      { id:1, category:'General',    title:'Glass Claim Filed — Windshield Chip',         sub:'Chip reported. Safelite mobile dispatch initiated. Texas deductible waiver confirmed.',  date:'Nov 04, 2022 · 9:00 AM',  status:'done', badge:'✓ Filed'     },
      { id:2, category:'Inspection', title:'Safelite Mobile Technician Dispatched',        sub:'Technician en route to 4821 Mockingbird Ln, Dallas TX. ETA: 11:30 AM.',               date:'Nov 04, 2022 · 9:15 AM',  status:'done', badge:'✓ Dispatched' },
      { id:3, category:'Repair',     title:'Windshield Chip Repair Complete',              sub:'30-minute chip repair completed. QC passed. No cost to you.',                          date:'Nov 04, 2022 · 11:55 AM', status:'done', badge:'✓ Complete'   },
      { id:4, category:'Payment',    title:'Texas Deductible Waiver Applied',              sub:'Safelite billed directly. No out-of-pocket cost per Tex. Ins. Code §1952.061.',       date:'Nov 04, 2022',            status:'done', badge:'✓ Waived'     },
      { id:5, category:'General',    title:'Claim Closed',                                 sub:'Same-day closure. Summary sent to rosario@email.com.',                                 date:'Nov 04, 2022',            status:'done', badge:'✓ Closed'     },
    ],
  },

  /* ── 6. Marcus — F-150 — Collision, closed 2024 — STEEL ── */
  '000-00-000398': {
    claimNumber:'000-00-000398', insuredName:'Marcus T. Williams',
    policyNumber:'8812047291',   claimStatus:'Closed', statusType:'closed',
    adjusterName:'Jonah Egertson', adjusterPhone:'(214) 555-0177',
    reporterName:'Marcus T. Williams', reportedType:'Self / Insured',
    reportedDate:'2024-03-15', vehicle:'2021 Ford F-150 XLT 4WD',
    dateOfLoss:'2024-03-15',   lossType:'Collision — Side Impact',
    repairShop:'Caliber Collision Houston (9210 Katy Fwy)',
    rentalInfo:'Enterprise — Closed Apr 2, 2024. 18 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Side panel repairs completed at Caliber Collision Houston. Settlement of $5,340 issued Apr 2, 2024. Subrogation ongoing to recover your $500 deductible.',
    notes:[
      { adjuster:'Jonah Egertson', date:'Mar 19, 2024', message:'Other driver 100% at fault confirmed by police report and witness. Subrogation initiated to recover $500 deductible.' },
      { adjuster:'Jonah Egertson', date:'Mar 15, 2024', message:'Side impact collision, passenger side. $500 collision deductible applies. Rental approved.' },
    ],
    payments:[
      { checkNumber:'CHK-2024-2210', payTo:'Caliber Collision Houston', grossAmount:5340, issueDate:'2024-04-02', scheduledSendDate:'', status:'Cleared' },
    ],
    contacts:[
      { name:'Marcus T. Williams',         role:'Insured',     createdDate:'Mar 15, 2024', phone:'(832) 555-0210', email:'marcus.williams@email.com'       },
      { name:'Jonah Egertson',             role:'Adjuster',    createdDate:'Mar 15, 2024', phone:'(214) 555-0177', email:'jonah.egertson@valuemumt.com'    },
      { name:'Caliber Collision Houston',  role:'Repair Shop', createdDate:'Mar 18, 2024', phone:'(713) 555-0550', email:'houston@calibercollision.com'    },
      { name:'Enterprise Rent-A-Car',      role:'Rental Provider', createdDate:'Mar 18, 2024', phone:'(713) 555-0400', email:'houston.rental@enterprise.com' },
    ],
    services:[
      { serviceNumber:'SRV-398-001', serviceType:'Collision Repair',      provider:'Caliber Collision Houston', serviceStatus:'Completed',   expectedCompletion:'Apr 02, 2024' },
      { serviceNumber:'SRV-398-002', serviceType:'Rental Vehicle',         provider:'Enterprise Rent-A-Car',    serviceStatus:'Completed',   expectedCompletion:'Apr 02, 2024' },
      { serviceNumber:'SRV-398-003', serviceType:'Subrogation Recovery',   provider:'Subrogation Team',         serviceStatus:'In Progress', expectedCompletion:'Ongoing'      },
    ],
    timeline:[
      { id:1,  category:'General',    title:'Claim #000-00-000398 — Collision Filed',           sub:'Side impact collision reported. Confirmation sent to marcus.williams@email.com.',           date:'Mar 15, 2024 · 2:30 PM', status:'done', badge:'✓ Filed'     },
      { id:2,  category:'General',    title:'Jonah Egertson Assigned',                          sub:'Jonah Egertson (Collision — Team B). Direct: (214) 555-0177.',                             date:'Mar 15, 2024',           status:'done', badge:'✓ Complete'  },
      { id:3,  category:'Inspection', title:'Vehicle Received at Caliber Collision Houston',    sub:'Drop-off Mar 18. Inspection and estimate underway.',                                        date:'Mar 18, 2024',           status:'done', badge:'✓ Complete'  },
      { id:4,  category:'Inspection', title:'Estimate Approved — $5,840',                      sub:'Passenger door and quarter panel. Labor 14.5 hrs. Approved. Repairs begin Mar 20.',         date:'Mar 19, 2024',           status:'done', badge:'✓ Approved'  },
      { id:5,  category:'General',    title:'Other Driver At Fault — Subrogation Started',     sub:'Police report confirms 100% fault. Subrogation to recover your $500 deductible.',          date:'Mar 19, 2024',           status:'done', badge:'✓ Confirmed' },
      { id:6,  category:'Rental',     title:'Enterprise Rental Active — 18 Days',              sub:'Enterprise #ENT-77234 · 2022 Ford F-150 · Fully covered.',                                 date:'Mar 18, 2024',           status:'done', badge:'✓ Complete'  },
      { id:7,  category:'Repair',     title:'Repairs Complete — QC Passed',                    sub:'Passenger door and quarter panel repaired. QC passed Apr 1.',                               date:'Apr 01, 2024',           status:'done', badge:'✓ Complete'  },
      { id:8,  category:'Rental',     title:'Rental Closed — 18 Days',                         sub:'Enterprise rental returned. 18 days fully covered, no charges.',                           date:'Apr 02, 2024',           status:'done', badge:'✓ Closed'    },
      { id:9,  category:'Payment',    title:'Payment — $5,340 to Caliber Collision',            sub:'You paid $500 deductible directly to Caliber. Insurance paid $5,340 balance.',             date:'Apr 02, 2024',           status:'done', badge:'✓ Cleared'   },
      { id:10, category:'General',    title:'Claim Closed',                                     sub:'Claim closed Apr 5, 2024. Subrogation ongoing — we will notify you when $500 is recovered.', date:'Apr 05, 2024',        status:'done', badge:'✓ Closed'    },
    ],
  },

  /* ── 7. David — Tesla — EV collision, active — GREEN ── */
  '000-00-006000': {
    claimNumber:'000-00-006000', insuredName:'David Chen',
    policyNumber:'9901234567',   claimStatus:'Open', statusType:'on-track',
    adjusterName:'Lynzi Farrell', adjusterPhone:'(214) 555-0199',
    reporterName:'David Chen', reportedType:'Self / Insured',
    reportedDate:'2025-05-05', vehicle:'2023 Tesla Model 3 Long Range',
    dateOfLoss:'2025-05-05',   lossType:'Collision — Rear End',
    repairShop:'Tesla Certified Collision Dallas (4200 Lemmon Ave)',
    rentalInfo:'Enterprise #ENT-99102 · 2023 Hyundai Ioniq 5 EV · 11 days remaining',
    activeStep:5, progressPct:55,
    statusMsg:"Estimate approved and repairs authorized at Tesla Certified Collision. EV rental active. Tesla OEM parts lead time is 7–10 days — repair timeline approximately 12–15 business days.",
    notes:[
      { adjuster:'Lynzi Farrell', date:'May 08, 2025', message:'Tesla OEM parts ordered. Lead time 7–10 days. Estimate $9,420 approved. EV-compatible rental authorized — Hyundai Ioniq 5 provided.' },
    ],
    payments:[
      { checkNumber:'', payTo:'Tesla Certified Collision Dallas', grossAmount:8920, issueDate:'', scheduledSendDate:'2025-06-10', status:'Requesting' },
    ],
    contacts:[
      { name:'David Chen',                      role:'Insured',         createdDate:'May 05, 2025', phone:'(972) 555-0301', email:'david.chen@email.com'           },
      { name:'Lynzi Farrell',                   role:'Adjuster',        createdDate:'May 05, 2025', phone:'(214) 555-0199', email:'lynzi.farrell@valuemumt.com'    },
      { name:'Tesla Certified Collision Dallas', role:'Repair Shop',     createdDate:'May 07, 2025', phone:'(214) 555-0700', email:'collision@tesladallas.com'      },
      { name:'Enterprise Rent-A-Car',           role:'Rental Provider', createdDate:'May 07, 2025', phone:'(972) 555-0400', email:'dallas.rental@enterprise.com'  },
    ],
    services:[
      { serviceNumber:'SRV-6000-001', serviceType:'EV Collision Repair',  provider:'Tesla Certified Collision Dallas', serviceStatus:'In Progress',  expectedCompletion:'Jun 10, 2025' },
      { serviceNumber:'SRV-6000-002', serviceType:'Rental Vehicle (EV)',  provider:'Enterprise Rent-A-Car',           serviceStatus:'Active',        expectedCompletion:'Jun 10, 2025' },
      { serviceNumber:'SRV-6000-003', serviceType:'ADAS Recalibration',   provider:'Tesla Certified Collision Dallas', serviceStatus:'Pending',       expectedCompletion:'Jun 10, 2025' },
    ],
    timeline:[
      { id:1, category:'General',    title:'Claim #000-00-006000 Filed — Tesla Rear End',     sub:'Confirmation sent to david.chen@email.com. Tesla Certified shop search initiated.',        date:'May 05, 2025',           status:'done',     badge:'✓ Filed'      },
      { id:2, category:'General',    title:'Lynzi Farrell Assigned — EV Specialist',          sub:'Lynzi Farrell (EV Specialist — Team D). Direct: (214) 555-0199.',                          date:'May 05, 2025',           status:'done',     badge:'✓ Complete'   },
      { id:3, category:'Inspection', title:'Tesla Certified Shop — Vehicle Received',          sub:'Tesla Certified Collision Dallas. Drop-off May 7. Vehicle received 9:15 AM.',              date:'May 07, 2025',           status:'done',     badge:'✓ Complete'   },
      { id:4, category:'Inspection', title:'Estimate Approved — $9,420',                      sub:'Tesla OEM parts required. Labor 22 hrs. Approved by Lynzi Farrell. Parts ordered.',        date:'May 08, 2025',           status:'done',     badge:'✓ Approved'   },
      { id:5, category:'Rental',     title:'EV Rental Active — Hyundai Ioniq 5',              sub:'Enterprise #ENT-99102. EV-compatible rental. Fully covered. 11 days remaining.',           date:'May 07, 2025',           status:'active',   badge:'● Active'     },
      { id:6, category:'Repair',     title:'Tesla OEM Parts Ordered — 7–10 Day Lead Time',   sub:'Bumper, sensors, and rear quarter panel on order from Tesla. Body work begins on arrival.', date:'May 08, 2025',           status:'active',   badge:'● In Progress'},
      { id:7, category:'Repair',     title:'Repairs & ADAS Calibration',                      sub:'After body repairs, Tesla ADAS sensors and cameras will be recalibrated.',                  date:'Est. May 20 – Jun 5',    status:'upcoming', badge:'⏳ Scheduled'  },
      { id:8, category:'Repair',     title:'Vehicle Ready — QC & Software Verification',      sub:'Tesla verifies all software, ADAS, and safety systems before delivery.',                    date:'Est. Jun 10, 2025',       status:'upcoming', badge:'⏳ Scheduled'  },
      { id:9, category:'Payment',    title:'Payment & Claim Closure',                          sub:'$500 deductible due at pickup. Insurance pays $8,920 to Tesla shop.',                      date:'After repairs',           status:'upcoming', badge:'⏳ Scheduled'  },
    ],
  },

  /* ── 8. David — BMW X5 — Hail, closed — STEEL ── */
  '000-00-006001': {
    claimNumber:'000-00-006001', insuredName:'David Chen',
    policyNumber:'9901234567',   claimStatus:'Closed', statusType:'closed',
    adjusterName:'Trevor Gunderson', adjusterPhone:'(214) 555-0183',
    reporterName:'David Chen', reportedType:'Self / Insured',
    reportedDate:'2025-02-18', vehicle:'2022 BMW X5 xDrive40i',
    dateOfLoss:'2025-02-18',   lossType:'Comprehensive — Hail / Weather',
    repairShop:'Park Place BMW Collision Dallas',
    rentalInfo:'Enterprise — Closed Mar 5, 2025. 15 days fully covered.',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Hail damage repaired at Park Place BMW. Settlement of $6,120 issued Mar 5, 2025. No deductible applied.',
    notes:[
      { adjuster:'Trevor Gunderson', date:'Feb 18, 2025', message:'Feb 18 DFW hail event confirmed. BMW requires OEM-certified repair. Park Place BMW authorized. No deductible — comprehensive coverage.' },
    ],
    payments:[
      { checkNumber:'CHK-2025-9901', payTo:'Park Place BMW Collision', grossAmount:6120, issueDate:'2025-03-05', scheduledSendDate:'', status:'Cleared' },
    ],
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
      { id:1, category:'General',    title:'Claim #000-00-006001 — BMW Hail Filed',       sub:'Feb 18 DFW hail event. Confirmation sent to david.chen@email.com.',                  date:'Feb 18, 2025', status:'done', badge:'✓ Filed'    },
      { id:2, category:'General',    title:'Trevor Gunderson Assigned',                   sub:'Trevor Gunderson (Hail — Team C). Direct: (214) 555-0183.',                          date:'Feb 18, 2025', status:'done', badge:'✓ Complete' },
      { id:3, category:'Inspection', title:'Estimate & Approval — $6,120',               sub:'BMW OEM PDR repair. Approved Feb 21. No deductible — comprehensive.',                 date:'Feb 20–21, 2025', status:'done', badge:'✓ Approved'},
      { id:4, category:'Rental',     title:'Enterprise Rental Active — 15 Days',          sub:'Rental active during repairs. Fully covered.',                                        date:'Feb 20, 2025', status:'done', badge:'✓ Complete' },
      { id:5, category:'Repair',     title:'Repairs Complete — QC Passed',                sub:'PDR on hood, roof, and trunk. QC passed Mar 4.',                                     date:'Mar 04, 2025', status:'done', badge:'✓ Complete' },
      { id:6, category:'Rental',     title:'Rental Closed — 15 Days',                    sub:'15 days fully covered, no charges.',                                                  date:'Mar 05, 2025', status:'done', badge:'✓ Closed'   },
      { id:7, category:'Payment',    title:'Payment — $6,120 to Park Place BMW',          sub:'No cost to you. Insurance paid shop directly.',                                       date:'Mar 05, 2025', status:'done', badge:'✓ Cleared'  },
      { id:8, category:'General',    title:'Claim Closed',                                sub:'Claim closed Mar 6, 2025. Summary sent to david.chen@email.com.',                    date:'Mar 06, 2025', status:'done', badge:'✓ Closed'   },
    ],
  },

  /* ── 9. David — Audi A4 — Glass replacement, closed — STEEL ── */
  '000-00-006002': {
    claimNumber:'000-00-006002', insuredName:'David Chen',
    policyNumber:'9901234567',   claimStatus:'Closed', statusType:'closed',
    adjusterName:'Spencer Dunn', adjusterPhone:'(214) 555-0155',
    reporterName:'David Chen', reportedType:'Self / Insured',
    reportedDate:'2024-11-12', vehicle:'2021 Audi A4 Premium Plus',
    dateOfLoss:'2024-11-12',   lossType:'Comprehensive — Glass / Windshield',
    repairShop:'Safelite AutoGlass Plano (Drop-off)',
    rentalInfo:'N/A — Glass repair completed same day, no rental needed',
    activeStep:8, progressPct:100,
    statusMsg:'Your claim is closed. Audi OEM windshield replaced at Safelite Plano. ADAS camera recalibrated. $200 deductible collected.',
    notes:[
      { adjuster:'Spencer Dunn', date:'Nov 12, 2024', message:'Large crack (8 inches) requires full windshield replacement. Audi OEM glass required per policy. $200 comprehensive deductible applies for full replacement (chip repair waiver does not apply).' },
    ],
    payments:[
      { checkNumber:'CHK-2024-8801', payTo:'Safelite AutoGlass Plano', grossAmount:1240, issueDate:'2024-11-15', scheduledSendDate:'', status:'Cleared' },
    ],
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
      { id:1, category:'General',    title:'Glass Claim — Windshield Replacement Required',  sub:'Large crack (8 in) requires full replacement. Safelite Plano drop-off scheduled.',   date:'Nov 12, 2024', status:'done', badge:'✓ Filed'    },
      { id:2, category:'Inspection', title:'Vehicle Dropped at Safelite Plano',              sub:'Audi OEM glass ordered. Replacement and ADAS recalibration scheduled Nov 14.',        date:'Nov 13, 2024', status:'done', badge:'✓ Complete' },
      { id:3, category:'Repair',     title:'OEM Windshield Replaced — ADAS Recalibrated',   sub:'Audi OEM windshield installed. Forward camera recalibrated and verified.',             date:'Nov 14, 2024', status:'done', badge:'✓ Complete' },
      { id:4, category:'Payment',    title:'$200 Deductible + $1,240 Insurance Paid',        sub:'You paid $200 deductible to Safelite. Insurance paid $1,240 balance.',               date:'Nov 15, 2024', status:'done', badge:'✓ Cleared'  },
      { id:5, category:'General',    title:'Claim Closed',                                   sub:'Summary sent to david.chen@email.com.',                                              date:'Nov 15, 2024', status:'done', badge:'✓ Closed'   },
    ],
  },
}

/* ── MOCK POLICIES ── */
const MOCK_POLICIES: Record<string,PolicyClaim[]> = {
  '7407354463': [
    { claimNumber:'000-00-000480', insuredName:'Rosario Marinello', adjusterName:'Emily Rodriguez', status:'Open',   createdDate:'2024-09-15', vehicle:'2022 Honda CR-V EX-L', lossType:'Collision'      },
    { claimNumber:'000-00-000312', insuredName:'Rosario Marinello', adjusterName:'Jonah Egertson',  status:'Closed', createdDate:'2023-06-22', vehicle:'2022 Honda CR-V EX-L', lossType:'Hail / Weather' },
    { claimNumber:'000-00-000201', insuredName:'Rosario Marinello', adjusterName:'Spencer Dunn',    status:'Closed', createdDate:'2022-11-04', vehicle:'2019 Honda Civic LX',  lossType:'Glass / Chip'   },
  ],
  '8812047291': [
    { claimNumber:'000-00-000521', insuredName:'Marcus T. Williams', adjusterName:'Scott Henson',   status:'Open',   createdDate:'2025-04-10', vehicle:'2021 Ford F-150 XLT 4WD', lossType:'Hail / Weather' },
    { claimNumber:'000-00-000398', insuredName:'Marcus T. Williams', adjusterName:'Jonah Egertson', status:'Closed', createdDate:'2024-03-15', vehicle:'2021 Ford F-150 XLT 4WD', lossType:'Collision'      },
  ],
  '5503819042': [
    { claimNumber:'000-00-000612', insuredName:'Jennifer K. Okafor', adjusterName:'Linda Park', status:'Closed', createdDate:'2025-01-08', vehicle:'2020 Toyota Camry SE', lossType:'Vehicle Theft' },
  ],
  '9901234567': [
    { claimNumber:'000-00-006000', insuredName:'David Chen', adjusterName:'Lynzi Farrell',    status:'Open',   createdDate:'2025-05-05', vehicle:'2023 Tesla Model 3 LR',    lossType:'Collision'      },
    { claimNumber:'000-00-006001', insuredName:'David Chen', adjusterName:'Trevor Gunderson', status:'Closed', createdDate:'2025-02-18', vehicle:'2022 BMW X5 xDrive40i',    lossType:'Hail / Weather' },
    { claimNumber:'000-00-006002', insuredName:'David Chen', adjusterName:'Spencer Dunn',     status:'Closed', createdDate:'2024-11-12', vehicle:'2021 Audi A4 Premium Plus', lossType:'Glass'          },
    ...Array.from({ length:22 }, (_,i) => ({
      claimNumber:`000-00-00${6003+i}`,
      insuredName: i%3===0?'David Chen':'Sarah Chen',
      adjusterName:['Emily Rodriguez','Scott Henson','Linda Park','Jonah Egertson','Spencer Dunn'][i%5],
      status:'Closed', createdDate:`2024-${String(Math.floor(i/3)+1).padStart(2,'0')}-${String((i%28)+1).padStart(2,'0')}`,
      vehicle:['2023 Tesla Model 3','2022 BMW X5','2021 Audi A4'][i%3],
      lossType:['Collision','Hail','Glass','Collision','Hail'][i%5],
    })),
  ],
}

/* ── Demo reference ── */
const DEMO_CLAIMS  = [
  { num:'000-00-000480', desc:'Rosario — CR-V — Repair In Progress + Rental (Green card)' },
  { num:'000-00-000521', desc:'Marcus  — F-150 — Hail, Action Needed (Amber card)'         },
  { num:'000-00-000612', desc:'Jennifer — Camry — Total Loss, Fully Closed (Steel card)'   },
  { num:'000-00-006000', desc:'David — Tesla — EV Repair, Step 5/8 (Green card)'           },
  { num:'000-00-006001', desc:'David — BMW X5 — Hail, Closed (Steel card)'                 },
  { num:'000-00-006002', desc:'David — Audi A4 — Glass, Closed (Steel card)'               },
]
const DEMO_POLICIES = [
  { num:'7407354463', desc:'Rosario Marinello — 3 claims (1 open, 2 closed)' },
  { num:'8812047291', desc:'Marcus T. Williams — 2 claims (1 open, 1 closed)' },
  { num:'5503819042', desc:'Jennifer K. Okafor — 1 claim (closed)'            },
  { num:'9901234567', desc:'David Chen — 25 claims (pagination demo)'          },
]

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
  const isClosed = claim.statusType === 'closed'
  const pct = claim.progressPct
  return (
    <div style={{ background:C.white,borderBottom:`1px solid ${C.border}`,padding:'14px 20px 12px' }}>
      <StatusCard claim={claim} />
      <div style={{ fontSize:10,fontWeight:700,color:C.faint,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8 }}>Claim Progress</div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:2,marginBottom:7 }}>
        {TRACKER_STEPS.map((s,i)=>{
          const n=i+1,done=n<claim.activeStep||isClosed,act=n===claim.activeStep&&!isClosed
          return <div key={s} style={{ textAlign:'center',fontSize:10,fontWeight:600,lineHeight:1.3,color:done||isClosed?'#1B5E20':act?C.navy:C.faint }}>{s.split('\n').map((l,j)=><div key={j}>{l}</div>)}</div>
        })}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:2,height:38,borderRadius:7,overflow:'hidden',background:'#E8EDF2' }}>
        {TRACKER_STEPS.map((_,i)=>{
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
  const [tab,    setTab]    = useState<'info'|'payments'|'contacts'|'services'>('info')
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
  const catColor = (c:EvtCategory) => c==='Repair'?C.orange:c==='Rental'?C.purple:c==='Payment'?C.blue:c==='Inspection'?C.green:C.text
  const dotColor = (s:string) => s==='done'?C.green:s==='active'?C.navy:'transparent'
  const badgeSt  = (s:string): React.CSSProperties => ({
    display:'inline-flex',fontSize:9.5,fontWeight:700,padding:'1px 7px',borderRadius:10,marginTop:3,
    background:s==='done'?C.greenLight:s==='active'?C.bluePale:'#EFF6FF',
    color:s==='done'?'#1B5E20':s==='active'?C.navy:'#1D4ED8',
    border:`1px solid ${s==='done'?C.greenBorder:s==='active'?C.blueBorder:'#BFDBFE'}`,
  })

  const cats: EvtCategory[] = ['General','Repair','Rental','Payment','Inspection']
  const filtTl = claim.timeline.filter(e=>tlFilter==='All Events'||e.category===tlFilter)
  const sortTl = [...filtTl].sort((a,b)=>tlSort==='latest'?b.id-a.id:a.id-b.id)
  const compTl = sortTl.filter(e=>e.status!=='upcoming')
  const upTl   = sortTl.filter(e=>e.status==='upcoming')
  const ordTl  = tlSort==='latest'?[...compTl,...upTl]:[...upTl,...compTl]

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
          {FIELD('Insured Name',  claim.insuredName,   '🔌 GW: claim.insured.displayName')}
          {FIELD('Policy Number', claim.policyNumber,  '🔌 GW: claim.policy.policyNumber')}
          {FIELD('Claim Status',  claim.claimStatus,   '🔌 GW: claim.state')}
          {FIELD('Adjuster',      claim.adjusterName,  '🔌 GW: claim.assignedUser.displayName')}
          {FIELD('Adj. Phone',    claim.adjusterPhone, '🔌 GW: claim.assignedUser.phoneNumber')}
          {FIELD('Reporter',      claim.reporterName,  '🔌 GW: claim.reporter.displayName')}
          {FIELD('Reported Type', claim.reportedType,  '🔌 GW: claim.reportedByType')}
          {FIELD('Reported Date', claim.reportedDate,  '🔌 GW: claim.reportedDate')}
          {FIELD('Vehicle',       claim.vehicle,       '🔌 GW: claim.vehicle.displayName')}
          {FIELD('Date of Loss',  claim.dateOfLoss,    '🔌 GW: claim.dateOfLoss')}
          {FIELD('Loss Type',     claim.lossType,      '🔌 GW: claim.lossType')}
          {FIELD('Repair Shop',   claim.repairShop,    '🔌 CCC Secure Share: shop.name')}
          {FIELD('Rental',        claim.rentalInfo,    '🔌 Enterprise ARMS: reservation.summary')}
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
            const next=ordTl[i+1]
            const showDiv=!isPend&&next?.status==='upcoming'&&tlSort==='latest'
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
                {showDiv&&<div style={{ textAlign:'center',padding:'6px 0',fontSize:10,fontWeight:600,color:C.faint,letterSpacing:'.06em',textTransform:'uppercase',borderTop:`1px dashed ${C.border}`,margin:'2px 0' }}>Upcoming</div>}
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

  const TABS = [{id:'info' as const,label:'Info'},{id:'payments' as const,label:'Payments'},{id:'contacts' as const,label:'Contacts'},{id:'services' as const,label:'Services'}]

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
      <div style={{ display:'flex',background:C.white,border:`1px solid ${C.border}`,borderTop:'none',borderBottom:'none' }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'9px 16px',fontSize:12.5,fontWeight:600,background:'transparent',border:'none',borderBottom:`2px solid ${tab===t.id?C.navy:'transparent'}`,color:tab===t.id?C.navy:C.muted,cursor:'pointer',transition:'color .15s' }}>{t.label}</button>
        ))}
      </div>
      {tab==='info'     &&<InfoTab/>}
      {tab==='payments' &&<PaymentsTab/>}
      {tab==='contacts' &&<ContactsTab/>}
      {tab==='services' &&<ServicesTab/>}
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
          <thead style={{ background:C.tblHead }}><tr><STH label="Claim Number" col="claimNumber"/><STH label="Insured Name" col="insuredName"/><STH label="Vehicle" col="vehicle"/><STH label="Loss Type" col="lossType"/><STH label="Adjuster" col="adjusterName"/><STH label="Status" col="status"/><STH label="Created" col="createdDate"/></tr></thead>
          <tbody>
            {paged.map((c,i)=>(
              <tr key={i} onClick={()=>onSelect(c)} style={{ background:i%2?C.rowAlt:C.white,cursor:'pointer' }}
                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background='#DBEAFE'}
                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=i%2?C.rowAlt:C.white}>
                <td style={{ padding:'8px 12px',color:C.blue,fontWeight:700 }}>{c.claimNumber}</td>
                <td style={{ padding:'8px 12px',color:C.text }}>{c.insuredName}</td>
                <td style={{ padding:'8px 12px',color:C.text }}>{c.vehicle}</td>
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

  const searchClaim = () => {
    setError(''); reset()
    const c = MOCK_CLAIMS[claimInput.trim()]
    if (c) setFoundClaim(c)
    else if (claimInput.trim()) setError(`Claim "${claimInput}" not found. Try: ${Object.keys(MOCK_CLAIMS).slice(0,3).join(', ')}`)
    else setError('Please enter a claim number.')
  }

  const searchPolicy = () => {
    setError(''); reset()
    if (!policyInput.trim()) { setError('Please enter a policy number.'); return }
    if (MOCK_POLICIES[policyInput.trim()]) { setPolicyNum(policyInput.trim()); setShowPolicy(true) }
    else setError(`Policy "${policyInput}" not found. Try: ${Object.keys(MOCK_POLICIES).join(', ')}`)
  }

  const handlePolicyClaimSelect = (c:PolicyClaim) => {
    const full = MOCK_CLAIMS[c.claimNumber]
    if (full) { setSelClaim(full); setShowPolicy(false) }
    else {
      setSelClaim({ claimNumber:c.claimNumber, insuredName:c.insuredName, policyNumber:policyInput, claimStatus:c.status, statusType:c.status==='Closed'?'closed':'on-track', adjusterName:c.adjusterName, adjusterPhone:'—', reporterName:c.insuredName, reportedType:'Self / Insured', reportedDate:c.createdDate, vehicle:c.vehicle, dateOfLoss:c.createdDate, lossType:c.lossType, repairShop:'—', rentalInfo:'—', activeStep:c.status==='Closed'?8:3, progressPct:c.status==='Closed'?100:30, statusMsg:c.status==='Closed'?'This claim is closed. Contact your adjuster for full details.':'Your claim is in progress. Contact your adjuster for details.', notes:[], payments:[], contacts:[], services:[], timeline:[] })
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
    </div>
  )
}
