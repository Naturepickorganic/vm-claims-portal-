import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogo } from '@/lib/logoConfig'

const RECENT_CLAIMS = [
  { id:'CLM-2025-AUTO-04821', type:'🚗 Personal Auto',    status:'In Progress', date:'Apr 22, 2025', color:'text-blue' },
  { id:'CLM-2025-HOME-08834', type:'🏠 Personal Property', status:'Inspection Scheduled', date:'Apr 20, 2025', color:'text-amber' },
]

export default function TrackClaim() {
  const navigate  = useNavigate()
  const { logo }  = useLogo()
  const [claimId, setClaimId] = useState('')
  const [error,   setError]   = useState('')
  const [zip,     setZip]     = useState('')

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimId.trim()) { setError('Please enter a claim number.'); return }
    const lob = claimId.toUpperCase().includes('HOME') ? 'home' : 'auto'
    navigate(`/claims/${lob}/${claimId.trim()}/status`)
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
        <Link to="/login" className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
          Log In
        </Link>
      </nav>

      {/* HERO */}
      <div className="bg-gradient-to-br from-navy to-navy-light px-5 md:px-[60px] py-12 text-center">
        <h1 className="font-display font-black text-[28px] md:text-[36px] text-white mb-3">Track Your Claim</h1>
        <p className="text-[14px] text-white/60 max-w-[420px] mx-auto">Enter your claim number or log in to see all your claims in one place.</p>
      </div>

      <div className="flex-1 px-5 md:px-[60px] py-10 max-w-[860px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Track by claim number */}
          <div className="card">
            <div className="card-title mb-1">🔍 Track by Claim Number</div>
            <p className="text-[12.5px] text-muted mb-4">No login required — enter your claim number and ZIP code.</p>
            <form onSubmit={handleTrack} className="flex flex-col gap-3">
              <div className="field">
                <label className="field-label">Claim Number <span className="text-red">*</span></label>
                <input value={claimId} onChange={e => { setClaimId(e.target.value); setError('') }}
                  placeholder="e.g. CLM-2025-AUTO-04821"
                  className="field-input" />
              </div>
              <div className="field">
                <label className="field-label">ZIP Code (for verification)</label>
                <input value={zip} onChange={e => setZip(e.target.value)}
                  placeholder="75209" maxLength={5} className="field-input" />
              </div>
              {error && <p className="err-msg">{error}</p>}
              <button type="submit" className="btn btn-primary justify-center py-3">Track My Claim →</button>
            </form>
            <p className="text-[11.5px] text-faint mt-3">
              💡 Demo: try <button onClick={() => setClaimId('CLM-2025-AUTO-04821')}
                className="text-red underline bg-transparent border-none cursor-pointer font-body text-[11.5px]">CLM-2025-AUTO-04821</button>
            </p>
          </div>

          {/* Log in to see all claims */}
          <div className="card border-2 border-navy/10 bg-gradient-to-br from-[#F8FAFF] to-white">
            <div className="card-title mb-1">🔐 Log In for Full Access</div>
            <p className="text-[12.5px] text-muted mb-4">See all your claims, documents, adjuster messages, and payment status in one dashboard.</p>
            <ul className="flex flex-col gap-2 mb-5">
              {['View all active & closed claims','Message your adjuster directly','Upload documents & photos','Track repair & rental status','View payment & settlement details'].map(b => (
                <li key={b} className="flex items-center gap-2 text-[12.5px] text-slate">
                  <span className="text-green font-bold">✓</span>{b}
                </li>
              ))}
            </ul>
            <Link to="/login" className="btn btn-navy justify-center py-3 w-full text-center">Log In to My Account →</Link>
            <p className="text-[11.5px] text-faint text-center mt-3">SSO with Okta, Azure AD, Google available</p>
          </div>
        </div>

        {/* Recent claims (demo) */}
        <div className="card mt-6">
          <div className="card-title mb-4">📋 Demo — Recent Claims</div>
          <p className="text-[12px] text-muted mb-4">After logging in, your claims appear here automatically.</p>
          <div className="flex flex-col gap-3">
            {RECENT_CLAIMS.map(c => (
              <div key={c.id} onClick={() => navigate(`/claims/${c.type.includes('Auto') ? 'auto' : 'home'}/${c.id}/status`)}
                className="flex items-center justify-between p-4 border border-border rounded-xl cursor-pointer hover:border-red hover:bg-red-light transition-all">
                <div>
                  <div className="text-[13.5px] font-bold text-navy">{c.id}</div>
                  <div className="text-[12px] text-muted mt-px">{c.type} · Filed {c.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[12px] font-bold ${c.color}`}>{c.status}</span>
                  <span className="text-red text-[18px]">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="btn btn-ghost">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
