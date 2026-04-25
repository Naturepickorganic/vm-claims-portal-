import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import { useLogo } from '@/lib/logoConfig'
import { clsx } from 'clsx'

type Step = 'verify' | 'create' | 'done'

export default function Signup() {
  const navigate          = useNavigate()
  const { login }         = useAuth()
  const { logo }          = useLogo()
  const [step, setStep]   = useState<Step>('verify')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Step 1 — Verify identity
  const [policyNumber, setPolicyNumber] = useState('')
  const [dob,          setDob]          = useState('')
  const [zip,          setZip]          = useState('')

  // Step 2 — Create account
  const [firstName,  setFirstName]  = useState('')
  const [lastName,   setLastName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [password,   setPassword]   = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!policyNumber || !dob || !zip) { setError('All fields are required.'); return }
    setLoading(true)
    // TODO: Call /api/v1/policy/verify with { policyNumber, dob, zip }
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    // Mock: any policy number works in demo
    setStep('create')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!firstName || !lastName || !email || !password) { setError('All fields are required.'); return }
    if (password !== confirmPwd) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    // TODO: Call /api/v1/auth/register with user data
    await new Promise(r => setTimeout(r, 1400))
    await login(email, password)
    setLoading(false)
    setStep('done')
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* NAV */}
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </Link>
        <Link to="/login" className="text-[13px] text-white/50 hover:text-white transition-colors">Already have an account? Log in</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[480px]">

          {/* Progress */}
          {step !== 'done' && (
            <div className="flex items-center gap-2 mb-6">
              {['Verify Policy','Create Account','Done'].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0',
                    (step === 'verify' && i === 0) || (step === 'create' && i <= 1) ? 'bg-red text-white' : 'bg-border text-faint')}>
                    {i + 1}
                  </div>
                  <span className={clsx('text-[11.5px] hidden sm:block', step === 'verify' && i === 0 || step === 'create' && i === 1 ? 'text-navy font-semibold' : 'text-faint')}>{s}</span>
                  {i < 2 && <div className="flex-1 h-px bg-border" />}
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-card p-8">

            {/* Step 1 — Verify Policy */}
            {step === 'verify' && (
              <>
                <h1 className="font-display font-black text-[22px] text-navy mb-1">Create Your Account</h1>
                <p className="text-[13px] text-muted mb-6">First, let us verify your policy. This keeps your account secure.</p>
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <div className="field">
                    <label className="field-label">Policy Number <span className="text-red">*</span></label>
                    <input value={policyNumber} onChange={e => setPolicyNumber(e.target.value)}
                      placeholder="e.g. VM-AUTO-2024-88421" className="field-input" />
                    <span className="field-hint">Found on your policy declaration page or insurance card</span>
                  </div>
                  <div className="field">
                    <label className="field-label">Date of Birth <span className="text-red">*</span></label>
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="field-input" />
                  </div>
                  <div className="field">
                    <label className="field-label">ZIP Code on Policy <span className="text-red">*</span></label>
                    <input value={zip} onChange={e => setZip(e.target.value)} placeholder="75209" maxLength={5} className="field-input" />
                  </div>
                  {error && <div className="text-[12.5px] text-red font-semibold bg-red-light border border-red-mid rounded-lg px-3 py-2">{error}</div>}
                  <button type="submit" disabled={loading} className="btn btn-primary justify-center py-3 text-[14px] w-full mt-1">
                    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</span> : 'Verify My Policy →'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2 — Create Account */}
            {step === 'create' && (
              <>
                <div className="flex items-center gap-2 mb-5 p-3 bg-green-light border border-green-mid rounded-xl">
                  <span className="text-green font-bold">✓</span>
                  <span className="text-[13px] text-green-dark font-semibold">Policy verified successfully</span>
                </div>
                <h1 className="font-display font-black text-[22px] text-navy mb-1">Create Your Account</h1>
                <p className="text-[13px] text-muted mb-6">Set up your login credentials.</p>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="field"><label className="field-label">First Name <span className="text-red">*</span></label><input value={firstName} onChange={e => setFirstName(e.target.value)} className="field-input" /></div>
                    <div className="field"><label className="field-label">Last Name <span className="text-red">*</span></label><input value={lastName} onChange={e => setLastName(e.target.value)} className="field-input" /></div>
                  </div>
                  <div className="field"><label className="field-label">Email Address <span className="text-red">*</span></label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="field-input" /></div>
                  <div className="field"><label className="field-label">Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(214) 555-0100" className="field-input" /></div>
                  <div className="field">
                    <label className="field-label">Password <span className="text-red">*</span></label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="field-input" />
                    <span className="field-hint">Minimum 8 characters</span>
                  </div>
                  <div className="field"><label className="field-label">Confirm Password <span className="text-red">*</span></label><input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="field-input" /></div>
                  {error && <div className="text-[12.5px] text-red font-semibold bg-red-light border border-red-mid rounded-lg px-3 py-2">{error}</div>}
                  <button type="submit" disabled={loading} className="btn btn-primary justify-center py-3 text-[14px] w-full mt-1">
                    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</span> : 'Create Account →'}
                  </button>
                </form>
              </>
            )}

            {/* Done */}
            {step === 'done' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center text-[28px] text-white mx-auto mb-4">✓</div>
                <h1 className="font-display font-black text-[22px] text-navy mb-2">You're all set!</h1>
                <p className="text-[13.5px] text-muted mb-6">Your account has been created. You are now logged in and ready to file or track claims.</p>
                <div className="flex flex-col gap-2.5">
                  <button onClick={() => navigate('/file-claim')} className="btn btn-primary justify-center py-3 w-full">File a Claim →</button>
                  <button onClick={() => navigate('/track')} className="btn btn-ghost justify-center py-2.5 w-full">Track a Claim</button>
                </div>
              </div>
            )}
          </div>

          {step !== 'done' && (
            <p className="text-center text-[12px] text-muted mt-4">
              Already have an account? <Link to="/login" className="text-red font-semibold">Log in</Link>
            </p>
          )}
        </div>
      </div>
      <div className="text-center py-4 text-[11px] text-faint border-t border-border">
        🔒 Secured with 256-bit encryption · SOC 2 Type II certified
      </div>
    </div>
  )
}
