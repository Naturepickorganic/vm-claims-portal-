import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import VMlogo from '@/components/ui/VMlogo'

const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB', greenBorder:'#A8E4A2',
  amber:'#D97706', amberLight:'#FFFBEB', amberBorder:'#FDE68A',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
}

/* ── Limited public data — NO amounts, NO contact details, NO PII beyond vehicle type ──
   🔌 Replace with: GET /api/v1/claims/quickstatus?claim={id}&zip={zip}                  */
const QUICK_DATA: Record<string, {
  claimNumber:string; lob:string; vehicleOrProp:string
  statusType:'on-track'|'action-needed'|'closed'
  statusLabel:string; currentStep:string; stepNum:number
  totalSteps:number; progressPct:number; eta:string
  adjusterFirst:string; paymentSummary:string; reportedDate:string
}> = {
  '000-00-000480': { claimNumber:'000-00-000480', lob:'Auto',     vehicleOrProp:'2022 Honda CR-V · Auto Claim',          statusType:'on-track',     statusLabel:'On Track',         currentStep:'Repair In Progress',          stepNum:6, totalSteps:8, progressPct:68, eta:'Est. May 28, 2025',           adjusterFirst:'Emily',    paymentSummary:'1 payment sent · 1 payment pending',  reportedDate:'Sep 15, 2024' },
  '000-00-000521': { claimNumber:'000-00-000521', lob:'Auto',     vehicleOrProp:'2021 Ford F-150 · Auto Claim',           statusType:'action-needed', statusLabel:'Action Needed',   currentStep:'Inspection Scheduled',        stepNum:3, totalSteps:8, progressPct:30, eta:'Drop-off by May 23',          adjusterFirst:'Scott',    paymentSummary:'No payments yet',                      reportedDate:'Apr 10, 2025' },
  '000-00-000612': { claimNumber:'000-00-000612', lob:'Auto',     vehicleOrProp:'2020 Toyota Camry · Auto Claim',         statusType:'closed',       statusLabel:'Closed',           currentStep:'Claim Closed',                stepNum:8, totalSteps:8, progressPct:100,eta:'Settled Jan 30, 2025',        adjusterFirst:'Linda',    paymentSummary:'All payments cleared',                 reportedDate:'Jan 08, 2025' },
  '000-00-000750': { claimNumber:'000-00-000750', lob:'Property', vehicleOrProp:'Single Family Home · Property Claim',   statusType:'on-track',     statusLabel:'On Track',         currentStep:'Rebuild In Progress',          stepNum:6, totalSteps:8, progressPct:70, eta:'Est. Jun 6, 2025',            adjusterFirst:'Maria',    paymentSummary:'1 payment sent · 1 payment pending',  reportedDate:'Apr 28, 2025' },
  '000-00-000751': { claimNumber:'000-00-000751', lob:'Property', vehicleOrProp:'Single Family Home · Property Claim',   statusType:'action-needed', statusLabel:'Action Needed',   currentStep:'Contractor Selection Needed', stepNum:5, totalSteps:8, progressPct:55, eta:'Pending contractor selection', adjusterFirst:'Kevin',    paymentSummary:'2 payments sent · 1 payment pending', reportedDate:'May 02, 2025' },
  '000-00-000752': { claimNumber:'000-00-000752', lob:'Property', vehicleOrProp:'Single Family Home · Property Claim',   statusType:'closed',       statusLabel:'Closed',           currentStep:'Claim Closed',                stepNum:8, totalSteps:8, progressPct:100,eta:'Settled Nov 8, 2024',         adjusterFirst:'Patricia', paymentSummary:'All payments cleared',                 reportedDate:'Aug 14, 2024' },
  '000-00-000830': { claimNumber:'000-00-000830', lob:'Auto',     vehicleOrProp:'2023 Chevrolet Tahoe · Auto Claim',      statusType:'closed',       statusLabel:'Closed',           currentStep:'Claim Closed',                stepNum:8, totalSteps:8, progressPct:100,eta:'Settled Apr 5, 2025',         adjusterFirst:'Carlos',   paymentSummary:'All payments cleared',                 reportedDate:'Mar 10, 2025' },
  '000-00-000831': { claimNumber:'000-00-000831', lob:'Property', vehicleOrProp:'Single Family Home · Property Claim',   statusType:'on-track',     statusLabel:'On Track',         currentStep:'Interior Drywall In Progress', stepNum:6, totalSteps:8, progressPct:68, eta:'Est. Jun 12, 2025',           adjusterFirst:'Rachel',   paymentSummary:'1 payment sent · 1 payment pending',  reportedDate:'Mar 22, 2025' },
  '000-00-000832': { claimNumber:'000-00-000832', lob:'Property', vehicleOrProp:'Single Family Home · Property Claim',   statusType:'closed',       statusLabel:'Closed',           currentStep:'Claim Closed',                stepNum:8, totalSteps:8, progressPct:100,eta:'Settled Apr 2, 2025',         adjusterFirst:'David',    paymentSummary:'All payments cleared',                 reportedDate:'Jan 19, 2025' },
}

