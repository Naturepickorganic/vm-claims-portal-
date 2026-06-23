import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

/* ════════════════════════════════════════════════════════════════════════
   SBL — Small Business General Liability FNOL wizard.
   • Gate verifies the SBL policy live (proxy → PolicyCenter search).
   • Branch: Liability (live GL coverage + live claim) | Property (mock).
   • 6 steps, then submit → live ClaimCenter claim via proxy.
   Live when VITE_API_BASE_URL is set; mock fallback otherwise.
   ════════════════════════════════════════════════════════════════════════ */

const VM = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', gold:'#FABD00', goldLight:'#FFF8E1',
  green:'#2EB124', greenLight:'#EDFAEB', amber:'#B7791F', amberLight:'#FFFBEB',
  red:'#C53030', redLight:'#FFF5F5', border:'#E2E8F2', bg:'#F5F8FF',
  textDark:'#1A2744', textMid:'#4A5568', textLight:'#718096', white:'#FFFFFF',
}

const API_BASE = ((import.meta as any).env?.VITE_PROXY_URL as string) || ''
const isMock = () => !API_BASE || API_BASE.trim() === ''

type Branch = 'liability' | 'property'
type Gate = {
  found: boolean
  policyNumber: string
  insured: string
  inForce: boolean
  periodStart?: string
  periodEnd?: string
  address?: string
  coverage?: { agg?: string; occ?: string; ded?: string; med?: string }
}

const STEPS = [
  { name:'Incident type',        sub:'What kind of claim'        },
  { name:'The business',         sub:'Prefilled from policy'     },
  { name:'Claimant / damage',    sub:'Who or what was affected'  },
  { name:'Detail',               sub:'Injury or loss detail'     },
  { name:'Evidence',             sub:'Photos, reports, witness'  },
  { name:'Review & submit',      sub:'Confirm and file'          },
]

const LIABILITY_TYPES = [
  { id:'slipfall',  icon:'🧹', label:'Customer slip / fall',    sub:'Injury on premises'      },
  { id:'injury',    icon:'🤕', label:'Bodily injury',           sub:'Third party hurt'        },
  { id:'product',   icon:'📦', label:'Product liability',       sub:'Product caused harm'     },
  { id:'propdamage',icon:'🛠️', label:'Damage to others',        sub:"Third party's property"  },
]
const PROPERTY_TYPES = [
  { id:'fire',   icon:'🔥', label:'Fire / smoke',     sub:'Building or contents'  },
  { id:'theft',  icon:'🔓', label:'Theft / burglary', sub:'Stolen property'       },
  { id:'water',  icon:'💧', label:'Water damage',     sub:'Leak, flood, burst'    },
  { id:'vandal', icon:'🚧', label:'Vandalism',        sub:'Intentional damage'    },
]

const fmtMoney = (code?: string) => {
  if (!code) return '—'
  const m = code.match(/^(\d+)k?usd$/i)
  if (!m) return code
  const n = parseInt(m[1], 10)
  if (/kusd$/i.test(code)) return '$' + (n * 1000).toLocaleString()
  return '$' + n.toLocaleString()
}

