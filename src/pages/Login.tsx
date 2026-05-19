import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import VMlogo from '@/components/ui/VMlogo'

const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF',
  green:'#2EB124', greenLight:'#EDFAEB',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
  error:'#DC2626', errorLight:'#FEF2F2',
}

export default function Login() {
  const navigate          = useNavigate()
  const [params]          = useSearchParams()
  const { login, isAuthenticated } = useAuth()

  /* After login, go to claims search (or whatever redirect param says) */
  const redirect = params.get('redirect') ?? '/claims/search'

  const [tab,      setTab]      = useState<'customer'|'agent'>('customer')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  if (isAuthenticated) {
    navigate(redirect, { replace: true })
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim())    { setError('Please enter your email address.'); return }
    if (!password.trim()) { setError('Please enter your password.'); return }
    setLoading(true)
    try {
      await login(email, password)
      navigate(redirect, { replace: true })
    } catch {
      setError('Invalid email or password. Try any email + any password for this demo.')
    } finally {
      setLoading(false)
    }
  }

  const S = {
    page:  { minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif', display:'flex', flexDirection:'column' as const },
    nav:   { background:C.navy, height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', boxShadow:'0 2px 10px rgba(2,64,153,.3)' },
    card:  { background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'32px', boxShadow:'0 4px 24px rgba(2,64,153,.1)' },
    input: { width:'100%', fontSize:13.5, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, outline:'none', fontFamily:'inherit', transition:'border-color .15s', boxSizing:'border-box' as const },
    btn:   { width:'100%', background:C.navy, color:C.white, fontSize:14, fontWeight:700, padding:'12px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit' },
    label: { fontSize:12, fontWeight:600, color:C.mid, display:'block', marginBottom:5 },
  }

  const lobMsg = params.get('lob')

  return (
    <div style={S.page}>

      {/* NAV */}
      <nav style={S.nav}>
        <Link to="/" style={{ textDecoration:'none' }}>
          <VMlogo size="md" variant="full-light"/>
        </Link>
        <Link to="/" style={{ fontSize:13, color:'rgba(255,255,255,.55)', textDecoration:'none' }}>
          ← Back to Home
        </Link>
      </nav>

      {/* CENTERED CARD */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={S.card}>

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                <VMlogo size="lg" variant="full"/>
              </div>
              <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>
                Welcome back
              </h1>
              <p style={{ fontSize:13, color:C.muted }}>Sign in to manage your claims</p>
              {lobMsg && (
                <div style={{ marginTop:10, padding:'8px 12px', background:C.bluePale,
                  border:`1px solid #BFDBFE`, borderRadius:8, fontSize:12, color:C.navy, fontWeight:600 }}>
                  Login required to file a {lobMsg} claim
                </div>
              )}
            </div>

            {/* Tab: Customer / Agent */}
            <div style={{ display:'flex', background:C.bg, borderRadius:10, padding:4, marginBottom:24 }}>
              {(['customer','agent'] as const).map(t=>(
                <button key={t} type="button" onClick={()=>setTab(t)}
                  style={{ flex:1, padding:'8px', borderRadius:8, fontSize:13, fontWeight:600,
                    border:'none', cursor:'pointer', transition:'all .15s',
                    background: tab===t ? C.white : 'transparent',
                    color:      tab===t ? C.navy  : C.muted,
                    boxShadow:  tab===t ? '0 1px 4px rgba(0,0,0,.1)' : 'none' }}>
                  {t==='customer' ? '🧑 Customer' : '👔 Agent / Adjuster'}
                </button>
              ))}
            </div>

            {/* Demo hint */}
            <div style={{ background:C.greenLight, border:`1px solid ${C.greenBorder||'#A8E4A2'}`,
              borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1B5E20',
              marginBottom:20, display:'flex', alignItems:'center', gap:6 }}>
              ✅ <span><strong>Demo:</strong> Enter any email + any password to log in</span>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={S.label}>Email Address</label>
                <input
                  type="email" value={email}
                  onChange={e=>{ setEmail(e.target.value); setError('') }}
                  placeholder={tab==='customer'?'your@email.com':'agent@carrier.com'}
                  style={{ ...S.input, borderColor: error ? C.error : C.border }}
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={{ ...S.label, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span>Password</span>
                  <button type="button" style={{ fontSize:11.5, color:C.navy, fontWeight:600,
                    background:'transparent', border:'none', cursor:'pointer' }}>
                    Forgot password?
                  </button>
                </label>
                <input
                  type="password" value={password}
                  onChange={e=>{ setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  style={{ ...S.input, borderColor: error ? C.error : C.border }}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div style={{ fontSize:12.5, color:C.error, background:C.errorLight,
                  border:`1px solid #FECACA`, borderRadius:8, padding:'8px 12px' }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ ...S.btn, opacity:loading?.7:1 }}>
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                      <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)',
                        borderTopColor:C.white, borderRadius:'50%', display:'inline-block',
                        animation:'spin .7s linear infinite' }}/>
                      Signing in…
                    </span>
                  : '🔐 Sign In'
                }
              </button>
            </form>

            {/* SSO divider */}
            <div style={{ position:'relative', margin:'20px 0', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ flex:1, height:1, background:C.border }}/>
              <span style={{ fontSize:11.5, color:C.faint, whiteSpace:'nowrap' }}>or continue with</span>
              <div style={{ flex:1, height:1, background:C.border }}/>
            </div>

            {/* SSO options */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[['🔑','Okta SSO'],['🔵','Microsoft Azure AD'],['⚫','Google Workspace']].map(([icon, label])=>(
                <button key={label as string} type="button"
                  onClick={()=>alert(`${label} SSO — configure in admin settings when ready`)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    border:`1px solid ${C.border}`, borderRadius:10, fontSize:13, fontWeight:600,
                    color:C.navy, cursor:'pointer', background:C.white, fontFamily:'inherit',
                    transition:'background .15s' }}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background=C.bg}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background=C.white}>
                  <span style={{ fontSize:16 }}>{icon as string}</span>
                  {label as string}
                  <span style={{ marginLeft:'auto', fontSize:10, color:C.faint,
                    background:C.bg, border:`1px solid ${C.border}`, padding:'2px 8px', borderRadius:10 }}>
                    Configure
                  </span>
                </button>
              ))}
            </div>

            <p style={{ textAlign:'center', fontSize:12.5, color:C.muted, marginTop:20 }}>
              New customer?{' '}
              <Link to="/signup" style={{ color:C.navy, fontWeight:700, textDecoration:'none' }}>
                Create an account
              </Link>
            </p>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:C.muted, marginTop:12 }}>
            Not a customer?{' '}
            <Link to="/claims/third-party/new" style={{ color:C.navy, fontWeight:600, textDecoration:'none' }}>
              File a third-party claim
            </Link>
          </p>

          <p style={{ textAlign:'center', fontSize:11, color:C.faint, marginTop:8 }}>
            🔒 Secured with 256-bit encryption · SOC 2 Type II certified
          </p>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
