import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import { useLogo } from '@/lib/logoConfig'
import { clsx } from 'clsx'

type LOB = 'auto' | 'home' | 'commercial-property' | 'workers-comp' | 'commercial-auto'
type CustomerType = 'customer' | 'third-party' | 'roadside' | 'glass'

const LOBS = [
  { id:'auto'               as LOB, icon:'🚗', label:'Personal Auto',        desc:'Vehicle accidents, theft, weather, glass damage' },
  { id:'home'               as LOB, icon:'🏠', label:'Personal Property',     desc:'Home, renters, condo — wind, fire, water, theft' },
  { id:'commercial-property'as LOB, icon:'🏢', label:'Commercial Property',   desc:'Business premises, equipment, inventory' },
  { id:'commercial-auto'    as LOB, icon:'🚚', label:'Commercial Auto',       desc:'Fleet vehicles, cargo, business liability' },
  { id:'workers-comp'       as LOB, icon:'👷', label:"Workers' Compensation", desc:'Employee injury, medical, return-to-work' },
]

const AUTO_OPTIONS: { id: CustomerType; icon: string; label: string; desc: string; requiresAuth: boolean }[] = [
  { id:'customer',    icon:'✅', label:'I am a customer',              desc:'Filing a claim on my own policy',         requiresAuth: true  },
  { id:'third-party', icon:'🚙', label:'I am not a customer (3rd party)', desc:'The other driver or person involved',  requiresAuth: false },
  { id:'roadside',    icon:'🛣️', label:'Roadside Assistance',          desc:'Towing, lockout, flat tire, fuel delivery',requiresAuth: false },
  { id:'glass',       icon:'🪟', label:'Glass / Windshield Only',      desc:'Chip repair or full windshield replacement',requiresAuth: false },
]

export default function FileClaimStart() {
  const navigate              = useNavigate()
  const { isAuthenticated }   = useAuth()
  const { logo }              = useLogo()
  const [selectedLOB, setSelectedLOB] = useState<LOB | null>(null)
  const [step, setStep]               = useState<'lob' | 'type'>('lob')

  const handleLOBSelect = (lob: LOB) => {
    setSelectedLOB(lob)
    if (lob === 'auto') {
      setStep('type')
    } else {
      // Home & Commercial — customers only
      if (isAuthenticated) {
        navigate(`/claims/${lob}/new`)
      } else {
        navigate(`/login?redirect=/claims/${lob}/new&lob=${lob}`)
      }
    }
  }

  const handleTypeSelect = (type: CustomerType) => {
    if (type === 'customer') {
      if (isAuthenticated) {
        navigate('/claims/auto/new')
      } else {
        navigate('/login?redirect=/claims/auto/new&lob=auto')
      }
    } else if (type === 'third-party') {
      navigate('/claims/third-party/new')
    } else if (type === 'roadside') {
      navigate('/roadside')
    } else if (type === 'glass') {
      navigate('/claims/glass/new')
    }
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
            ? <button onClick={() => navigate('/')} className="text-[13px] text-white/50 hover:text-white transition-colors bg-transparent border-none cursor-pointer">← Back</button>
            : <Link to="/login" className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Log In</Link>
          }
        </div>
      </nav>

      <div className="flex-1 px-5 md:px-[60px] py-10 max-w-[760px] mx-auto w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-muted mb-6">
          <Link to="/" className="hover:text-navy transition-colors">Home</Link>
          <span>/</span>
          <span className={step === 'lob' ? 'text-navy font-semibold' : 'hover:text-navy cursor-pointer'} onClick={() => { if (step === 'type') { setStep('lob'); setSelectedLOB(null) } }}>Select Coverage</span>
          {step === 'type' && <><span>/</span><span className="text-navy font-semibold">Who Are You?</span></>}
        </div>

        {/* STEP 1 — Select LOB */}
        {step === 'lob' && (
          <>
            <div className="mb-8">
              <h1 className="font-display font-black text-[26px] md:text-[32px] text-navy mb-2">File a Claim</h1>
              <p className="text-[14px] text-muted">Select the type of coverage you are filing for.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LOBS.map(lob => (
                <div key={lob.id} onClick={() => handleLOBSelect(lob.id)}
                  className={clsx('border border-border rounded-2xl p-6 bg-white cursor-pointer transition-all hover:border-red hover:bg-red-light hover:-translate-y-0.5 hover:shadow-card')}>
                  <div className="text-[30px] mb-3">{lob.icon}</div>
                  <div className="text-[15px] font-bold text-navy mb-1">{lob.label}</div>
                  <div className="text-[12.5px] text-muted leading-relaxed">{lob.desc}</div>
                  <div className="text-[18px] text-red mt-3">→</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 2 — Auto: Who Are You */}
        {step === 'type' && selectedLOB === 'auto' && (
          <>
            <div className="mb-8">
              <button onClick={() => { setStep('lob'); setSelectedLOB(null) }}
                className="text-[13px] text-muted hover:text-navy mb-4 flex items-center gap-1.5 bg-transparent border-none cursor-pointer">
                ← Back to coverage selection
              </button>
              <h1 className="font-display font-black text-[26px] md:text-[32px] text-navy mb-2">Auto Claim — Who Are You?</h1>
              <p className="text-[14px] text-muted">Select the option that best describes your situation.</p>
            </div>
            <div className="flex flex-col gap-3">
              {AUTO_OPTIONS.map(opt => (
                <div key={opt.id} onClick={() => handleTypeSelect(opt.id)}
                  className="flex items-center gap-5 p-5 border border-border rounded-2xl bg-white cursor-pointer hover:border-red hover:bg-red-light transition-all">
                  <div className="text-[32px] flex-shrink-0">{opt.icon}</div>
                  <div className="flex-1">
                    <div className="text-[15px] font-bold text-navy flex items-center gap-2">
                      {opt.label}
                      {opt.requiresAuth && !isAuthenticated && (
                        <span className="text-[10px] bg-navy text-white px-2 py-px rounded-full font-bold">Login required</span>
                      )}
                      {isAuthenticated && opt.requiresAuth && (
                        <span className="text-[10px] bg-green-light text-green border border-green-mid px-2 py-px rounded-full font-bold">✓ Logged in</span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-muted mt-0.5">{opt.desc}</div>
                  </div>
                  <div className="text-[20px] text-red flex-shrink-0">→</div>
                </div>
              ))}
            </div>

            {/* Info for non-logged-in users */}
            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-blue-light border border-blue-mid rounded-xl text-[13px] text-[#1E3A8A]">
                <strong>Customers:</strong> You will be asked to log in before filing. If you don't have an account yet,{' '}
                <Link to="/signup" className="text-blue font-semibold underline">create one here</Link> using your policy number.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
