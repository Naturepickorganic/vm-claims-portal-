/* ═══════════════════════════════════════════════════════════════
   ClaimClosure.tsx — Claim closure tab
   Shows a settled summary for CLOSED claims, and an in-progress
   view for OPEN claims. Closed/open is derived from closedDate
   (passed only when the claim is closed) or an explicit statusType.
   VM Claims Portal
   ═══════════════════════════════════════════════════════════════ */
import type { LobType } from '@/lib/crossSellEngine'

interface Props {
  claimNumber:  string
  policyNumber: string
  insuredName:  string
  adjusterName: string
  lobType:      LobType
  totalPayout?: number
  closedDate?:  string
  duration?:    number
  statusType?:  string   // 'on-track' | 'action-needed' | 'closed' (optional)
}

const C = {
  navy:'#024099', green:'#2EB124', border:'#E2E8F2',
  bg:'#F5F8FF',   text:'#1A2744',  muted:'#718096', faint:'#A0AEC0',
}

const LOB_LABEL: Record<string,string> = {
  auto:'Personal Auto', property:'Personal Property', commAuto:'Commercial Auto', wc:'Workers Comp', cmp:'Commercial Multi-Peril',
}

function MetricCard({ label, value, sub, color='#024099' }:{ label:string; value:string; sub:string; color?:string }) {
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:'12px 14px', background:'#F8FAFF' }}>
      <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color, lineHeight:1.1 }}>{value}</div>
      <div style={{ fontSize:11, color:C.faint, marginTop:3 }}>{sub}</div>
    </div>
  )
}

function SummaryRow({ label, val }:{ label:string; val:string }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'130px 1fr', padding:'5px 0', borderBottom:`1px solid ${C.bg}`, fontSize:12 }}>
      <span style={{ color:C.faint }}>{label}</span>
      <span style={{ fontWeight:600, color:C.text }}>{val}</span>
    </div>
  )
}

export default function ClaimClosure({ claimNumber, policyNumber, insuredName, adjusterName, lobType, totalPayout, closedDate, duration, statusType }: Props) {
  const fmt = (n:number) => `$${n.toLocaleString()}`
  const firstName = insuredName?.split(' ')[0] || 'there'
  const lob = LOB_LABEL[lobType] || lobType
  /* Closed if an explicit status says so, otherwise infer from closedDate (only set for closed claims) */
  const isClosed = typeof statusType === 'string' ? statusType === 'closed' : !!closedDate

  /* ── OPEN / IN-PROGRESS ─────────────────────────────────────── */
  if (!isClosed) {
    return (
      <div style={{ padding:0 }}>
        <div style={{ background:'linear-gradient(135deg,#1B3A5C,#024099)', padding:'18px 16px', textAlign:'center', color:'#fff', marginBottom:14 }}>
          <div style={{ fontSize:28, marginBottom:6 }}>🛠️</div>
          <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Your claim is open and in progress</div>
          <div style={{ fontSize:12, opacity:.75 }}>
            Closure details will appear here once your claim is settled, {firstName}.
          </div>
        </div>

        <div style={{ padding:'0 16px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <MetricCard label="Status"   value="Open"        sub="Active · in progress"      color={C.navy}  />
          <MetricCard label="Adjuster" value={adjusterName || '—'} sub="Handling your claim" color="#0F6E56" />
        </div>

        <div style={{ padding:'0 16px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Claim summary</div>
          <SummaryRow label="Claim number"  val={claimNumber} />
          <SummaryRow label="Policy number" val={policyNumber} />
          <SummaryRow label="Adjuster"      val={adjusterName || '—'} />
          <SummaryRow label="Status"        val="Open — in progress" />
          <SummaryRow label="LOB"           val={lob} />
        </div>

        <div style={{ margin:'0 16px 14px', background:'#F0F4FF', border:`1px dashed ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>What happens at closure</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
            • Final settlement amount and payout<br/>
            • Repair warranty details<br/>
            • Subrogation outcome, if any<br/>
            • Closure satisfaction survey
          </div>
          <div style={{ fontSize:10, color:C.faint, marginTop:8, fontStyle:'italic' }}>
            These populate automatically once ClaimCenter marks the claim closed.
          </div>
        </div>
      </div>
    )
  }

  /* ── CLOSED / SETTLED ───────────────────────────────────────── */
  return (
    <div style={{ padding:0 }}>
      <div style={{ background:'linear-gradient(135deg,#1B3A5C,#024099)', padding:'18px 16px', textAlign:'center', color:'#fff', marginBottom:14 }}>
        <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Your claim has been settled</div>
        <div style={{ fontSize:12, opacity:.75 }}>
          Thank you for trusting us with your claim, {firstName}.
        </div>
      </div>

      <div style={{ padding:'0 16px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <MetricCard label="Total payout"   value={totalPayout ? fmt(totalPayout) : '$—'}    sub="Net of deductible"          color="#0F6E56" />
        <MetricCard label="Claim duration" value={duration ? `${duration} days` : '— days'} sub="From filed to closed"       color={C.navy}  />
        <MetricCard label="Repair warranty" value="12 months"                               sub="Shop guarantee on all work" color="#854F0B" />
        <MetricCard label="Subrogation"    value="In review"                                sub="Recovery possible · 30 days" color="#718096" />
      </div>

      <div style={{ padding:'0 16px 14px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Closure summary</div>
        <SummaryRow label="Claim number"  val={claimNumber} />
        <SummaryRow label="Policy number" val={policyNumber} />
        <SummaryRow label="Closed by"     val={adjusterName} />
        <SummaryRow label="Closed date"   val={closedDate || '—'} />
        <SummaryRow label="LOB"           val={lob} />
      </div>

      <div style={{ margin:'0 16px 14px', background:'#F0F4FF', border:`1px dashed ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Next steps</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
          • Review your updated policy coverage<br/>
          • Check if subrogation recovery applies<br/>
          • Rate your claims experience (survey coming soon)<br/>
          • See recommendations in the sidebars →
        </div>
      </div>
    </div>
  )
}
