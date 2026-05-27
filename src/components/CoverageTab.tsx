/* ═══════════════════════════════════════════════════════════
   CoverageTab.tsx — VM Claims Portal
   Shows policy coverage limits, deductible, and claim-specific
   covered/excluded items for Auto and Property LOBs
   🔌 GW: GET /policy/v1/policies/{id}/coverages
   🔌 GW: GET /claim/v1/claims/{id}/coverages
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect } from 'react'
import {
  Shield, FileText, Home, Car, TrendingUp,
  CheckCircle, XCircle, AlertCircle, Info,
  DollarSign, Plug
} from 'lucide-react'

/* ── Brand tokens ── */
const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB', greenBorder:'#A8E4A2',
  green2:'#0F6E56', green2Light:'#E1F5EE', green2Border:'#A8DFC8',
  amber:'#D97706', amberLight:'#FFFBEB', amberBorder:'#FDE68A',
  red:'#DC2626', redLight:'#FEF2F2', redBorder:'#FECACA',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
}

/* ── Types ── */
interface CoverageLimit {
  name: string; amount: string; barPct: number; barColor: string
}

interface CoverageItem {
  status: 'covered' | 'excluded' | 'conditional'
  text: string; note: string
}

interface PolicyCoverage {
  policyNumber: string; policyType: string; policyPeriod: string
  propertyOrVehicle: string; yearBuiltOrVIN: string; extraField: string
  peril: string; deductibleAmt: string; deductibleLabel: string
  deductibleNote: string; deductibleGradient: string
  coveragePills: Array<{ label:string; type:'active'|'excluded'|'warning' }>
  limits: CoverageLimit[]
  coveredItems: CoverageItem[]
  gwPolicyCovEndpoint: string; gwClaimCovEndpoint: string
}

