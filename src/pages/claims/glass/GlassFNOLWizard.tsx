import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { useLogo } from '@/lib/logoConfig'
import { useAuth } from '@/lib/authContext'
import { isMock, mockSubmitFNOL } from '@/lib/mockApi'
import {
  detectStateFromLocation,
  getStateRules,
  getGlassDeductibleMessage,
} from '@/lib/stateRules'
import StateRulesPanel from '@/components/ui/StateRulesPanel'
import InfoBox from '@/components/ui/InfoBox'

type GlassLocation =
  | 'Windshield (front)'
  | 'Rear window'
  | 'Driver window'
  | 'Passenger window'
  | 'Rear left window'
  | 'Rear right window'
  | 'Sunroof / moonroof'
  | 'Mirror glass'

type DamageType = 'chip' | 'crack' | 'shattered'
type Cause = 'rock' | 'hail' | 'vandalism' | 'accident' | 'unknown'
type ServiceType = 'mobile' | 'dropoff' | 'own-shop'

const GLASS_LOCATIONS: GlassLocation[] = [
  'Windshield (front)', 'Rear window', 'Driver window', 'Passenger window',
  'Rear left window', 'Rear right window', 'Sunroof / moonroof', 'Mirror glass',
]
const DAMAGE_OPTIONS = [
  { id:'chip'     as DamageType, label:'Chip or crack (repairable)',      sub:'Smaller than a quarter — 30 min fix, often no deductible' },
  { id:'crack'    as DamageType, label:'Large crack (replacement needed)', sub:'Longer than 6 inches or obstructs driver view'            },
  { id:'shattered'as DamageType, label:'Shattered / broken out',          sub:'Glass missing or completely broken'                       },
]
const CAUSES = [
  { id:'rock'     as Cause, label:'Rock / road debris' },
  { id:'hail'     as Cause, label:'Hail'               },
  { id:'vandalism'as Cause, label:'Vandalism'          },
  { id:'accident' as Cause, label:'Accident / collision'},
  { id:'unknown'  as Cause, label:'Unknown'            },
]
const SHOPS = [
  { name:'Safelite AutoGlass',           mobile:true,  meta:'Same-day mobile available · OEM glass option · Direct billing',    tag:'Partner'  },
  { name:'Belron / Caliber Glass',       mobile:false, meta:'Drop-off · 30 min chip repair · Nationwide locations',             tag:'Partner'  },
  { name:'Apple Auto Glass',             mobile:true,  meta:'Mobile + drop-off · OEM and aftermarket · Lifetime warranty',      tag:'Certified'},
  { name:'Use my own glass shop',        mobile:false, meta:'You have the right to choose any licensed repair facility',         tag:'Own'      },
]

const STEPS = ['Damage details', 'Repair service', 'Review & confirm']