export default function SBLFNOLWizard() {
  const navigate = useNavigate()

  const [policyInput, setPolicyInput] = useState('')
  const [gate, setGate]   = useState<Gate | null>(null)
  const [gateLoading, setGateLoading] = useState(false)
  const [gateError, setGateError]     = useState('')

  const [branch, setBranch]   = useState<Branch | null>(null)
  const [step, setStep]       = useState(0)
  const [incidentType, setIncidentType] = useState('')
  const [form, setForm]       = useState<Record<string, string>>({})
  const [submitting, setSubmitting]   = useState(false)
  const [result, setResult]   = useState<{ claimNumber: string } | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  /* ── Gate: verify SBL policy live ─────────────────────────────── */
  const verify = async () => {
    setGateError(''); setGateLoading(true)
    try {
      if (isMock()) {
        await new Promise(r => setTimeout(r, 600))
        setGate({
          found:true, policyNumber: policyInput || '5069142059', insured:'Bluebonnet Cafe LLC',
          inForce:true, periodStart:'2026-06-20', periodEnd:'2027-06-20',
          address:'300 Market St, Dallas, TX 75201',
          coverage:{ agg:'2000kusd', occ:'1000kusd', ded:'1000usd', med:'10kusd' },
        })
      } else {
        const { data } = await axios.post(`${API_BASE}/api/policy/lookup`, { policyNumber: policyInput }, { timeout: 15000 })
        if (!data?.found) { setGateError('No Small Business policy found with that number.'); setGate(null) }
        else setGate({
          found:true, policyNumber:data.policyNumber || policyInput, insured:data.insured || data.insuredName,
          inForce:data.inForce !== false, periodStart:data.periodStart, periodEnd:data.periodEnd,
          address:data.address, coverage:data.coverage || {},
        })
      }
    } catch {
      setGateError('Could not reach the policy service. Check the connection and try again.')
    } finally { setGateLoading(false) }
  }

  /* ── Submit: live ClaimCenter GL claim via proxy ──────────────── */
  const submit = async () => {
    setSubmitting(true)
    try {
      if (isMock()) {
        await new Promise(r => setTimeout(r, 1400))
        setResult({ claimNumber: '999-99-' + Math.floor(900000 + Math.random() * 99999) })
      } else {
        const payload = {
          lob: 'sbl', branch, incidentType,
          policyNumber: gate?.policyNumber,
          description: form.description || `${branch === 'liability' ? 'General liability' : 'Property'} claim — ${incidentType}`,
          lossLocation: gate?.address,
          claimant: branch === 'liability'
            ? { firstName: form.claimantFirst, lastName: form.claimantLast, phone: form.claimantPhone, relationship: form.relationship }
            : undefined,
          injury: branch === 'liability'
            ? { bodyPart: form.bodyPart, injuryType: form.injuryType, severity: form.severity, treatment: form.treatment, attorney: form.attorney }
            : undefined,
          property: branch === 'property'
            ? { cause: incidentType, estLoss: form.estLoss, closed: form.closed, daysAffected: form.days }
            : undefined,
        }
        const { data } = await axios.post(`${API_BASE}/api/v1/claims/fnol`, payload, { timeout: 20000 })
        setResult({ claimNumber: data.claimNumber || data.claim_number || 'pending' })
      }
    } catch {
      setResult({ claimNumber: 'error' })
    } finally { setSubmitting(false) }
  }

  /* ── Shared styles ────────────────────────────────────────────── */
  const card: React.CSSProperties = { background:VM.white, border:`1px solid ${VM.border}`, borderRadius:14, padding:'20px 22px' }
  const label: React.CSSProperties = { display:'block', fontSize:11, fontWeight:700, color:VM.textMid, marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }
  const input: React.CSSProperties = { width:'100%', fontSize:14, border:`1px solid ${VM.border}`, borderRadius:8, padding:'9px 12px', outline:'none', background:VM.white, color:VM.textDark, boxSizing:'border-box', fontFamily:'inherit' }
  const onFile: React.CSSProperties = { ...input, background:VM.greenLight, color:VM.textDark }
  const primaryBtn: React.CSSProperties = { background:VM.navy, color:VM.white, border:'none', borderRadius:10, padding:'11px 24px', fontSize:14, fontWeight:700, cursor:'pointer' }
  const ghostBtn: React.CSSProperties = { background:VM.white, color:VM.textMid, border:`1.5px solid ${VM.border}`, borderRadius:10, padding:'11px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }

  const incidentTypes = branch === 'property' ? PROPERTY_TYPES : LIABILITY_TYPES

  /* ════════════════ RENDER ════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:VM.bg, fontFamily:'"DM Sans",system-ui,sans-serif' }}>
      {/* Nav */}
      <nav style={{ height:60, background:VM.navy, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px' }}>
        <button onClick={() => navigate('/')} style={{ background:'transparent', border:'none', color:VM.white, fontSize:15, fontWeight:700, cursor:'pointer' }}>ValueMomentum <span style={{ color:'#9FC2FF' }}>Claims</span></button>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>Small Business · General Liability FNOL</span>
      </nav>

      <div style={{ maxWidth:860, margin:'0 auto', padding:'28px 24px 60px' }}>

        {/* ── GATE ─────────────────────────────────────────────── */}
        {!gate && (
          <div style={{ ...card, marginTop:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:VM.textLight, textTransform:'uppercase', letterSpacing:'.06em' }}>Step 1 — Verify your policy</div>
            <h1 style={{ fontSize:24, fontWeight:800, color:VM.textDark, margin:'6px 0 4px' }}>File a Small Business claim</h1>
            <p style={{ fontSize:14, color:VM.textLight, margin:'0 0 18px' }}>Enter your General Liability policy number to begin. We'll verify it and pull your coverage.</p>
            <label style={label}>Policy number</label>
            <div style={{ display:'flex', gap:10 }}>
              <input style={{ ...input, flex:1 }} placeholder="e.g. 5069142059" value={policyInput}
                onChange={e => setPolicyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} />
              <button style={primaryBtn} onClick={verify} disabled={gateLoading}>{gateLoading ? 'Verifying…' : 'Verify policy'}</button>
            </div>
            {gateError && <div style={{ marginTop:12, fontSize:13, color:VM.red, background:VM.redLight, border:`1px solid #FEB2B2`, borderRadius:8, padding:'10px 12px' }}>{gateError}</div>}
            {isMock() && <div style={{ marginTop:12, fontSize:12, color:VM.amber, background:VM.amberLight, borderRadius:8, padding:'8px 12px' }}>Demo mode — any number resolves to a sample policy. Connect the proxy for live verification.</div>}
          </div>
        )}

        {/* ── VERIFIED HEADER + BRANCH ─────────────────────────── */}
        {gate && !branch && (
          <>
            <div style={{ ...card, marginTop:20, borderColor:'#A8E4A2', background:VM.greenLight }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <span style={{ fontSize:18 }}>✅</span>
                <span style={{ fontSize:15, fontWeight:700, color:'#226B1C' }}>Policy verified — {gate.insured}</span>
                {gate.inForce && <span style={{ fontSize:11, fontWeight:700, color:VM.green, background:VM.white, border:'1px solid #A8E4A2', padding:'2px 10px', borderRadius:12 }}>In force</span>}
              </div>
              <div style={{ fontSize:13, color:'#2F6A28' }}>GL policy #{gate.policyNumber}{gate.periodEnd ? ` · through ${gate.periodEnd}` : ''}{gate.address ? ` · ${gate.address}` : ''}</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:14 }}>
                {[['GL aggregate', gate.coverage?.agg], ['Per occurrence', gate.coverage?.occ], ['Deductible', gate.coverage?.ded], ['Medical exp.', gate.coverage?.med]].map(([k, v], i) => (
                  <div key={i} style={{ background:VM.white, border:`1px solid ${VM.border}`, borderRadius:8, padding:'9px 12px' }}>
                    <div style={{ fontSize:11, color:VM.textLight }}>{k}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:VM.textDark }}>{fmtMoney(v as string)}</div>
                  </div>
                ))}
              </div>
            </div>

            <h2 style={{ fontSize:18, fontWeight:800, color:VM.textDark, margin:'24px 0 4px' }}>What kind of claim is this?</h2>
            <p style={{ fontSize:13, color:VM.textLight, margin:'0 0 14px' }}>The form adapts to what happened.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div onClick={() => { setBranch('liability'); setStep(0) }} style={{ ...card, cursor:'pointer', border:`2px solid ${VM.blue}` }}>
                <div style={{ fontSize:26 }}>⚠️</div>
                <div style={{ fontSize:16, fontWeight:700, color:VM.textDark, margin:'6px 0 4px' }}>Liability claim</div>
                <p style={{ fontSize:12.5, color:VM.textMid, lineHeight:1.5, margin:0 }}>Someone was hurt or their property damaged <i>by</i> the business — a third party claims against you.</p>
                <div style={{ marginTop:10, fontSize:11, fontWeight:700, color:VM.green }}>● Covered by your General Liability — live</div>
              </div>
              <div onClick={() => { setBranch('property'); setStep(0) }} style={{ ...card, cursor:'pointer' }}>
                <div style={{ fontSize:26 }}>🏢</div>
                <div style={{ fontSize:16, fontWeight:700, color:VM.textDark, margin:'6px 0 4px' }}>Property claim</div>
                <p style={{ fontSize:12.5, color:VM.textMid, lineHeight:1.5, margin:0 }}>Damage to <i>your own</i> business — building, contents, inventory, or lost income.</p>
                <div style={{ marginTop:10, fontSize:11, fontWeight:700, color:VM.amber }}>● Property coverage pending enablement</div>
              </div>
            </div>
          </>
        )}

        {/* ── WIZARD ───────────────────────────────────────────── */}
        {gate && branch && !result && (
          <>
            {/* Stepper */}
            <div style={{ display:'flex', alignItems:'center', gap:6, margin:'20px 0 18px', flexWrap:'wrap' }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                    background: i < step ? VM.green : i === step ? VM.navy : VM.white, color: i <= step ? VM.white : VM.textLight, border:`1.5px solid ${i <= step ? 'transparent' : VM.border}` }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div style={{ width:18, height:2, background: i < step ? VM.green : VM.border }} />}
                </div>
              ))}
              <span style={{ marginLeft:8, fontSize:13, fontWeight:700, color:VM.textDark }}>{STEPS[step].name}</span>
              <span style={{ fontSize:12, color:VM.textLight }}>· {branch === 'liability' ? 'Liability' : 'Property'} path</span>
            </div>

            <div style={card}>
              {/* STEP 0 — incident type */}
              {step === 0 && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 12px' }}>Select the incident type</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {incidentTypes.map(t => (
                      <div key={t.id} onClick={() => setIncidentType(t.id)} style={{ border:`1.5px solid ${incidentType === t.id ? VM.blue : VM.border}`, background: incidentType === t.id ? VM.bluePale : VM.white, borderRadius:10, padding:'14px 16px', cursor:'pointer' }}>
                        <div style={{ fontSize:22 }}>{t.icon}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:VM.textDark, marginTop:4 }}>{t.label}</div>
                        <div style={{ fontSize:12, color:VM.textLight }}>{t.sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:14 }}>
                    <label style={label}>Date of incident</label>
                    <input type="date" style={input} value={form.date || ''} onChange={e => set('date', e.target.value)} />
                  </div>
                </>
              )}

              {/* STEP 1 — the business (prefilled) */}
              {step === 1 && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 4px' }}>The business</h3>
                  <p style={{ fontSize:12.5, color:VM.textLight, margin:'0 0 14px' }}>Filled from your policy — editable if needed.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div><label style={label}>Business name <span style={{ color:VM.green }}>on file</span></label><input style={onFile} value={gate.insured} readOnly /></div>
                    <div><label style={label}>Policy number <span style={{ color:VM.green }}>on file</span></label><input style={onFile} value={gate.policyNumber} readOnly /></div>
                    <div style={{ gridColumn:'1 / 3' }}><label style={label}>Business location <span style={{ color:VM.green }}>on file</span></label><input style={onFile} value={gate.address || ''} onChange={e => setGate({ ...gate, address: e.target.value })} /></div>
                    <div><label style={label}>Contact name</label><input style={input} placeholder="Who is reporting" value={form.reporter || ''} onChange={e => set('reporter', e.target.value)} /></div>
                    <div><label style={label}>Contact phone</label><input style={input} placeholder="(___) ___-____" value={form.reporterPhone || ''} onChange={e => set('reporterPhone', e.target.value)} /></div>
                  </div>
                </>
              )}

              {/* STEP 2 — claimant (liability) or what was damaged (property) */}
              {step === 2 && branch === 'liability' && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 12px' }}>The claimant &amp; what happened</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div><label style={label}>First name</label><input style={input} placeholder="e.g. Jordan" value={form.claimantFirst || ''} onChange={e => set('claimantFirst', e.target.value)} /></div>
                    <div><label style={label}>Last name</label><input style={input} placeholder="e.g. Avery" value={form.claimantLast || ''} onChange={e => set('claimantLast', e.target.value)} /></div>
                    <div><label style={label}>Phone</label><input style={input} placeholder="(___) ___-____" value={form.claimantPhone || ''} onChange={e => set('claimantPhone', e.target.value)} /></div>
                    <div><label style={label}>Relationship</label><select style={input} value={form.relationship || ''} onChange={e => set('relationship', e.target.value)}><option value="">Select…</option><option>Customer</option><option>Visitor</option><option>Vendor</option><option>Passerby</option><option>Other</option></select></div>
                    <div style={{ gridColumn:'1 / 3' }}><label style={label}>Where on the premises <span style={{ color:VM.green }}>on file</span></label><input style={onFile} value={gate.address || ''} onChange={e => setGate({ ...gate, address: e.target.value })} /></div>
                    <div style={{ gridColumn:'1 / 3' }}><label style={label}>What happened</label><textarea style={{ ...input, minHeight:64, resize:'vertical' }} placeholder="Brief description…" value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
                  </div>
                </>
              )}
              {step === 2 && branch === 'property' && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 12px' }}>What was damaged</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ gridColumn:'1 / 3' }}><label style={label}>Damaged location <span style={{ color:VM.green }}>on file</span></label><input style={onFile} value={gate.address || ''} onChange={e => setGate({ ...gate, address: e.target.value })} /></div>
                    <div style={{ gridColumn:'1 / 3' }}>
                      <label style={label}>What's affected</label>
                      {['Building / structure','Business personal property','Inventory / stock','Equipment / machinery','Signage / exterior'].map(o => (
                        <label key={o} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13.5, color:VM.textDark, padding:'4px 0' }}>
                          <input type="checkbox" checked={(form.affected || '').includes(o)} onChange={e => set('affected', e.target.checked ? `${form.affected || ''}|${o}` : (form.affected || '').replace(`|${o}`, '').replace(o, ''))} />{o}
                        </label>
                      ))}
                    </div>
                    <div style={{ gridColumn:'1 / 3' }}><label style={label}>What happened</label><textarea style={{ ...input, minHeight:60, resize:'vertical' }} placeholder="Brief description…" value={form.description || ''} onChange={e => set('description', e.target.value)} /></div>
                  </div>
                </>
              )}

              {/* STEP 3 — detail */}
              {step === 3 && branch === 'liability' && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 12px' }}>Injury &amp; damage detail</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div><label style={label}>Body part affected</label><select style={input} value={form.bodyPart || ''} onChange={e => set('bodyPart', e.target.value)}><option value="">Select…</option><option>Head / neck</option><option>Back</option><option>Arm / shoulder</option><option>Hand / wrist</option><option>Leg / knee</option><option>Foot / ankle</option><option>Multiple</option></select></div>
                    <div><label style={label}>Injury type</label><select style={input} value={form.injuryType || ''} onChange={e => set('injuryType', e.target.value)}><option value="">Select…</option><option>Strain / sprain</option><option>Fracture</option><option>Laceration</option><option>Contusion</option><option>Burn</option></select></div>
                    <div><label style={label}>Severity</label><select style={input} value={form.severity || ''} onChange={e => set('severity', e.target.value)}><option value="">Select…</option><option>Minor</option><option>Moderate</option><option>Serious</option><option>Severe</option></select></div>
                    <div><label style={label}>Treatment so far</label><select style={input} value={form.treatment || ''} onChange={e => set('treatment', e.target.value)}><option value="">Select…</option><option>None</option><option>First aid</option><option>Urgent care</option><option>ER / hospital</option></select></div>
                    <div><label style={label}>Attorney involved?</label><select style={input} value={form.attorney || ''} onChange={e => set('attorney', e.target.value)}><option value="">Select…</option><option>No</option><option>Yes</option><option>Unknown</option></select></div>
                    <div><label style={label}>Estimated demand</label><input style={input} placeholder="$" value={form.demand || ''} onChange={e => set('demand', e.target.value)} /></div>
                  </div>
                </>
              )}
              {step === 3 && branch === 'property' && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 12px' }}>Extent &amp; business interruption</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                    <div><label style={label}>Est. property loss</label><input style={input} placeholder="$" value={form.estLoss || ''} onChange={e => set('estLoss', e.target.value)} /></div>
                    <div><label style={label}>Business closed?</label><select style={input} value={form.closed || ''} onChange={e => set('closed', e.target.value)}><option value="">Select…</option><option>No</option><option>Partially</option><option>Fully closed</option></select></div>
                    <div><label style={label}>Days affected</label><input type="number" min={0} style={input} placeholder="0" value={form.days || ''} onChange={e => set('days', e.target.value)} /></div>
                  </div>
                  <div style={{ marginTop:14, fontSize:12, color:VM.amber, background:VM.amberLight, borderRadius:8, padding:'10px 12px' }}>Property / business-income coverage will display live once enabled in the carrier instance.</div>
                </>
              )}

              {/* STEP 4 — evidence */}
              {step === 4 && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 12px' }}>Evidence &amp; witnesses</h3>
                  <div style={{ border:`1.5px dashed ${VM.border}`, borderRadius:10, padding:'24px', textAlign:'center', color:VM.textLight, fontSize:13 }}>
                    <div style={{ fontSize:28 }}>📎</div>
                    Drag photos, the incident report, or receipts here, or click to upload.
                  </div>
                  <div style={{ marginTop:14 }}>
                    <label style={label}>Witness (optional)</label>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <input style={input} placeholder="Witness name" value={form.witnessName || ''} onChange={e => set('witnessName', e.target.value)} />
                      <input style={input} placeholder="Witness phone" value={form.witnessPhone || ''} onChange={e => set('witnessPhone', e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {/* STEP 5 — review */}
              {step === 5 && (
                <>
                  <h3 style={{ fontSize:17, fontWeight:700, color:VM.textDark, margin:'0 0 4px' }}>Review &amp; submit</h3>
                  <p style={{ fontSize:12.5, color:VM.textLight, margin:'0 0 14px' }}>This creates a claim in ClaimCenter.</p>
                  <table style={{ width:'100%', fontSize:13.5, borderCollapse:'collapse' }}>
                    <tbody>
                      {[
                        ['Policy', `${gate.policyNumber} · ${gate.insured}`],
                        ['Claim type', `${branch === 'liability' ? 'General Liability' : 'Property'} — ${incidentType}`],
                        ...(branch === 'liability' ? [
                          ['Claimant', `${form.claimantFirst || ''} ${form.claimantLast || ''} (${form.relationship || '—'})`],
                          ['Injury', `${form.bodyPart || '—'} · ${form.injuryType || '—'} · ${form.severity || '—'}`],
                        ] as [string,string][] : [
                          ['Loss', `${form.affected || '—'}`],
                          ['Est. loss', `${form.estLoss || '—'} · closed: ${form.closed || '—'}`],
                        ] as [string,string][]),
                        ['Location', gate.address || '—'],
                        ['Coverage applied', branch === 'liability' ? `GL ${fmtMoney(gate.coverage?.occ)} occ / ${fmtMoney(gate.coverage?.agg)} agg` : 'Property (pending enablement)'],
                      ].map(([k, v], i) => (
                        <tr key={i} style={{ borderTop:`1px solid ${VM.border}` }}>
                          <td style={{ padding:'8px 0', color:VM.textLight, width:'38%' }}>{k}</td>
                          <td style={{ padding:'8px 0', color:VM.textDark, fontWeight:600 }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* Nav buttons */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:18 }}>
              <button style={ghostBtn} onClick={() => step === 0 ? setBranch(null) : setStep(step - 1)}>← Back</button>
              {step < STEPS.length - 1
                ? <button style={primaryBtn} onClick={() => setStep(step + 1)} disabled={step === 0 && !incidentType}>Continue →</button>
                : <button style={{ ...primaryBtn, background:VM.green }} onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit claim to ClaimCenter'}</button>}
            </div>
          </>
        )}

        {/* ── CONFIRMATION ─────────────────────────────────────── */}
        {result && (
          <div style={{ ...card, marginTop:24, textAlign:'center' }}>
            {result.claimNumber === 'error' ? (
              <>
                <div style={{ fontSize:40 }}>⚠️</div>
                <h2 style={{ fontSize:20, fontWeight:800, color:VM.red, margin:'8px 0 4px' }}>Submission issue</h2>
                <p style={{ fontSize:13.5, color:VM.textMid }}>We couldn't reach ClaimCenter. Please check the connection and try again.</p>
                <button style={{ ...ghostBtn, marginTop:16 }} onClick={() => setResult(null)}>Back to review</button>
              </>
            ) : (
              <>
                <div style={{ width:52, height:52, borderRadius:'50%', background:VM.greenLight, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:26 }}>✓</div>
                <h2 style={{ fontSize:22, fontWeight:800, color:VM.textDark, margin:'0 0 4px' }}>Claim submitted</h2>
                <p style={{ fontSize:13.5, color:VM.textLight, margin:'0 0 16px' }}>Filed to ClaimCenter and assigned for review.</p>
                <div style={{ display:'inline-block', textAlign:'left', minWidth:320, background:VM.bg, border:`1px solid ${VM.border}`, borderRadius:10, padding:'14px 18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:VM.textLight }}>Claim number</span>
                    <span style={{ fontSize:16, fontWeight:800, color:VM.textDark }}>{result.claimNumber}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:18 }}>
                  <button style={primaryBtn} onClick={() => navigate(`/claims/search?claim=${result.claimNumber}`)}>View claim status →</button>
                  <button style={ghostBtn} onClick={() => navigate('/')}>Back to home</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