interface Props {
  claimNumber: string
  policyNumber: string
  lobType: 'auto' | 'property'
  vehicle?: string
  adjusterName?: string
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA — tabs show real structure
   🔌 Replace with:
      GET /policy/v1/policies/{policyNumber}/coverages
      GET /claim/v1/claims/{claimId}/coverages
   ══════════════════════════════════════════════════════════ */
const MOCK_AUTO_COVERAGE: Record<string, PolicyCoverage> = {
  DEFAULT: {
    policyNumber:'7407354463', policyType:'Personal Auto Policy',
    policyPeriod:'Jan 1, 2025 — Jan 1, 2026',
    propertyOrVehicle:'2022 Honda CR-V EX-L',
    yearBuiltOrVIN:'VIN: 2HKRW2H59NH123456',
    extraField:'Primary Driver: Rosario Marinello',
    peril:'Collision — Rear End',
    deductibleAmt:'$500', deductibleLabel:'Collision deductible',
    deductibleNote:'Due at vehicle pickup · Pay directly to repair shop',
    deductibleGradient:`linear-gradient(135deg,${C.navy},${C.blue})`,
    coveragePills:[
      { label:'Collision',            type:'active'   },
      { label:'Comprehensive',        type:'active'   },
      { label:'Rental Reimbursement', type:'active'   },
      { label:'Roadside Assistance',  type:'active'   },
      { label:'Uninsured Motorist',   type:'active'   },
      { label:'Gap Insurance',        type:'excluded' },
      { label:'Rideshare',            type:'excluded' },
    ],
    limits:[
      { name:'Bodily Injury — per person',   amount:'$100,000',           barPct:60,  barColor:C.navy  },
      { name:'Bodily Injury — per accident', amount:'$300,000',           barPct:75,  barColor:C.navy  },
      { name:'Property Damage Liability',    amount:'$100,000',           barPct:60,  barColor:C.blue  },
      { name:'Collision Coverage',           amount:'Actual Cash Value',  barPct:100, barColor:C.green },
      { name:'Comprehensive Coverage',       amount:'Actual Cash Value',  barPct:100, barColor:C.green },
      { name:'Rental Reimbursement',         amount:'$50/day · 30 days', barPct:80,  barColor:'#FABD00'},
      { name:'Uninsured Motorist BI',        amount:'$100K / $300K',      barPct:60,  barColor:'#7C3AED'},
      { name:'Roadside Assistance',          amount:'$100 per incident',  barPct:40,  barColor:'#FABD00'},
    ],
    coveredItems:[
      { status:'covered',     text:'Collision repair at DRP network shop',       note:'Covered · Deductible $500 due at pickup'                          },
      { status:'covered',     text:'Rental vehicle — Enterprise up to 30 days',  note:'$50/day covered · No out-of-pocket · Confirmation #ENT-88421'     },
      { status:'covered',     text:'OEM or like-kind-and-quality parts',          note:'Covered under your policy endorsement'                            },
      { status:'conditional', text:'Diminished value claim',                     note:'State-dependent · Contact your adjuster for eligibility'           },
      { status:'excluded',    text:'Personal belongings inside vehicle',          note:'Not covered under auto · File under homeowners if applicable'     },
      { status:'excluded',    text:'Mechanical breakdown unrelated to accident',  note:'Not covered under collision coverage'                             },
    ],
    gwPolicyCovEndpoint:'/policy/v1/policies/{policyNumber}/coverages',
    gwClaimCovEndpoint: '/claim/v1/claims/{claimId}/coverages',
  }
}

const MOCK_PROPERTY_COVERAGE: Record<string, PolicyCoverage> = {
  '000-00-000750': {
    policyNumber:'6601234500', policyType:'Homeowners Policy — HO-3',
    policyPeriod:'Jun 1, 2024 — Jun 1, 2025',
    propertyOrVehicle:'4512 Oak Ridge Dr, Plano TX 75024',
    yearBuiltOrVIN:'Year Built: 2003 · Frame construction',
    extraField:'2,450 sq ft',
    peril:'Wind / Hail — Apr 28, 2025',
    deductibleAmt:'$0', deductibleLabel:'Wind / Hail deductible — Waived',
    deductibleNote:'No deductible applies for wind/hail events under your current policy',
    deductibleGradient:'linear-gradient(135deg,#0F6E56,#1B8A4B)',
    coveragePills:[
      { label:'Dwelling (Coverage A)',   type:'active'   },
      { label:'Other Structures (B)',    type:'active'   },
      { label:'Personal Property (C)',   type:'active'   },
      { label:'Loss of Use / ALE (D)',   type:'active'   },
      { label:'Ordinance & Law',         type:'active'   },
      { label:'Wind / Hail',             type:'active'   },
      { label:'Sewer Backup — $5K limit',type:'warning'  },
      { label:'Flood',                   type:'excluded' },
      { label:'Earthquake',              type:'excluded' },
    ],
    limits:[
      { name:'Dwelling — Coverage A',        amount:'$420,000',          barPct:100, barColor:C.green2 },
      { name:'Other Structures — Coverage B', amount:'$42,000',           barPct:10,  barColor:C.green2 },
      { name:'Personal Property — Cov. C',   amount:'$210,000',          barPct:50,  barColor:'#1B8A4B'},
      { name:'Loss of Use / ALE — Cov. D',   amount:'$84,000 · 24 mo.',  barPct:20,  barColor:'#FABD00'},
      { name:'Ordinance & Law',               amount:'25% of A · $105K',  barPct:25,  barColor:C.navy  },
      { name:'Personal Liability',            amount:'$300,000',          barPct:70,  barColor:C.navy  },
      { name:'Medical Payments',              amount:'$5,000',            barPct:15,  barColor:'#7C3AED'},
    ],
    coveredItems:[
      { status:'covered',     text:'Roof replacement — wind/hail damage',    note:'ACV + RCV · $0 deductible · ABC Restoration assigned'          },
      { status:'covered',     text:'Interior water intrusion from storm',     note:'Resultant damage from wind/hail event · Covered'               },
      { status:'covered',     text:'Ordinance & Law — code upgrades',         note:'Drip edge + ridge vent · $4,200 approved by adjuster'          },
      { status:'covered',     text:'Siding repair — wind damage',             note:'North and west elevations · Coverage A'                        },
      { status:'conditional', text:'Detached garage — other structures',      note:'Pending adjuster assessment · Coverage B · Contact adjuster'   },
      { status:'excluded',    text:'Pre-existing roof wear and aging',        note:'Not covered · Only storm damage is eligible'                   },
      { status:'excluded',    text:'Flood damage',                            note:'Not covered · Requires separate flood policy (NFIP/private)'   },
    ],
    gwPolicyCovEndpoint:'/policy/v1/policies/{policyNumber}/coverages',
    gwClaimCovEndpoint: '/claim/v1/claims/{claimId}/coverages',
  },
  '000-00-000751': {
    policyNumber:'7702345601', policyType:'Homeowners Policy — HO-3',
    policyPeriod:'Mar 1, 2025 — Mar 1, 2026',
    propertyOrVehicle:'2201 Willow Creek Rd, Frisco TX 75034',
    yearBuiltOrVIN:'Year Built: 2008 · Brick veneer',
    extraField:'3,120 sq ft',
    peril:'Water — Burst Pipe · Feb 14, 2025',
    deductibleAmt:'$2,500', deductibleLabel:'All-peril deductible',
    deductibleNote:'Standard deductible applies · Water damage loss',
    deductibleGradient:'linear-gradient(135deg,#0F6E56,#1B8A4B)',
    coveragePills:[
      { label:'Dwelling (Coverage A)',   type:'active'   },
      { label:'Personal Property (C)',   type:'active'   },
      { label:'Loss of Use / ALE (D)',   type:'active'   },
      { label:'Water — Burst Pipe',      type:'active'   },
      { label:'Sewer Backup — $10K limit',type:'warning' },
      { label:'Flood',                   type:'excluded' },
    ],
    limits:[
      { name:'Dwelling — Coverage A',      amount:'$520,000',         barPct:100, barColor:C.green2 },
      { name:'Personal Property — Cov. C', amount:'$260,000',         barPct:50,  barColor:'#1B8A4B'},
      { name:'Loss of Use / ALE — Cov. D', amount:'$104,000 · 24mo.', barPct:20,  barColor:'#FABD00'},
      { name:'Personal Liability',          amount:'$300,000',         barPct:70,  barColor:C.navy  },
      { name:'Medical Payments',            amount:'$5,000',           barPct:15,  barColor:'#7C3AED'},
    ],
    coveredItems:[
      { status:'covered',     text:'Water damage from burst pipe',      note:'Sudden & accidental discharge · Covered under Coverage A'        },
      { status:'covered',     text:'Drywall and flooring replacement',   note:'Resultant water damage · Covered'                               },
      { status:'covered',     text:'ALE — Extended Stay America Frisco', note:'Home uninhabitable · $104K limit · Coverage D active'          },
      { status:'conditional', text:'Personal property damage',           note:'Requires itemized inventory · Coverage C · Contact adjuster'    },
      { status:'excluded',    text:'Gradual leakage / seepage',          note:'Not covered · Only sudden & accidental discharge covered'       },
      { status:'excluded',    text:'Flood / rising water',              note:'Not covered · Requires separate flood policy'                   },
    ],
    gwPolicyCovEndpoint:'/policy/v1/policies/{policyNumber}/coverages',
    gwClaimCovEndpoint: '/claim/v1/claims/{claimId}/coverages',
  },
}

/* ── Helper: get coverage data ── */
function getCoverage(claimNumber: string, lobType: 'auto'|'property'): PolicyCoverage {
  if (lobType === 'property') {
    return MOCK_PROPERTY_COVERAGE[claimNumber] || Object.values(MOCK_PROPERTY_COVERAGE)[0]
  }
  return MOCK_AUTO_COVERAGE[claimNumber] || MOCK_AUTO_COVERAGE['DEFAULT']
}

/* ── GW API footer ── */
function GWTag({ policy, claim }: { policy:string; claim:string }) {
  return (
    <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}`, fontSize:11,
      color:C.faint, display:'flex', alignItems:'flex-start', gap:5 }}>
      <Plug size={12} style={{ flexShrink:0, marginTop:1 }}/>
      <span>GW: GET {policy} · GET {claim}</span>
    </div>
  )
}

/* ── Section label ── */
function SLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ fontSize:10.5, fontWeight:700, color:C.faint, textTransform:'uppercase',
      letterSpacing:'.07em', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
      {icon}{children}
    </div>
  )
}

/* ── Field row ── */
function FRow({ label, value }: { label:string; value:string }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'150px 1fr', padding:'7px 0',
      borderBottom:`1px solid ${C.bg}`, alignItems:'start' }}>
      <span style={{ fontSize:11.5, color:C.faint, fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{value}</span>
    </div>
  )
}

/* ── Coverage pill ── */
function CovPill({ label, type }: { label:string; type:'active'|'excluded'|'warning' }) {
  const styles = {
    active:   { bg:C.greenLight, color:'#1B5E20', border:C.greenBorder },
    excluded: { bg:'#F5F5F5',    color:'#9E9E9E',  border:'#E0E0E0'    },
    warning:  { bg:C.amberLight, color:'#92400E',  border:C.amberBorder},
  }[type]

  return (
    <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
      padding:'5px 12px', borderRadius:20, background:styles.bg, color:styles.color,
      border:`1px solid ${styles.border}`,
      textDecoration: type==='excluded' ? 'line-through' : 'none', opacity: type==='excluded'?.7:1 }}>
      {type==='active'   && <CheckCircle size={11}/>}
      {type==='excluded' && <XCircle size={11}/>}
      {type==='warning'  && <AlertCircle size={11}/>}
      {label}
    </span>
  )
}

/* ── Coverage item row ── */
function CovItem({ item }: { item: CoverageItem }) {
  const ic = {
    covered:     { bg:C.greenLight, color:'#1B5E20', icon:<CheckCircle size={11}/> },
    excluded:    { bg:C.redLight,   color:C.red,     icon:<XCircle size={11}/>     },
    conditional: { bg:C.amberLight, color:C.amber,   icon:<AlertCircle size={11}/>  },
  }[item.status]

  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'8px 0',
      borderBottom:`1px solid ${C.bg}` }}>
      <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center',
        justifyContent:'center', flexShrink:0, marginTop:1, background:ic.bg, color:ic.color }}>
        {ic.icon}
      </div>
      <div>
        <div style={{ fontSize:12.5, fontWeight:600, color:C.text, lineHeight:1.3 }}>{item.text}</div>
        <div style={{ fontSize:11, color:C.muted, marginTop:2, lineHeight:1.4 }}>{item.note}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COVERAGE TAB
   ══════════════════════════════════════════════════════════ */
export default function CoverageTab({ claimNumber, policyNumber, lobType, vehicle, adjusterName }: Props) {
  const [loading, setLoading] = useState(true)
  const [coverage, setCoverage] = useState<PolicyCoverage | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const PROXY = (import.meta as any).env?.VITE_PROXY_URL || ''

      /* Try GW claim coverages first */
      if (PROXY) {
        try {
          const r = await fetch(`${PROXY}/gw/claim/v1/claims?filter=claimNumber%3Aeq%3A${claimNumber}&pageSize=1`)
          const d = await r.json()
          const raw = d?.data?.[0]?.attributes
          if (raw) {
            /* GW has claim — build coverage from real data */
            const isAuto = raw.lossType?.code === 'AUTO'
            const mockBase = getCoverage(claimNumber, isAuto ? 'auto' : 'property')
            /* Override with real GW values where available */
            setCoverage({
              ...mockBase,
              policyNumber:       raw.policyNumber || mockBase.policyNumber,
              policyPeriod:       mockBase.policyPeriod,
              propertyOrVehicle:  raw.insured?.displayName || mockBase.propertyOrVehicle,
              peril:              raw.lossCause?.name || mockBase.peril,
              deductibleGradient: isAuto
                ? 'linear-gradient(135deg,#024099,#0254CC)'
                : 'linear-gradient(135deg,#0F6E56,#1B8A4B)',
              gwPolicyCovEndpoint: `/policy/v1/policies/${raw.policyNumber}/coverages`,
              gwClaimCovEndpoint:  `/claim/v1/claims/${claimNumber}/coverages`,
            })
            setLoading(false)
            return
          }
        } catch { /* fall through to mock */ }
      }

      /* Fallback — mock data */
      setCoverage(getCoverage(claimNumber, lobType))
      setLoading(false)
    }
    load()
  }, [claimNumber, policyNumber, lobType])

  if (loading) {
    return (
      <div style={{ padding:40, textAlign:'center', color:C.muted, fontSize:13 }}>
        <div style={{ width:28, height:28, border:`3px solid ${C.border}`, borderTopColor:C.navy,
          borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 12px' }}/>
        Loading coverage details…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!coverage) return null

  const isAuto = lobType === 'auto'
  const accentColor = isAuto ? C.navy : C.green2
  const bannerBg    = isAuto ? C.bluePale  : C.green2Light
  const bannerBdr   = isAuto ? C.blueBorder: C.green2Border
  const bannerColor = isAuto ? C.navy      : C.green2

  return (
    <div style={{ padding:18 }}>

      {/* Claim-specific banner */}
      <div style={{ display:'flex', alignItems:'center', gap:10, background:bannerBg,
        border:`1px solid ${bannerBdr}`, borderRadius:10, padding:'10px 14px',
        marginBottom:18, fontSize:12.5, color:bannerColor }}>
        <Info size={15} style={{ flexShrink:0 }}/>
        <span>
          Coverage shown is specific to <strong>Claim #{claimNumber}</strong>
          {vehicle ? ` — ${vehicle}` : ''} · {coverage.peril}
        </span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>

        {/* ── LEFT PANEL ── */}
        <div>
          {/* Policy overview */}
          <SLabel icon={<Shield size={13}/>}>Policy overview</SLabel>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden', marginBottom:14 }}>
            <div style={{ padding:'11px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
              borderBottom:`1px solid ${C.border}`, background:C.bg }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.text, display:'flex', alignItems:'center', gap:7 }}>
                {isAuto ? <Car size={14} color={accentColor}/> : <Home size={14} color={accentColor}/>}
                {coverage.policyType}
              </div>
              <span style={{ fontSize:10.5, fontWeight:700, padding:'3px 10px', borderRadius:10,
                background:C.greenLight, color:'#1B5E20', border:`1px solid ${C.greenBorder}` }}>
                Active
              </span>
            </div>
            <div style={{ padding:'12px 14px' }}>
              <FRow label="Policy Number"   value={coverage.policyNumber}/>
              <FRow label="Policy Period"   value={coverage.policyPeriod}/>
              <FRow label={isAuto ? 'Insured Vehicle' : 'Property'} value={coverage.propertyOrVehicle}/>
              <FRow label={isAuto ? 'VIN' : 'Construction'} value={coverage.yearBuiltOrVIN}/>
              <FRow label={isAuto ? 'Primary Driver' : 'Square Footage'} value={coverage.extraField}/>
              <FRow label="Loss / Peril"    value={coverage.peril}/>
            </div>
          </div>

          {/* Deductible */}
          <SLabel icon={<DollarSign size={13}/>}>Your deductible for this claim</SLabel>
          <div style={{ borderRadius:12, padding:18, textAlign:'center', marginBottom:14,
            background:coverage.deductibleGradient }}>
            <div style={{ fontSize:40, fontWeight:800, color:C.white, lineHeight:1 }}>
              {coverage.deductibleAmt}
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginTop:5 }}>
              {coverage.deductibleLabel}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:5, lineHeight:1.5 }}>
              {coverage.deductibleNote}
            </div>
          </div>

          {/* Coverage pills */}
          <SLabel icon={<CheckCircle size={13}/>}>Coverage on this policy</SLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {coverage.coveragePills.map((p,i) => <CovPill key={i} {...p}/>)}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div>
          {/* Coverage limits */}
          <SLabel icon={<TrendingUp size={13}/>}>Coverage limits</SLabel>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:14 }}>
            {coverage.limits.map((lim, i) => (
              <div key={i} style={{ marginBottom: i < coverage.limits.length-1 ? 12 : 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:600, color:C.text }}>{lim.name}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:accentColor, flexShrink:0, marginLeft:8 }}>{lim.amount}</span>
                </div>
                <div style={{ height:6, background:C.border, borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${lim.barPct}%`, height:'100%', borderRadius:3,
                    background:lim.barColor, transition:'width .6s ease' }}/>
                </div>
              </div>
            ))}
          </div>

          {/* What's covered for this claim */}
          <SLabel icon={<Shield size={13}/>}>What's covered for this claim</SLabel>
          <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'8px 14px' }}>
              {coverage.coveredItems.map((item, i) => (
                <div key={i} style={{ borderBottom: i < coverage.coveredItems.length-1 ? `1px solid ${C.bg}` : 'none' }}>
                  <CovItem item={item}/>
                </div>
              ))}
            </div>
          </div>

          <GWTag policy={coverage.gwPolicyCovEndpoint} claim={coverage.gwClaimCovEndpoint}/>
        </div>
      </div>
    </div>
  )
}