export default function GlassFNOLWizard() {
  const navigate            = useNavigate()
  const { logo }            = useLogo()
  const { user }            = useAuth()
  const [step, setStep]     = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const [claimId, setClaimId]       = useState('')

  const [glassLocation, setGlassLocation] = useState<GlassLocation>('Windshield (front)')
  const [damageType, setDamageType]       = useState<DamageType>('chip')
  const [cause, setCause]                 = useState<Cause>('rock')
  const [dateOfLoss, setDateOfLoss]       = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation]           = useState('')
  const [shopIdx, setShopIdx]             = useState(0)
  const [serviceType, setServiceType]     = useState<ServiceType>('mobile')
  const [scheduleDate, setScheduleDate]   = useState('')
  const [scheduleTime, setScheduleTime]   = useState('Afternoon (12pm–6pm)')
  const [serviceAddress, setServiceAddress] = useState(user ? '4821 Mockingbird Ln, Dallas TX 75209' : '')
  const [ownShopName, setOwnShopName]     = useState('')
  const [certified, setCertified]         = useState(false)

  const stateCode   = detectStateFromLocation(location)
  const stateRule   = stateCode ? getStateRules(stateCode) : null
  const repairType  = damageType === 'chip' ? 'chip' : 'replacement'
  const glassInfo   = stateRule ? getGlassDeductibleMessage(stateRule, repairType) : null
  const selectedShop = SHOPS[shopIdx]

  const handleSubmit = async () => {
    if (!certified) return
    setSubmitting(true)
    const res = isMock()
      ? await mockSubmitFNOL('glass')
      : await mockSubmitFNOL('glass')
    setClaimId(res.claimId)
    setSubmitting(false)
    setSubmitted(true)
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100)

  if (submitted) return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-card p-10 max-w-[480px] w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center text-[30px] text-white mx-auto mb-5">✓</div>
          <h1 className="font-display font-black text-[22px] text-navy mb-2">Glass Claim Submitted</h1>
          <p className="text-[13.5px] text-muted mb-5 leading-relaxed">
            {selectedShop.name === 'Use my own glass shop'
              ? `Your claim is filed. Take your vehicle to ${ownShopName || 'your chosen shop'} and they will bill us directly.`
              : `${selectedShop.name} has been dispatched. You will receive a text confirmation with your technician's name and ETA within 30 minutes.`}
          </p>
          <div className="bg-bg border border-border rounded-xl p-4 mb-3">
            <div className="text-[11px] text-muted uppercase tracking-widest font-bold mb-1">Claim Number</div>
            <div className="font-display font-black text-[22px] text-navy">{claimId}</div>
          </div>
          {glassInfo?.waived && (
            <div className="bg-green-light border border-green-mid rounded-xl p-3 mb-5 text-[12.5px] text-[#064E3B]">
              ✓ No out-of-pocket cost — deductible waived in {stateRule?.name}
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            <Link to={`/claims/auto/${claimId}/status`} className="btn btn-primary justify-center py-3">Track my claim →</Link>
            <Link to="/" className="btn btn-ghost justify-center">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </Link>
        <span className="text-[12px] text-white/50 hidden sm:block">Glass / Windshield Claim</span>
      </nav>

      {/* Progress */}
      <div className="bg-navy px-5 py-3 border-b border-white/8">
        <div className="flex justify-between text-[11px] text-white/40 mb-1.5 max-w-[640px] mx-auto">
          <span>{STEPS[step]}</span><span>Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden max-w-[640px] mx-auto">
          <div className="h-full bg-red rounded-full transition-all duration-500" style={{ width:`${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 max-w-[640px] mx-auto">
          {STEPS.map((s, i) => (
            <span key={s} className={clsx('text-[10px]', i === step ? 'text-white/80 font-semibold' : i < step ? 'text-green-400' : 'text-white/25')}>
              {i < step ? '✓ ' : ''}{s}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 py-8 max-w-[640px] mx-auto w-full">

        {/* ── STEP 1: Damage details ───────────────────────────── */}
        {step === 0 && (
          <>
            <div className="mb-6">
              <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 1 of 3</div>
              <h1 className="font-display font-black text-[24px] text-navy mb-1">What glass was damaged?</h1>
              <p className="text-[13.5px] text-muted">Glass-only claims are fast — most resolved the same day.</p>
            </div>

            <InfoBox type="blue" icon="ℹ️">
              Chips smaller than a quarter and cracks under 6 inches are typically repairable in 30 minutes.
              Deductibles are waived for chip repairs in many states — we will show you once you enter your location.
            </InfoBox>

            <div className="card">
              <div className="card-title mb-3">Your vehicle</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field"><label className="field-label">Year / Make / Model <span className="prefill-badge">✓ From policy</span></label><input defaultValue="2021 Honda Accord EX-L" className="field-input prefilled" readOnly /></div>
                <div className="field"><label className="field-label">License plate <span className="prefill-badge">✓ From policy</span></label><input defaultValue="KXP-4421 TX" className="field-input prefilled" readOnly /></div>
              </div>
            </div>

            <div className="card">
              <div className="card-title mb-3">Which glass was damaged? <span className="text-red">*</span></div>
              <div className="flex flex-wrap gap-2">
                {GLASS_LOCATIONS.map(gl => (
                  <button key={gl} type="button" onClick={() => setGlassLocation(gl)}
                    className={clsx('chip', glassLocation === gl && 'chip-on')}>{gl}</button>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title mb-3">How severe is the damage? <span className="text-red">*</span></div>
              <div className="flex flex-col gap-2.5">
                {DAMAGE_OPTIONS.map(opt => (
                  <div key={opt.id} onClick={() => setDamageType(opt.id)}
                    className={clsx('flex items-center gap-4 p-3.5 border rounded-xl cursor-pointer transition-all',
                      damageType === opt.id ? 'border-red bg-red-light' : 'border-border hover:bg-bg')}>
                    <div className={clsx('w-4 h-4 rounded-full border-2 flex-shrink-0',
                      damageType === opt.id ? 'bg-red border-red' : 'border-border')} />
                    <div>
                      <div className="text-[13px] font-semibold text-navy">{opt.label}</div>
                      <div className="text-[11.5px] text-muted mt-0.5">{opt.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title mb-3">What caused the damage?</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {CAUSES.map(c => (
                  <button key={c.id} type="button" onClick={() => setCause(c.id)}
                    className={clsx('chip', cause === c.id && 'chip-on')}>{c.label}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="field-label">Date of damage <span className="text-red">*</span></label>
                  <input type="date" value={dateOfLoss} onChange={e => setDateOfLoss(e.target.value)} className="field-input" />
                </div>
                <div className="field">
                  <label className="field-label">Where were you? <span className="text-red">*</span></label>
                  <input value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="City or highway — e.g. Dallas, TX"
                    className="field-input" />
                  <span className="field-hint">Include state so we can apply the correct rules</span>
                </div>
              </div>
            </div>

            {/* State rules panel — shown once location has a state */}
            {location.length > 4 && stateCode && (
              <StateRulesPanel location={location} repairType={repairType} />
            )}

            {/* Glass deductible message */}
            {glassInfo && (
              <InfoBox type={glassInfo.waived ? 'green' : 'neutral'} icon={glassInfo.waived ? '✓' : 'ℹ️'}>
                {glassInfo.message}
              </InfoBox>
            )}

            <div className="step-nav">
              <Link to="/file-claim" className="btn btn-ghost">Back</Link>
              <button type="button" className="btn btn-primary"
                onClick={() => { if (location.length > 2) setStep(1) }}>
                Choose repair service →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Shop & scheduling ────────────────────────── */}
        {step === 1 && (
          <>
            <div className="mb-6">
              <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 2 of 3</div>
              <h1 className="font-display font-black text-[24px] text-navy mb-1">Choose your repair service</h1>
              <p className="text-[13.5px] text-muted">Mobile technicians come to you — home, office, or anywhere.</p>
            </div>

            <div className="card">
              <div className="card-title mb-3">Service type</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id:'mobile'   as ServiceType, label:'Mobile — come to me' },
                  { id:'dropoff'  as ServiceType, label:'I will drop off at a shop' },
                  { id:'own-shop' as ServiceType, label:'Use my own shop' },
                ].map(s => (
                  <button key={s.id} type="button" onClick={() => setServiceType(s.id)}
                    className={clsx('chip', serviceType === s.id && 'chip-on')}>{s.label}</button>
                ))}
              </div>
            </div>

            {serviceType !== 'own-shop' ? (
              <div className="card">
                <div className="card-title mb-3">Glass repair partners near you</div>
                {SHOPS.slice(0, 3).map((s, i) => (
                  <div key={i} onClick={() => setShopIdx(i)}
                    className={clsx('flex items-center gap-4 p-4 border rounded-xl mb-2 cursor-pointer transition-all',
                      shopIdx === i ? 'border-red bg-red-light' : 'border-border hover:bg-bg')}>
                    <div className={clsx('w-4 h-4 rounded-full border-2 flex-shrink-0',
                      shopIdx === i ? 'bg-red border-red' : 'border-border')} />
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-navy flex items-center gap-2">
                        {s.name}
                        {serviceType === 'mobile' && !s.mobile && (
                          <span className="text-[10px] text-faint bg-bg border border-border px-2 py-px rounded-full">Drop-off only</span>
                        )}
                      </div>
                      <div className="text-[11.5px] text-muted mt-0.5">{s.meta}</div>
                    </div>
                    <span className={clsx('text-[10px] font-bold px-2 py-px rounded-full flex-shrink-0',
                      s.tag === 'Partner' ? 'bg-navy text-white' : 'bg-amber-light text-amber border border-[#FDE68A]')}>
                      {s.tag}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="card-title mb-3">Your shop details</div>
                <InfoBox type="green" icon="⚖️">
                  You have the right to use any licensed glass repair facility.
                  {stateRule && ` ${stateRule.antiSteering}`}
                </InfoBox>
                <div className="field">
                  <label className="field-label">Shop name and address</label>
                  <input value={ownShopName} onChange={e => setOwnShopName(e.target.value)}
                    placeholder="e.g. Bob's Auto Glass, 123 Main St, Dallas TX"
                    className="field-input" />
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-title mb-3">Schedule your appointment</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="field">
                  <label className="field-label">Preferred date</label>
                  <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="field-input" />
                </div>
                <div className="field">
                  <label className="field-label">Time window</label>
                  <select value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="field-select">
                    <option>Morning (8am–12pm)</option>
                    <option>Afternoon (12pm–6pm)</option>
                    <option>Evening (6pm–8pm)</option>
                    <option>First available</option>
                  </select>
                </div>
              </div>
              {serviceType === 'mobile' && (
                <div className="field">
                  <label className="field-label">Service location (where should the technician come?)</label>
                  <input value={serviceAddress} onChange={e => setServiceAddress(e.target.value)}
                    placeholder="Home, office, or parking lot address"
                    className="field-input" />
                </div>
              )}
            </div>

            {glassInfo?.waived && (
              <InfoBox type="green" icon="✓">
                <strong>No out-of-pocket cost</strong> — deductible waived in {stateRule?.name}. {selectedShop.name} will be direct-billed.
              </InfoBox>
            )}
            {!glassInfo?.waived && (
              <InfoBox type="neutral" icon="ℹ️">
                Your comprehensive deductible applies. {selectedShop.name} is a direct-billing partner — you pay only your deductible directly to them, not upfront.
              </InfoBox>
            )}

            <div className="step-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Back</button>
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Review and confirm →</button>
            </div>
          </>
        )}

        {/* ── STEP 3: Review & confirm ──────────────────────────── */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 3 of 3</div>
              <h1 className="font-display font-black text-[24px] text-navy mb-1">Review and confirm</h1>
              <p className="text-[13.5px] text-muted">
                {serviceType === 'own-shop'
                  ? 'Your claim will be filed and you can take your vehicle to your chosen shop.'
                  : `${selectedShop.name} will be dispatched immediately after you submit.`}
              </p>
            </div>

            <InfoBox type="green" icon="✅">
              Everything looks complete. You will receive a text confirmation with your claim number immediately after submitting.
            </InfoBox>

            <div className="card">
              <div className="card-title mb-4">Claim summary</div>
              {[
                ['Vehicle',        '2021 Honda Accord EX-L · KXP-4421 TX'],
                ['Glass damaged',  glassLocation],
                ['Damage type',    DAMAGE_OPTIONS.find(d => d.id === damageType)?.label ?? damageType],
                ['Cause',          CAUSES.find(c => c.id === cause)?.label ?? cause],
                ['Date',           dateOfLoss],
                ['Location',       location],
                ['Shop',           serviceType === 'own-shop' ? ownShopName || 'My own shop' : selectedShop.name],
                ['Service type',   serviceType === 'mobile' ? 'Mobile — technician comes to me' : serviceType === 'dropoff' ? 'Drop-off at shop' : 'Own shop'],
                ['Appointment',    `${scheduleDate || 'First available'} — ${scheduleTime}`],
                ['Your cost',      glassInfo?.waived ? `$0 — waived in ${stateRule?.name ?? 'your state'}` : 'Deductible applies — paid directly to shop'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 py-2.5 border-b border-bg last:border-none">
                  <div className="text-[12.5px] text-muted w-36 flex-shrink-0">{k}</div>
                  <div className={clsx('text-[12.5px] font-semibold', k === 'Your cost' && glassInfo?.waived ? 'text-green' : 'text-navy')}>{v}</div>
                </div>
              ))}
            </div>

            {/* State rules summary on review */}
            {stateRule && (
              <div className="card">
                <div className="card-title mb-3">Applicable state rules — {stateRule.name}</div>
                {stateRule.keyAlerts.slice(0, 2).map((a, i) => (
                  <div key={i} className="text-[12px] text-muted mb-1.5 flex gap-2">
                    <span className="flex-shrink-0">•</span>{a}
                  </div>
                ))}
                <div className="text-[11.5px] text-blue mt-2">{stateRule.antiSteering}</div>
              </div>
            )}

            <div className="card">
              <div className="card-title mb-3">Certification</div>
              <label className="flex gap-3 items-start cursor-pointer text-[12.5px] text-slate leading-relaxed">
                <input type="checkbox" checked={certified} onChange={e => setCertified(e.target.checked)}
                  style={{ accentColor:'#C8102E', width:14, height:14, flexShrink:0, marginTop:2 }} />
                I certify that the damage described is accurate and occurred as stated. I understand that submitting a fraudulent glass claim is a criminal offense.
              </label>
            </div>

            <div className="step-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button type="button"
                className={clsx('btn btn-green px-7 py-3 text-[13.5px]', (!certified || submitting) && 'opacity-60 cursor-not-allowed')}
                onClick={handleSubmit}
                disabled={!certified || submitting}>
                {submitting
                  ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Dispatching…</span>
                  : serviceType === 'own-shop' ? 'File glass claim →' : `Dispatch ${selectedShop.name} now`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

