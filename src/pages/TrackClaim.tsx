import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import { useLogo } from '@/lib/logoConfig'

export default function TrackClaim() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { logo } = useLogo()
  const [claimId, setClaimId] = useState('')
  const [zip,     setZip]     = useState('')
  const [error,   setError]   = useState('')

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimId.trim()) { setError('Please enter your claim number.'); return }
    if (!zip.trim()) { setError('Please enter your ZIP code for verification.'); return }
    const lob = claimId.toUpperCase().includes('HOME') ? 'home' : 'auto'
    navigate(`/claims/${lob}/${claimId.trim()}/status`)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* NAV */}
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </Link>
        <div className="flex items-center gap-3">
          {isAuthenticated
            ? <><span className="text-[12px] text-white/50 hidden sm:block">{user?.name}</span>
                <button onClick={() => { logout(); navigate('/') }} className="text-[13px] text-white/50 hover:text-white transition-colors bg-transparent border-none cursor-pointer">Log Out</button></>
            : <Link to="/login?redirect=/track" className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Log In</Link>
          }
        </div>
      </nav>

      {/* HERO */}
      <div className="bg-gradient-to-br from-navy to-navy-light px-5 md:px-[60px] py-10 text-center">
        <h1 className="font-display font-black text-[26px] md:text-[34px] text-white mb-2">Track Your Claim</h1>
        <p className="text-[13.5px] text-white/60 max-w-[440px] mx-auto">
          {isAuthenticated
            ? `Welcome back, ${user?.name?.split(' ')[0]}. View your claims below or enter a claim number.`
            : 'Enter your claim number and ZIP code, or log in for full claim access.'}
        </p>
      </div>

      <div className="flex-1 px-5 md:px-[60px] py-10 max-w-[860px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Track by claim number — available to anyone with claim # + ZIP */}
          <div className="card">
            <div className="card-title mb-1">🔍 Track by Claim Number</div>
            <p className="text-[12.5px] text-muted mb-4">Enter your claim number and the ZIP code on your policy.</p>
            <form onSubmit={handleTrack} className="flex flex-col gap-3">
              <div className="field">
                <label className="field-label">Claim Number <span className="text-red">*</span></label>
                <input value={claimId} onChange={e => { setClaimId(e.target.value); setError('') }}
                  placeholder="e.g. CLM-2025-AUTO-04821" className="field-input" />
              </div>
              <div className="field">
                <label className="field-label">ZIP Code <span className="text-red">*</span></label>
                <input value={zip} onChange={e => { setZip(e.target.value); setError('') }}
                  placeholder="75209" maxLength={5} className="field-input" />
              </div>
              {error && <p className="err-msg">{error}</p>}
              <button type="submit" className="btn btn-primary justify-center py-3">Track My Claim →</button>
            </form>
          </div>

          {/* Log In for full access */}
          {!isAuthenticated ? (
            <div className="card border-2 border-navy/10 bg-gradient-to-br from-[#F8FAFF] to-white">
              <div className="card-title mb-1">🔐 Log In for Full Access</div>
              <p className="text-[12.5px] text-muted mb-4">See all your claims, messages, documents, and payment status in one place.</p>
              <ul className="flex flex-col gap-2 mb-5">
                {['View all active and closed claims','Message your adjuster directly','Upload documents and photos','Track repair and rental status','View payment and settlement details'].map(b => (
                  <li key={b} className="flex items-center gap-2 text-[12.5px] text-slate"><span className="text-green font-bold">✓</span>{b}</li>
                ))}
              </ul>
              <Link to="/login?redirect=/track" className="btn btn-navy justify-center py-3 w-full text-center">Log In to My Account →</Link>
              <p className="text-[11.5px] text-faint text-center mt-3">
                New customer? <Link to="/signup" className="text-red font-semibold">Create an account</Link>
              </p>
            </div>
          ) : (
            /* Logged-in: show active claims */
            <div className="card">
              <div className="card-title mb-4">📋 Your Active Claims</div>
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
                <div className="text-[36px] mb-3">📭</div>
                <div className="text-[13.5px] font-semibold text-navy mb-1">No active claims found</div>
                <div className="text-[12.5px]">Claims you file will appear here automatically.</div>
                <button onClick={() => navigate('/file-claim')} className="btn btn-primary mt-5 text-[13px]">File a New Claim →</button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="btn btn-ghost">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