/* ── Mini animated progress bar ── */
function MiniBar({ stepNum, totalSteps }: { stepNum:number; totalSteps:number }) {
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${totalSteps},1fr)`,
        gap:2, height:11, borderRadius:4, overflow:'hidden', background:'#E8EDF2', marginBottom:4 }}>
        {Array.from({length:totalSteps},(_,i) => {
          const done = i+1 < stepNum, cur = i+1 === stepNum
          return (
            <div key={i} style={{ borderRadius:2, position:'relative', overflow:'hidden',
              background: done ? C.green : cur ? C.navy : '#DDE3EA' }}>
              {cur && (
                <div style={{ position:'absolute', top:0, left:0, width:'45%', height:'100%',
                  background:'linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)',
                  animation:'shimmer 1.6s ease-in-out infinite' }}/>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ height:3, background:'#E2E8F2', borderRadius:2, overflow:'hidden', marginBottom:14 }}>
        <div style={{ height:'100%', borderRadius:2, transition:'width 1s ease',
          background:`linear-gradient(90deg,${C.green},${C.navy})`,
          width:`${Math.round((stepNum / totalSteps)*100)}%` }}/>
      </div>
      <style>{`@keyframes shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(250%)}}`}</style>
    </>
  )
}

export default function TrackResult() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const claimNum   = params.get('claim') || ''
  const claim      = QUICK_DATA[claimNum]

  if (!claim) {
    return (
      <div style={{ minHeight:'100vh', background:C.bg, display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', fontFamily:'"DM Sans",system-ui,sans-serif' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:8 }}>Claim not found</div>
        <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>Please check your claim number and ZIP code.</div>
        <button onClick={()=>navigate('/track')}
          style={{ background:C.navy, color:C.white, fontSize:14, fontWeight:700, padding:'11px 28px',
            borderRadius:9, border:'none', cursor:'pointer' }}>
          ← Try Again
        </button>
      </div>
    )
  }

  const isOnTrack  = claim.statusType === 'on-track'
  const isAmber    = claim.statusType === 'action-needed'
  const isClosed   = claim.statusType === 'closed'

  const badgeBg    = isOnTrack ? C.green : isAmber ? C.amber : '#64748B'
  const headerBg   = isOnTrack ? C.greenLight  : isAmber ? C.amberLight  : '#F1F5F9'
  const headerBdr  = isOnTrack ? C.greenBorder : isAmber ? C.amberBorder : '#CBD5E0'

  const Field = ({ label, value, valueColor }: { label:string; value:string; valueColor?:string }) => (
    <div style={{ display:'grid', gridTemplateColumns:'130px 1fr', padding:'8px 0',
      borderBottom:`1px solid ${C.bg}` }}>
      <span style={{ fontSize:11.5, color:C.faint, fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:12.5, fontWeight:700, color:valueColor||C.text }}>{value}</span>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif', display:'flex', flexDirection:'column' }}>

      {/* NAV */}
      <nav style={{ background:C.navy, height:56, display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'0 28px', boxShadow:'0 2px 10px rgba(2,64,153,.3)' }}>
        <Link to="/" style={{ textDecoration:'none' }}><VMlogo size="md" variant="full-light"/></Link>
        <Link to={`/login?redirect=${encodeURIComponent('/claims/search?claim=' + claim.claimNumber)}`}
          style={{ fontSize:13, fontWeight:600, color:C.white,
          border:'1px solid rgba(255,255,255,.3)', padding:'6px 16px', borderRadius:8, textDecoration:'none' }}>
          Log In
        </Link>
      </nav>

      <div style={{ maxWidth:860, margin:'0 auto', width:'100%', padding:'24px 16px',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>

        {/* ── LEFT: Limited status card ── */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14,
          overflow:'hidden', boxShadow:'0 1px 4px rgba(2,64,153,.06),0 4px 16px rgba(2,64,153,.08)' }}>

          {/* Card header — color by status */}
          <div style={{ background:headerBg, borderBottom:`1px solid ${headerBdr}`, padding:'14px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:11, color:C.muted, marginBottom:2 }}>
                Claim #{claim.claimNumber} · {claim.lob}
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:C.text }}>{claim.vehicleOrProp}</div>
            </div>
            <span style={{ fontSize:12, fontWeight:700, background:badgeBg, color:C.white,
              padding:'4px 12px', borderRadius:12, whiteSpace:'nowrap', flexShrink:0 }}>
              {isOnTrack?'✓ ':isAmber?'⚡ ':''}{ claim.statusLabel}
            </span>
          </div>

          <div style={{ padding:'16px' }}>

            {/* Progress bar */}
            <div style={{ fontSize:10, fontWeight:700, color:C.faint, textTransform:'uppercase',
              letterSpacing:'.06em', marginBottom:7 }}>
              Claim Progress — Step {claim.stepNum} of {claim.totalSteps}
            </div>
            <MiniBar stepNum={claim.stepNum} totalSteps={claim.totalSteps}/>

            {/* Limited public fields */}
            <Field label="Status"       value={claim.statusLabel}  valueColor={isOnTrack?C.green:isAmber?C.amber:'#64748B'} />
            <Field label="Current Stage" value={claim.currentStep}  valueColor={isClosed?C.muted:C.navy} />
            <Field label="Est. Completion" value={claim.eta} />
            <Field label="Reported"     value={claim.reportedDate} />
            <Field label="Adjuster"     value={`${claim.adjusterFirst} (first name only)`} />
            <div style={{ display:'grid', gridTemplateColumns:'130px 1fr', padding:'8px 0' }}>
              <span style={{ fontSize:11.5, color:C.faint, fontWeight:500 }}>Payments</span>
              <span style={{ fontSize:12.5, fontWeight:700, color:C.amber }}>{claim.paymentSummary}</span>
            </div>

            {/* Locked info bar */}
            <div style={{ display:'flex', alignItems:'center', gap:8, background:C.bg,
              border:`1px dashed #CBD5E0`, borderRadius:8, padding:'10px 12px', margin:'12px 0',
              fontSize:12, color:C.muted, lineHeight:1.4 }}>
              <span style={{ fontSize:16, flexShrink:0 }}>🔒</span>
              <span>Payment amounts, adjuster direct contact, documents, and full timeline require login</span>
            </div>

            {/* CTA */}
            <Link to={`/login?redirect=${encodeURIComponent('/claims/search?claim=' + claim.claimNumber)}`}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                width:'100%', background:C.navy, color:C.white, fontSize:13, fontWeight:700,
                padding:'11px', borderRadius:9, textDecoration:'none', marginBottom:10 }}>
              🔐 Log in to view full claim details
            </Link>

            <div style={{ textAlign:'center' }}>
              <button onClick={()=>navigate('/track')}
                style={{ fontSize:12, color:C.muted, background:'transparent', border:'none', cursor:'pointer' }}>
                ← Check another claim
              </button>
              <span style={{ color:C.border, margin:'0 10px' }}>·</span>
              <a href="tel:18008262534" style={{ fontSize:12, color:C.muted, textDecoration:'none' }}>
                Need help? Call 1-800-VM-CLAIMS
              </a>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Login prompt ── */}
        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:14,
          overflow:'hidden', boxShadow:'0 1px 4px rgba(2,64,153,.06),0 4px 16px rgba(2,64,153,.08)' }}>

          <div style={{ background:`linear-gradient(135deg,${C.navy},${C.blue})`, padding:'16px 18px' }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.white, marginBottom:2 }}>
              🔐 Log In for Full Access
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.7)' }}>
              See everything about Claim #{claim.claimNumber}
            </div>
          </div>

          <div style={{ padding:'14px 18px' }}>
            {[
              { icon:'💳', title:'Exact Payment Amounts',         sub:`See all payment amounts, check numbers, and cleared dates for Claim #${claim.claimNumber}`        },
              { icon:'📞', title:`${claim.adjusterFirst}'s Direct Contact`, sub:'Call or message your adjuster directly — phone and email available after login'         },
              { icon:'📄', title:'Repair Estimates & Documents',  sub:'Download your full estimate, supplement letters, settlement docs, and photos'                     },
              { icon:'📊', title:'Full Timeline & All Events',    sub:'Every status update, vendor event, and milestone from filing to closure'                          },
              { icon:'🚗', title:'All Your Claims in One Place',  sub:'View your complete claims history — auto and property — with full details on each'               },
            ].map((b,i,arr)=>(
              <div key={b.title} style={{ display:'flex', gap:10, padding:'10px 0',
                borderBottom: i<arr.length-1?`1px solid ${C.border}`:'none', alignItems:'flex-start' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{b.title}</div>
                  <div style={{ fontSize:11.5, color:C.muted, marginTop:1 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:'14px 18px', borderTop:`1px solid ${C.border}`, background:C.bg }}>
            <Link to={`/login?redirect=${encodeURIComponent('/claims/search?claim=' + claim.claimNumber)}`}
              style={{ display:'block', width:'100%', background:C.navy, color:C.white,
                fontSize:14, fontWeight:700, padding:'12px', borderRadius:9,
                textDecoration:'none', textAlign:'center', marginBottom:8 }}>
              🔐 Log In to My Account
            </Link>
            <Link to={`/signup?redirect=${encodeURIComponent('/claims/search?claim=' + claim.claimNumber)}`}
              style={{ display:'block', width:'100%', background:C.white, color:C.navy,
                fontSize:13, fontWeight:600, padding:'10px', borderRadius:9,
                border:`2px solid ${C.navy}`, textDecoration:'none', textAlign:'center' }}>
              Create Account — It's Free
            </Link>
            <p style={{ fontSize:11, color:C.faint, textAlign:'center', marginTop:10 }}>
              After login you'll be taken directly to the full details for Claim #{claim.claimNumber}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
