import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import VMlogo from '@/components/ui/VMlogo'

const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB', greenBorder:'#A8E4A2',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
}

/* ── Valid claim/zip combinations for quick lookup ──
   🔌 Replace with: GET /api/v1/claims/quickstatus?claim={id}&zip={zip}     */
const VALID_LOOKUPS = new Set([
  '000-00-000480|75209','000-00-000521|77001','000-00-000612|75001',
  '000-00-000750|75024','000-00-000751|75034','000-00-000752|75013',
  '000-00-000830|75209','000-00-000831|75070','000-00-000832|75044',
])

export default function TrackClaim() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [claimNum, setClaimNum] = useState('')
  const [zip,      setZip]      = useState('')
  const [error,    setError]    = useState('')

  const handleSearch = () => {
    const key = `${claimNum.trim()}|${zip.trim()}`
    if (!claimNum.trim()) { setError('Please enter your claim number.'); return }
    if (!zip.trim())      { setError('Please enter your ZIP code.'); return }
    if (!VALID_LOOKUPS.has(key)) {
      setError('Claim not found. Please check your claim number and ZIP code.')
      return
    }
    navigate(`/track/result?claim=${claimNum.trim()}&zip=${zip.trim()}`)
  }

  const S = {
    page:  { minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif', display:'flex', flexDirection:'column' as const },
    nav:   { background:C.navy, height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', boxShadow:'0 2px 10px rgba(2,64,153,.3)' },
    hero:  { background:'linear-gradient(135deg,#024099 0%,#02306B 55%,#013080 100%)', padding:'36px 24px', textAlign:'center' as const },
    card:  { background:C.white, border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(2,64,153,.06),0 4px 16px rgba(2,64,153,.08)' },
    input: { width:'100%', fontSize:13, border:`1px solid ${C.border}`, borderRadius:7, padding:'9px 12px', color:C.text, outline:'none', marginBottom:12, fontFamily:'inherit' },
    btn:   { width:'100%', background:C.navy, color:C.white, fontSize:14, fontWeight:700, padding:'12px', borderRadius:9, border:'none', cursor:'pointer' },
  }

  return (
    <div style={S.page}>

      {/* NAV */}
      <nav style={S.nav}>
        <Link to="/" style={{ textDecoration:'none' }}><VMlogo size="md" variant="full-light"/></Link>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Link to="/login" style={{ fontSize:13, fontWeight:600, color:C.white,
            border:'1px solid rgba(255,255,255,.3)', padding:'6px 16px', borderRadius:8, textDecoration:'none' }}>
            Log In
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={S.hero}>
        <h1 style={{ fontSize:26, fontWeight:800, color:C.white, marginBottom:6 }}>Track Your Claim</h1>
        <p style={{ fontSize:13.5, color:'rgba(255,255,255,.65)', maxWidth:480, margin:'0 auto' }}>
          Quick status check — no login required · Or sign in to view full details, payments and documents
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ flex:1, maxWidth:900, margin:'0 auto', width:'100%', padding:'28px 16px',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>

        {/* ── LEFT: Quick Status Lookup ── */}
        <div style={S.card}>
          <div style={{ padding:'16px 18px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, display:'flex', alignItems:'center', gap:7 }}>
              🔍 Quick Claim Status
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
              Check your claim status instantly — no account needed
            </div>
          </div>

          <div style={{ padding:'18px' }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:C.mid, display:'block', marginBottom:5 }}>
              Claim Number <span style={{ color:'#DC2626' }}>*</span>
            </label>
            <input
              value={claimNum}
              onChange={e=>{ setClaimNum(e.target.value); setError('') }}
              onKeyDown={e=>e.key==='Enter'&&handleSearch()}
              placeholder="e.g. 000-00-000480"
              style={{ ...S.input, borderColor: error?'#DC2626':C.border }}
            />

            <label style={{ fontSize:11.5, fontWeight:600, color:C.mid, display:'block', marginBottom:5 }}>
              ZIP Code on Policy <span style={{ color:'#DC2626' }}>*</span>
            </label>
            <input
              value={zip}
              onChange={e=>{ setZip(e.target.value); setError('') }}
              onKeyDown={e=>e.key==='Enter'&&handleSearch()}
              placeholder="e.g. 75209"
              style={{ ...S.input, borderColor: error?'#DC2626':C.border }}
            />

            {error && (
              <div style={{ fontSize:12, color:'#DC2626', marginBottom:10,
                display:'flex', alignItems:'center', gap:5 }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleSearch} style={S.btn}>Check Status →</button>

            <p style={{ fontSize:11, color:C.faint, textAlign:'center', marginTop:10, lineHeight:1.5 }}>
              Your ZIP code is used to verify your identity.<br/>No account or login required for basic status.
            </p>

            {/* Secondary links */}
            <div style={{ borderTop:`1px solid ${C.border}`, marginTop:16, paddingTop:14 }}>
              <div style={{ fontSize:11.5, color:C.muted, marginBottom:10 }}>Other options:</div>
              <button
                onClick={()=>navigate('/roadside')}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  width:'100%', padding:'10px 12px', borderRadius:9, border:`1px solid ${C.border}`,
                  background:C.bg, cursor:'pointer', marginBottom:8, textAlign:'left' as const }}>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>🚛</span>
                  <span>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Need roadside assistance?</div>
                    <div style={{ fontSize:11, color:C.muted }}>Dispatch an Agero provider now — 24/7</div>
                  </span>
                </span>
                <span style={{ fontSize:13, color:C.blue, fontWeight:700 }}>→</span>
              </button>

              <button
                onClick={()=>navigate('/claims/third-party/new')}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  width:'100%', padding:'10px 12px', borderRadius:9, border:`1px solid ${C.border}`,
                  background:C.bg, cursor:'pointer', textAlign:'left' as const }}>
                <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>👤</span>
                  <span>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Not a customer?</div>
                    <div style={{ fontSize:11, color:C.muted }}>File a third-party claim here</div>
                  </span>
                </span>
                <span style={{ fontSize:13, color:C.blue, fontWeight:700 }}>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Benefits + Login (always, no logged-in state here) ── */}
        <div style={S.card}>
          <div style={{ background:`linear-gradient(135deg,${C.navy},${C.blue})`, padding:'16px 18px' }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.white, marginBottom:2 }}>📋 Your Claims Portal</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.7)' }}>
              Sign in to access your full claims history and account
            </div>
          </div>

          <div style={{ padding:'14px 18px' }}>
            {[
              { icon:'📊', title:'All Claims — Full Details',    sub:'View every claim, timeline, documents, and adjuster contact'           },
              { icon:'💳', title:'Payment History & Amounts',    sub:'Exact amounts, check numbers, issue dates, and payment status'          },
              { icon:'📞', title:'Direct Adjuster Contact',      sub:'Call or message your adjuster directly from the portal'                },
              { icon:'📄', title:'Estimates & Documents',        sub:'Download repair estimates, settlement letters, and claim summaries'     },
              { icon:'🚛', title:'File Claims & Roadside',       sub:'Start a new claim or request roadside in under 2 minutes'              },
            ].map((b,i,arr)=>(
              <div key={b.title} style={{ display:'flex', gap:10, padding:'10px 0',
                borderBottom: i<arr.length-1?`1px solid ${C.border}`:'none', alignItems:'flex-start' }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{b.title}</div>
                  <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>{b.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:'14px 18px', borderTop:`1px solid ${C.border}`, background:C.bg }}>
            <Link to="/login"
              style={{ display:'block', width:'100%', background:C.navy, color:C.white,
                fontSize:14, fontWeight:700, padding:'12px', borderRadius:9, border:'none',
                cursor:'pointer', textAlign:'center', textDecoration:'none', marginBottom:8 }}>
              🔐 Log In to My Account
            </Link>
            <Link to="/signup"
              style={{ display:'block', width:'100%', background:C.white, color:C.navy,
                fontSize:13, fontWeight:600, padding:'10px', borderRadius:9,
                border:`2px solid ${C.navy}`, cursor:'pointer', textAlign:'center', textDecoration:'none' }}>
              Create Account — It's Free
            </Link>
          </div>
        </div>

      </div>

      <div style={{ textAlign:'center', paddingBottom:24 }}>
        <Link to="/" style={{ fontSize:13, color:C.muted, textDecoration:'none' }}>← Back to Home</Link>
      </div>
    </div>
  )
}
