import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import FNOLWizard from './FNOLWizard'

/* ════════════════════════════════════════════════════════════════════════
   AutoFNOLGate — sits in front of the existing Auto FNOL wizard.

   • Enter a real policy number → live PolicyCenter lookup (real insured +
     real vehicles + real liability coverage). Pick the vehicle on the loss.
     The wizard then runs in LIVE mode: real vehicle prefilled, incident
     fields BLANK, live coverage, live claim submit.
   • "Continue to demo" → renders the wizard exactly as today (mock DEFAULTS,
     USAA demo untouched).

   Live data is passed to the wizard via window.__VM_AUTO_LIVE so the wizard
   can read it without restructuring its props. Mock path leaves it undefined.
   ════════════════════════════════════════════════════════════════════════ */

const VM = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', green:'#2EB124',
  greenLight:'#EDFAEB', greenBorder:'#A8E4A2', amber:'#B7791F', amberLight:'#FFFBEB',
  red:'#C53030', redLight:'#FFF5F5', border:'#E2E8F2', bg:'#F5F8FF',
  textDark:'#1A2744', textMid:'#4A5568', textLight:'#718096', white:'#FFFFFF',
}

const PROXY = ((import.meta as any).env?.VITE_PROXY_URL as string) || ''
const isLive = () => !!PROXY && PROXY.trim() !== ''

export type AutoLiveVehicle = { id?: string; year?: string; make?: string; model?: string; vin?: string; color?: string; plate?: string; label?: string }
export type AutoLiveData = {
  policyNumber: string
  insured?: string
  inForce?: boolean
  periodStart?: string
  periodEnd?: string
  address?: string
  vehicle?: AutoLiveVehicle              // the one selected for this loss
  vehicles?: AutoLiveVehicle[]
  coverageLines?: { id?: string; name?: string; limits?: string }[]
}

declare global {
  interface Window { __VM_AUTO_LIVE?: AutoLiveData }
}

