import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogo } from '@/lib/logoConfig'

export default function Login() {
  const navigate   = useNavigate()
  const { logo }   = useLogo()
  const [tab, setTab]         = useState<'customer'|'agent'>('customer')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    // TODO: Connect to Auth (Okta / Auth0 / Cognito)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    // Demo: navigate to home after "login"
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* NAV */}
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          {logo.type === 'image'
            ? <img src={logo.src} alt={logo.name} className="h-8 object-contain" />
            : <div className="flex items-center gap-2">
                <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
                <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
              </div>
          }
        </Link>
        <Link to="/" className="text-[13px] text-white/50 hover:text-white transition-colors">← Back to Home</Link>
      </nav>

      {/* MAIN */}
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[420px]">

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center font-display font-black text-[20px] text-white mx-auto mb-3">
                {logo.initials}
              </div>
              <h1 className="font-display font-black text-[22px] text-navy">Welcome back</h1>
              <p className="text-[13px] text-muted mt-1">Sign in to manage your claims</p>
            </div>

            {/* Tab toggle */}
            <div className="flex bg-bg rounded-xl p-1 mb-6">
              {(['customer','agent'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all border-none cursor-pointer capitalize ${tab===t ? 'bg-white text-navy shadow-sm' : 'bg-transparent text-muted'}`}>
                  {t === 'customer' ? '🧑 Customer' : '👔 Agent / Adjuster'}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="field">
                <label className="field-label">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={tab === 'customer' ? 'sarah.johnson@email.com' : 'agent@company.com'}
                  className="field-input" autoComplete="email" />
              </div>
              <div className="field">
                <label className="field-label flex justify-between">
                  <span>Password</span>
                  <button type="button" className="text-[11px] text-red font-semibold bg-transparent border-none cursor-pointer">Forgot password?</button>
                </label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="field-input" autoComplete="current-password" />
              </div>

              {error && <div className="text-[12.5px] text-red font-semibold bg-red-light border border-red-mid rounded-lg px-3 py-2">{error}</div>}

              <button type="submit" disabled={loading}
                className="btn btn-primary justify-center py-3 text-[14px] w-full mt-1">
                {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</span> : 'Sign In'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-[11.5px] text-faint">or continue with</span></div>
            </div>

            <div className="flex flex-col gap-2.5">
              {[['🔑','Okta SSO'],['🔵','Microsoft Azure AD'],['⚫','Google Workspace']].map(([icon, label]) => (
                <button key={label} type="button"
                  onClick={() => alert(`${label} SSO — connect in Auth settings when ready.`)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 border border-border rounded-xl text-[13px] font-semibold text-navy hover:bg-bg transition-colors cursor-pointer bg-white">
                  <span className="text-[16px]">{icon}</span>{label}
                  <span className="ml-auto text-[10px] text-faint bg-bg border border-border px-2 py-px rounded-full">Coming soon</span>
                </button>
              ))}
            </div>

            <p className="text-center text-[12px] text-muted mt-5">
              Don't have an account?{' '}
              <button type="button" onClick={() => alert('Contact your administrator to set up an account.')}
                className="text-red font-semibold bg-transparent border-none cursor-pointer">Contact us</button>
            </p>
          </div>

          {/* Not a customer */}
          <div className="text-center mt-4">
            <Link to="/claims/auto/new" className="text-[12.5px] text-muted hover:text-navy transition-colors">
              Not a customer? File a third-party claim →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-[11px] text-faint border-t border-border">
        🔒 Secured with 256-bit encryption · SOC 2 Type II certified
      </div>
    </div>
  )
}
