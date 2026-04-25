import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import { useLogo } from '@/lib/logoConfig'
import { clsx } from 'clsx'

type LOB = 'auto' | 'home' | 'glass' | 'commercial-auto' | 'commercial-property' | 'workers-comp' | 'agri'
type CustomerType = 'customer' | 'third-party' | 'carrier'

const LOBS = [
  { id:'auto'               as LOB, icon:'🚗', label:'Personal Auto',         desc:'Collision, theft, weather, and glass damage',          built:true,  note:''            },
  { id:'home'               as LOB, icon:'🏠', label:'Personal Home',         desc:'Wind/hail, fire, water, theft, and liability',         built:true,  note:''            },
  { id:'glass'              as LOB, icon:'🪟', label:'Glass / Windshield Only',desc:'Chip repair or full replacement — same-day available', built:true,  note:'Fast track'  },
  { id:'commercial-auto'    as LOB, icon:'🚚', label:'Commercial Auto',       desc:'Fleet vehicles, cargo, driver incidents, DOT',         built:true,  note:''            },
  { id:'commercial-property'as LOB, icon:'🏢', label:'Commercial Property',   desc:'Business premises, equipment, inventory',              built:false, note:''            },
  { id:'workers-comp'       as LOB, icon:'👷', label:"Workers' Compensation", desc:'Employee injury, medical, return-to-work',             built:false, note:''            },
  { id:'agri'               as LOB, icon:'🌾', label:'Commercial Agriculture', desc:'Crop, livestock, farm equipment, structures',          built:false, note:''            },
]

const CUSTOMER_OPTIONS = [
  { id:'customer'    as CustomerType, icon:'✅', label:'I am an existing customer',             desc:'Filing a claim on my own policy with this carrier',           requiresAuth:true  },
  { id:'third-party' as CustomerType, icon:'🚙', label:'I am a third-party claimant',           desc:'I was involved in an incident with one of your policyholders', requiresAuth:false },
  { id:'carrier'     as CustomerType, icon:'🏛', label:'I represent another insurance carrier', desc:'Subrogation demand, arbitration, or joint claim',              requiresAuth:false },
]

const LOBS_WITH_TYPE: LOB[] = ['auto', 'commercial-auto']

