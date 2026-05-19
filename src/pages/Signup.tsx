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

export default function Signup() {
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const { login } = useAuth()
  const rawRedirect = params.get('redirect')
  const redirect = rawRedirect ? decodeURIComponent(rawRedirect) : '/claims/search'

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [policy,   setPolicy]   = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      // 🔌 Replace with real registration API call
      await login(email, password) // mock: log in after signup
      navigate(redirect, { replace: true })
    } catch {
      setError('Could not create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const S = {
    page:  { minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif', display:'flex', flexDirection:'column' as const },
    nav:   { background:C.navy, height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', boxShadow:'0 2px 10px rgba(2,64,153,.3)' },
    card:  { background:C.white, borderRadius:16, border:`1px solid ${C.border}`, padding:'32px', boxShadow:'0 4px 24px rgba(2,64,153,.1)' },
    input: { width:'100%', fontSize:13.5, border:`1px solid ${C.border}`, borderRadius:8, padding:'10px 12px', color:C.text, outline:'none', fontFamily:'inherit', transition:'border-color .15s', boxSizing:'border-box' as const },
    label: { fontSize:12, fontWeight:600, color:C.mid, display:'block', marginBottom:5 },
    btn:   { width:'100%', background:C.navy, color:C.white, fontSize:14, fontWeight:700, padding:'12px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit' },
  }

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <Link to="/" style={{ textDecoration:'none' }}><VMlogo size="md" variant="full-light"/></Link>
        <Link to="/" style={{ fontSize:13, color:'rgba(255,255,255,.55)', textDecoration:'none' }}>
          ← Back to Home
        </Link>
      </nav>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
        <div style={{ width:'100%', maxWidth:440 }}>
          <div style={S.card}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                <VMlogo size="lg" variant="full"/>
              </div>
              <h1 style={{ fontSize:22, fontWeight:800, color:C.text, marginBottom:4 }}>Create your account</h1>
              <p style={{ fontSize:13, color:C.muted }}>Manage all your claims in one place</p>
            </div>

            <div style={{ background:C.greenLight, border:`1px solid #A8E4A2`,
              borderRadius:8, padding:'8px 12px', fontSize:12, color:'#1B5E20', marginBottom:20 }}>
              ✅ <strong>Demo:</strong> Fill in any details to create a demo account
            </div>

            <form onSubmit={handleSignup} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={S.label}>Full Name <span style={{ color:C.error }}>*</span></label>
                <input value={name} onChange={e=>setName(e.target.value)}
                  placeholder="Sarah M. Johnson" style={S.input}/>
              </div>
              <div>
                <label style={S.label}>Email Address <span style={{ color:C.error }}>*</span></label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="your@email.com" style={S.input} autoComplete="email"/>
              </div>
              <div>
                <label style={S.label}>Phone Number</label>
                <input value={phone} onChange={e=>setPhone(e.target.value)}
                  placeholder="(214) 555-0000" style={S.input}/>
              </div>
              <div>
                <label style={S.label}>Policy Number <span style={{ fontSize:10.5, fontWeight:400, color:C.faint }}>(optional — link an existing policy)</span></label>
                <input value={policy} onChange={e=>setPolicy(e.target.value)}
                  placeholder="e.g. 7407354463" style={S.input}/>
              </div>
              <div>
                <label style={S.label}>Password <span style={{ color:C.error }}>*</span></label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="Min. 8 characters" style={S.input} autoComplete="new-password"/>
              </div>

              {error && (
                <div style={{ fontSize:12.5, color:C.error, background:C.errorLight,
                  border:`1px solid #FECACA`, borderRadius:8, padding:'8px 12px' }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ ...S.btn, opacity:loading?.7:1, marginTop:4 }}>
                {loading ? 'Creating account…' : '✅ Create Account'}
              </button>
            </form>

            <p style={{ textAlign:'center', fontSize:12, color:C.muted, marginTop:20 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color:C.navy, fontWeight:700, textDecoration:'none' }}>
                Sign in
              </Link>
            </p>
          </div>

          <p style={{ textAlign:'center', fontSize:11, color:C.faint, marginTop:10 }}>
            🔒 Secured with 256-bit encryption · SOC 2 Type II certified
          </p>
        </div>
      </div>
    </div>
  )
}