export default function AutoFNOLGate() {
  const navigate = useNavigate()
  const [policyInput, setPolicyInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [gate, setGate]       = useState<AutoLiveData | null>(null)
  const [pickedId, setPickedId] = useState<string>('')
  const [start, setStart]     = useState(false)   // start the wizard

  const verify = async () => {
    setError(''); setLoading(true)
    try {
      if (!isLive()) { setError('Live verification needs the proxy. You can continue with the demo below.'); setLoading(false); return }
      const { data } = await axios.post(`${PROXY}/api/policy/auto-lookup`, { policyNumber: policyInput }, { timeout: 15000 })
      if (!data?.found) { setError('No personal auto policy found with that number.'); setGate(null) }
      else {
        const g: AutoLiveData = {
          policyNumber: data.policyNumber, insured: data.insured, inForce: data.inForce,
          periodStart: data.periodStart, periodEnd: data.periodEnd, address: data.address,
          vehicles: data.vehicles || [], coverageLines: data.coverage?.lines || [],
        }
        setGate(g)
        if (g.vehicles && g.vehicles.length) setPickedId(g.vehicles[0].id || '')
      }
    } catch {
      setError('Could not reach the policy service. Check VPN / proxy and try again.')
    } finally { setLoading(false) }
  }

  const beginLive = () => {
    if (!gate) return
    const vehicle = (gate.vehicles || []).find(v => v.id === pickedId) || gate.vehicles?.[0]
    window.__VM_AUTO_LIVE = { ...gate, vehicle }
    setStart(true)
  }
  const beginDemo = () => {
    window.__VM_AUTO_LIVE = undefined   // mock mode — wizard uses its DEFAULTS
    setStart(true)
  }

  if (start) return <FNOLWizard />

  const card: React.CSSProperties = { background:VM.white, border:`1px solid ${VM.border}`, borderRadius:14, padding:'22px 24px' }
  const input: React.CSSProperties = { width:'100%', fontSize:14, border:`1px solid ${VM.border}`, borderRadius:8, padding:'10px 12px', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
  const primary: React.CSSProperties = { background:VM.navy, color:VM.white, border:'none', borderRadius:10, padding:'11px 22px', fontSize:14, fontWeight:700, cursor:'pointer' }
  const ghost: React.CSSProperties = { background:VM.white, color:VM.textMid, border:`1.5px solid ${VM.border}`, borderRadius:10, padding:'11px 20px', fontSize:14, fontWeight:600, cursor:'pointer' }

  return (
    <div style={{ minHeight:'100vh', background:VM.bg, fontFamily:'"DM Sans",system-ui,sans-serif' }}>
      <nav style={{ height:60, background:VM.navy, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px' }}>
        <button onClick={() => navigate('/')} style={{ background:'transparent', border:'none', color:VM.white, fontSize:15, fontWeight:700, cursor:'pointer' }}>ValueMomentum <span style={{ color:'#9FC2FF' }}>Claims</span></button>
        <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>Personal Auto · File a Claim</span>
      </nav>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'28px 24px 60px' }}>
        {!gate ? (
          <div style={card}>
            <div style={{ fontSize:11, fontWeight:700, color:VM.textLight, textTransform:'uppercase', letterSpacing:'.06em' }}>Step 1 — Verify your policy</div>
            <h1 style={{ fontSize:24, fontWeight:800, color:VM.textDark, margin:'6px 0 4px' }}>File a Personal Auto claim</h1>
            <p style={{ fontSize:14, color:VM.textLight, margin:'0 0 18px' }}>Enter your auto policy number — we'll verify it and pull your real vehicle and coverage.</p>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:VM.textMid, marginBottom:5, textTransform:'uppercase' }}>Policy number</label>
            <div style={{ display:'flex', gap:10 }}>
              <input style={{ ...input, flex:1 }} placeholder="e.g. 6428405338" value={policyInput} onChange={e => setPolicyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} />
              <button style={primary} onClick={verify} disabled={loading}>{loading ? 'Verifying…' : 'Verify policy'}</button>
            </div>
            {error && <div style={{ marginTop:12, fontSize:13, color:VM.red, background:VM.redLight, border:'1px solid #FEB2B2', borderRadius:8, padding:'10px 12px' }}>{error}</div>}
            <div style={{ marginTop:18, paddingTop:16, borderTop:`1px solid ${VM.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12.5, color:VM.textLight }}>Just exploring? Run the guided demo with sample data.</span>
              <button style={ghost} onClick={beginDemo}>Continue to demo →</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ ...card, borderColor:VM.greenBorder, background:VM.greenLight, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <span style={{ fontSize:18 }}>✅</span>
                <span style={{ fontSize:15, fontWeight:700, color:'#226B1C' }}>Policy verified — {gate.insured}</span>
                {gate.inForce && <span style={{ fontSize:11, fontWeight:700, color:VM.green, background:VM.white, border:`1px solid ${VM.greenBorder}`, padding:'2px 10px', borderRadius:12 }}>In force</span>}
              </div>
              <div style={{ fontSize:13, color:'#2F6A28' }}>Auto policy #{gate.policyNumber}{gate.periodEnd ? ` · through ${gate.periodEnd}` : ''}</div>
            </div>

            <div style={card}>
              <h2 style={{ fontSize:17, fontWeight:800, color:VM.textDark, margin:'0 0 4px' }}>Which vehicle was involved?</h2>
              <p style={{ fontSize:12.5, color:VM.textLight, margin:'0 0 14px' }}>Pulled live from your policy — pick the one in this incident.</p>
              <div style={{ display:'grid', gap:10 }}>
                {(gate.vehicles || []).map(v => (
                  <div key={v.id} onClick={() => setPickedId(v.id || '')} style={{ border:`1.5px solid ${pickedId === v.id ? VM.blue : VM.border}`, background: pickedId === v.id ? VM.bluePale : VM.white, borderRadius:10, padding:'12px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:14.5, fontWeight:700, color:VM.textDark }}>🚗 {v.label}</div>
                      <div style={{ fontSize:12, color:VM.textLight }}>{v.color ? `${v.color} · ` : ''}VIN {v.vin}{v.plate ? ` · ${v.plate}` : ''}</div>
                    </div>
                    <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${pickedId === v.id ? VM.blue : VM.border}`, background: pickedId === v.id ? VM.blue : VM.white }} />
                  </div>
                ))}
                {(!gate.vehicles || gate.vehicles.length === 0) && <div style={{ fontSize:13, color:VM.amber, background:VM.amberLight, borderRadius:8, padding:'10px 12px' }}>No vehicles returned for this policy.</div>}
              </div>

              {gate.coverageLines && gate.coverageLines.length > 0 && (
                <div style={{ marginTop:16 }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:VM.textMid, marginBottom:6 }}>Coverage on this policy (live):</div>
                  {gate.coverageLines.map((c, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderTop: i ? `1px solid ${VM.border}` : 'none' }}>
                      <span style={{ color:VM.textMid }}>{c.name}</span>
                      <span style={{ color:VM.textDark, fontWeight:600 }}>{c.limits || '—'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', marginTop:18 }}>
                <button style={ghost} onClick={() => { setGate(null); setError('') }}>← Back</button>
                <button style={primary} onClick={beginLive} disabled={!pickedId}>Start claim with this vehicle →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