export default function FileClaimStart() {
  const navigate            = useNavigate()
  const { isAuthenticated } = useAuth()
  const { logo }            = useLogo()
  const [selectedLOB, setSelectedLOB] = useState<LOB | null>(null)
  const [step, setStep]               = useState<'lob'|'type'>('lob')

  const handleLOBSelect = (lob: LOB) => {
    const lobData = LOBS.find(l => l.id === lob)
    if (!lobData?.built) return
    setSelectedLOB(lob)

    if (lob === 'glass') {
      navigate('/claims/glass/new')
    } else if (LOBS_WITH_TYPE.includes(lob)) {
      setStep('type')
    } else if (lob === 'home') {
      if (isAuthenticated) navigate('/claims/home/new')
      else navigate('/login?redirect=/claims/home/new&lob=Personal+Home')
    }
  }

  const handleTypeSelect = (type: CustomerType) => {
    if (type === 'customer') {
      const dest  = selectedLOB === 'commercial-auto' ? '/claims/commercial-auto/new' : '/claims/auto/new'
      const label = selectedLOB === 'commercial-auto' ? 'Commercial+Auto' : 'Personal+Auto'
      if (isAuthenticated) navigate(dest)
      else navigate(`/login?redirect=${dest}&lob=${label}`)
    } else if (type === 'third-party') {
      navigate('/claims/third-party/new')
    } else {
      alert('Carrier-to-carrier portal coming soon. For urgent subrogation, call 1-800-VM-CLAIMS (press 2).')
    }
  }

  const selectedLabel = LOBS.find(l => l.id === selectedLOB)?.label ?? 'Auto'

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </Link>
        {isAuthenticated
          ? <button onClick={() => navigate(-1)} className="text-[13px] text-white/50 hover:text-white transition-colors bg-transparent border-none cursor-pointer">Back</button>
          : <Link to="/login" className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Log In</Link>
        }
      </nav>

      <div className="flex-1 px-5 md:px-[60px] py-10 max-w-[860px] mx-auto w-full">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-muted mb-6">
          <Link to="/" className="hover:text-navy">Home</Link>
          <span>/</span>
          <button onClick={() => { if(step==='type'){setStep('lob');setSelectedLOB(null)} }}
            className={clsx('bg-transparent border-none cursor-pointer text-[12px]', step==='lob'?'text-navy font-semibold':'text-muted hover:text-navy')}>
            Select coverage
          </button>
          {step === 'type' && <><span>/</span><span className="text-navy font-semibold">Who are you?</span></>}
        </div>

        {/* STEP 1 — LOB selector */}
        {step === 'lob' && (
          <>
            <div className="mb-8">
              <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 1 of 2</div>
              <h1 className="font-display font-black text-[26px] md:text-[32px] text-navy mb-2">File a Claim</h1>
              <p className="text-[14px] text-muted">Select the type of coverage you are filing under.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {LOBS.map(lob => (
                <div key={lob.id} onClick={() => handleLOBSelect(lob.id)}
                  className={clsx('border border-border rounded-2xl p-6 bg-white transition-all relative',
                    lob.built ? 'cursor-pointer hover:border-red hover:bg-red-light hover:-translate-y-0.5 hover:shadow-card' : 'opacity-50 cursor-not-allowed')}>
                  {!lob.built && (
                    <span className="absolute top-3 right-3 text-[10px] bg-bg border border-border text-faint px-2 py-px rounded-full font-bold">Coming soon</span>
                  )}
                  {lob.note && (
                    <span className="absolute top-3 right-3 text-[10px] bg-green-light text-green border border-green-mid px-2 py-px rounded-full font-bold">{lob.note}</span>
                  )}
                  <div className="text-[30px] mb-3">{lob.icon}</div>
                  <div className="text-[15px] font-bold text-navy mb-1">{lob.label}</div>
                  <div className="text-[12.5px] text-muted leading-relaxed">{lob.desc}</div>
                  {lob.built && <div className="text-[18px] text-red mt-3">→</div>}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-light border border-blue-mid rounded-xl text-[13px] text-[#1E3A8A]">
              Glass / Windshield claims go to a fast 3-step flow — no login required.
              Personal Home goes directly to the FNOL form after login.
              Auto and Commercial Auto will ask who you are first.
            </div>
          </>
        )}

        {/* STEP 2 — Customer type (Auto + Commercial Auto) */}
        {step === 'type' && selectedLOB && (
          <>
            <div className="mb-8">
              <button onClick={() => {setStep('lob');setSelectedLOB(null)}}
                className="text-[13px] text-muted hover:text-navy mb-4 flex items-center gap-1.5 bg-transparent border-none cursor-pointer">
                ← Back to coverage selection
              </button>
              <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 2 of 2 — {selectedLabel}</div>
              <h1 className="font-display font-black text-[26px] md:text-[32px] text-navy mb-2">Who are you?</h1>
              <p className="text-[14px] text-muted">Select the option that best describes your situation.</p>
            </div>

            <div className="flex flex-col gap-3">
              {CUSTOMER_OPTIONS.map(opt => (
                <div key={opt.id} onClick={() => handleTypeSelect(opt.id)}
                  className="flex items-center gap-5 p-5 border border-border rounded-2xl bg-white cursor-pointer hover:border-red hover:bg-red-light transition-all">
                  <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-[26px] flex-shrink-0">{opt.icon}</div>
                  <div className="flex-1">
                    <div className="text-[15px] font-bold text-navy flex items-center gap-2 flex-wrap">
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

            {selectedLOB === 'commercial-auto' && (
              <div className="mt-5 p-4 bg-amber-light border border-[#FDE68A] rounded-xl text-[13px] text-[#92400E]">
                Have your USDOT number, fleet unit number, driver CDL, and Bill of Lading ready before starting.
              </div>
            )}
            {!isAuthenticated && (
              <div className="mt-4 p-4 bg-blue-light border border-blue-mid rounded-xl text-[13px] text-[#1E3A8A]">
                New customer? <Link to="/signup" className="text-blue font-semibold underline">Create an account</Link> using your policy number.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
