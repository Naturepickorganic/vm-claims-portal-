/* ═══════════════════════════════════════════════════════════════
   ClaimClosure.tsx — Claim closure tab
   Shell: summary cards + closure metrics
   Activities to be wired in Sprint 3
   VM Claims Portal · Sprint 2
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
}

const C = {
  navy:'#024099', green:'#2EB124', border:'#E2E8F2',
  bg:'#F5F8FF',   text:'#1A2744',  muted:'#718096', faint:'#A0AEC0',
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

export default function ClaimClosure({ claimNumber, policyNumber, insuredName, adjusterName, lobType, totalPayout, closedDate, duration }: Props) {
  const fmt = (n:number) => `$${n.toLocaleString()}`

  return (
    <div style={{ padding:0 }}>

      {/* Closure banner */}
      <div style={{
        background:    'linear-gradient(135deg,#1B3A5C,#024099)',
        borderRadius:  '0 0 0 0',
        padding:       '18px 16px',
        textAlign:     'center',
        color:         '#fff',
        marginBottom:  14,
      }}>
        <div style={{ fontSize:28, marginBottom:6 }}>✅</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Your claim has been settled</div>
        <div style={{ fontSize:12, opacity:.75 }}>
          Thank you for trusting us with your claim, {insuredName.split(' ')[0]}.
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ padding:'0 16px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <MetricCard label="Total payout"      value={totalPayout ? fmt(totalPayout) : '$—'}    sub="Net of deductible"           color="#0F6E56" />
        <MetricCard label="Claim duration"     value={duration ? `${duration} days` : '— days'} sub="From filed to closed"        color={C.navy}  />
        <MetricCard label="Repair warranty"    value="12 months"                                 sub="Shop guarantee on all work"  color="#854F0B" />
        <MetricCard label="Subrogation"        value="In review"                                 sub="Recovery possible · 30 days" color="#718096" />
      </div>

      {/* Closure details */}
      <div style={{ padding:'0 16px 14px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Closure summary</div>
        {[
          ['Claim number',  claimNumber],
          ['Policy number', policyNumber],
          ['Closed by',     adjusterName],
          ['Closed date',   closedDate || '—'],
          ['LOB',           ({ auto:'Personal Auto', property:'Personal Property', commAuto:'Commercial Auto', wc:'Workers Comp', cmp:'Commercial Multi-Peril' })[lobType]],
        ].map(([label, val]) => (
          <div key={label} style={{ display:'grid', gridTemplateColumns:'130px 1fr', padding:'5px 0', borderBottom:`1px solid ${C.bg}`, fontSize:12 }}>
            <span style={{ color:C.faint }}>{label}</span>
            <span style={{ fontWeight:600, color:C.text }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Next steps placeholder — wired in Sprint 3 */}
      <div style={{ margin:'0 16px 14px', background:'#F0F4FF', border:`1px dashed ${C.border}`, borderRadius:8, padding:'12px 14px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Next steps</div>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
          • Review your updated policy coverage<br/>
          • Check if subrogation recovery applies<br/>
          • Rate your claims experience (survey coming soon)<br/>
          • See recommendations in the sidebars →
        </div>
        <div style={{ fontSize:10, color:C.faint, marginTop:8, fontStyle:'italic' }}>
          Closure activities · Surveys · Subrogation tracking — Sprint 3
        </div>
      </div>

    </div>
  )
}
