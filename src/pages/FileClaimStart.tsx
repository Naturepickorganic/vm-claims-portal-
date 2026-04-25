import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import { useLogo } from '@/lib/logoConfig'
import { clsx } from 'clsx'

type LOB = 'auto' | 'home' | 'commercial-property' | 'commercial-auto' | 'workers-comp' | 'agri'
type CustomerType = 'customer' | 'third-party' | 'carrier'

const LOBS: { id:LOB; icon:string; label:string; desc:string; built:boolean }[] = [
  { id:'auto',                icon:'🚗', label:'Personal Auto',         desc:'Collision, theft, weather, glass damage',     built:true  },
  { id:'home',                icon:'🏠', label:'Personal Home',         desc:'Wind/hail, fire, water, theft, liability',    built:true  },
  { id:'commercial-property', icon:'🏢', label:'Commercial Property',   desc:'Business premises, equipment, inventory',     built:false },
  { id:'commercial-auto',     icon:'🚚', label:'Commercial Auto',       desc:'Fleet vehicles, cargo, business liability',   built:false },
  { id:'workers-comp',        icon:'👷', label:"Workers' Compensation", desc:'Employee injury, medical, return-to-work',    built:false },
  { id:'agri',                icon:'🌾', label:'Commercial Agriculture', desc:'Crop, livestock, farm equipment, structures', built:false },
]

const AUTO_OPTIONS: { id:CustomerType; icon:string; label:string; desc:string; requiresAuth:boolean }[] = [
  { id:'customer',     icon:'✅', label:'I am an existing customer',           desc:'Filing a claim on my own policy with this carrier',            requiresAuth:true  },
  { id:'third-party',  icon:'🚙', label:'I am a third-party claimant',         desc:'I was involved in an incident with one of your policyholders', requiresAuth:false },
  { id:'carrier',      icon:'🏛️', label:'I represent another insurance carrier', desc:'Subrogation demand, inter-company arbitration, or joint claim', requiresAuth:false },
]

export default function FileClaimStart() {
  const navigate            = useNavigate()
  const { isAuthenticated } = useAuth()
  const { logo }            = useLogo()
  const [selectedLOB, setSelectedLOB]   = useState<LOB | null>(null)
  const [step, setStep]                 = useState<'lob'|'type'>('lob')

  const handleLOBSelect = (lob: LOB) => {
    if (!LOBS.find(l => l.id === lob)?.built) return
    setSelectedLOB(lob)
    if (lob === 'auto') {
      setStep('type')
    } else if (lob === 'home') {
      if (isAuthenticated) navigate('/claims/home/new')
      else navigate('/login?redirect=/claims/home/new&lob=Personal Home')
    }
  }

  const handleTypeSelect = (type: CustomerType) => {
    if (type === 'customer') {
      if (isAuthenticated) navigate('/claims/auto/new')
      else navigate('/login?redirect=/claims/auto/new&lob=Personal Auto')
    } else if (type === 'third-party') {
      navigate('/claims/third-party/new')
    } else if (type === 'carrier') {
      alert('Carrier-to-carrier claims portal is coming in the next sprint. Please call 1-800-VM-CLAIMS for urgent subrogation matters.')
    }
  }

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
          <Link to="/" className="hover:text-navy transition-colors">Home</Link>
          <span>/</span>
          <button onClick={() => { if(step==='type'){setStep('lob');setSelectedLOB(null)} }}
            className={clsx('bg-transparent border-none cursor-pointer text-[12px]', step==='lob'?'text-navy font-semibold':'text-muted hover:text-navy')}>
            Select Coverage
          </button>
          {step === 'type' && <><span>/</span><span className="text-navy font-semibold">Who Are You?</span></>}
        </div>

        {/* STEP 1 — LOB */}
        {step === 'lob' && (
          <>
            <div className="mb-8">
              <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 1 of 2</div>
              <h1 className="font-display font-black text-[26px] md:text-[32px] text-navy mb-2">File a Claim</h1>
              <p className="text-[14px] text-muted">Select the type of coverage you are filing under.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {LOBS.map(lob => (
                <div key={lob.id}
                  onClick={() => handleLOBSelect(lob.id)}
                  className={clsx('border border-border rounded-2xl p-6 bg-white transition-all relative',
                    lob.built ? 'cursor-pointer hover:border-red hover:bg-red-light hover:-translate-y-0.5 hover:shadow-card' : 'opacity-50 cursor-not-allowed'
                  )}>
                  {!lob.built && <span className="absolute top-3 right-3 text-[10px] bg-bg border border-border text-faint px-2 py-px rounded-full font-bold">Coming Soon</span>}
                  <div className="text-[30px] mb-3">{lob.icon}</div>
                  <div className="text-[15px] font-bold text-navy mb-1">{lob.label}</div>
                  <div className="text-[12.5px] text-muted leading-relaxed">{lob.desc}</div>
                  {lob.built && <div className="text-[18px] text-red mt-3">→</div>}
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-light border border-blue-mid rounded-xl text-[13px] text-[#1E3A8A]">
              <strong>Personal Home</strong> goes directly to the claim form. <strong>Personal Auto</strong> will ask who you are first. Commercial lines will be available soon.
            </div>
          </>
        )}

        {/* STEP 2 — Auto customer type */}
        {step === 'type' && selectedLOB === 'auto' && (
          <>
            <div className="mb-8">
              <button onClick={() => { setStep('lob'); setSelectedLOB(null) }}
                className="text-[13px] text-muted hover:text-navy mb-4 flex items-center gap-1.5 bg-transparent border-none cursor-pointer">
                Back to coverage selection
              </button>
              <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 2 of 2 — Personal Auto</div>
              <h1 className="font-display font-black text-[26px] md:text-[32px] text-navy mb-2">Who Are You?</h1>
              <p className="text-[14px] text-muted">Select the option that best describes your situation.</p>
            </div>

            <div className="flex flex-col gap-3">
              {AUTO_OPTIONS.map(opt => (
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
                        <span className="text-[10px] bg-green-light text-green border border-green-mid px-2 py-px rounded-full font-bold">Logged in</span>
                      )}
                    </div>
                    <div className="text-[12.5px] text-muted mt-0.5">{opt.desc}</div>
                  </div>
                  <div className="text-[20px] text-red flex-shrink-0">→</div>
                </div>
              ))}
            </div>

            {!isAuthenticated && (
              <div className="mt-6 p-4 bg-blue-light border border-blue-mid rounded-xl text-[13px] text-[#1E3A8A]">
                <strong>New customer?</strong> You can{' '}
                <Link to="/signup" className="text-blue font-semibold underline">create an account</Link>{' '}
                using your policy number. Existing customers will be prompted to log in.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
