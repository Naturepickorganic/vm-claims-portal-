import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clsx } from 'clsx'
import { FNOLFormSchema, STEP_FIELDS, type FNOLFormData } from '@/lib/types'
import { useFNOL } from '@/lib/api/hooks/useFNOL'
import Navbar   from '@/components/layout/Navbar'
import Tip      from '@/components/ui/Tip'
import InfoBox  from '@/components/ui/InfoBox'

/* ── Constants ──────────────────────────────────────────────────── */
const STEPS = [
  { name:'What Happened',      sub:'Incident type, date, location'  },
  { name:'People & Vehicles',  sub:'Everyone involved'              },
  { name:'Photos & Documents', sub:'Damage photos, police report'   },
  { name:'Your Coverage',      sub:'What your policy covers'        },
  { name:'Repair & Rental',    sub:'Shop, inspection, rental'       },
  { name:'Review & Submit',    sub:'Confirm everything'             },
]

const INCIDENT_TYPES = [
  { id:'collision', icon:'💥', label:'Collision',       sub:'Hit a vehicle or object'  },
  { id:'weather',   icon:'🌧️', label:'Weather Damage',  sub:'Hail, flood, wind'        },
  { id:'theft',     icon:'🔓', label:'Theft/Vandalism', sub:'Stolen or damaged'        },
  { id:'glass',     icon:'🪟', label:'Glass Only',      sub:'Cracked windshield'       },
  { id:'animal',    icon:'🦌', label:'Animal Strike',   sub:'Deer, bird, other'        },
  { id:'hitrun',    icon:'🏚️', label:'Hit & Run',       sub:"Other driver didn't stop" },
  { id:'fire',      icon:'🔥', label:'Fire/Explosion',  sub:'Vehicle caught fire'      },
  { id:'other',     icon:'❓', label:'Something Else',  sub:'Describe below'           },
] as const

const CONDITIONS = ['☀️ Clear/Dry','🌧️ Rain/Wet','🌫️ Fog','❄️ Snow/Ice','🌆 Night','🚧 Construction','🚦 Intersection','🛣️ Highway']

const COVERAGES = [
  { name:'Collision Coverage',         detail:'Covers damage regardless of fault', amount:'Up to actual cash value', applies:true  },
  { name:'Liability — Bodily Injury',  detail:'Per person / per accident',         amount:'$100K / $300K',          applies:true  },
  { name:'Liability — Property Damage',detail:"Damage to other party's property",  amount:'$100,000',               applies:true  },
  { name:'Rental Reimbursement',       detail:'Daily rental while car is repaired', amount:'$40/day · 30 days',     applies:true  },
  { name:'Roadside Assistance',        detail:'Towing, lockout, flat tire, fuel',  amount:'Included',               applies:true  },
  { name:'Uninsured Motorist',         detail:'If other driver uninsured',          amount:'$50K / $100K',          applies:false },
  { name:'Comprehensive',              detail:'Theft, weather, fire, animals',      amount:'Up to actual cash value',applies:false },
]

const SHOPS = [
  { name:'AutoNation Collision · N. Dallas', addr:'5200 Lemmon Ave, Dallas TX 75209',   meta:'⭐ 4.9 · 📍 2.4 mi · ⏱ Tomorrow 9am · 🔒 Lifetime warranty', tag:'Partner'  },
  { name:'Caliber Collision · Uptown',       addr:'3120 Oak Lawn Ave, Dallas TX 75219',  meta:'⭐ 4.8 · 📍 3.1 mi · ⏱ Today 2pm · 🔒 Lifetime warranty',    tag:'Partner'  },
  { name:'Service King · Mockingbird',       addr:'1840 Mockingbird Ln, Dallas TX 75235',meta:'⭐ 4.6 · 📍 0.8 mi · ⏱ Monday 10am · 🔒 3yr warranty',       tag:'Verified' },
]

const SUBMIT_STEPS = [
  { icon:'🔒', text:'Securing your information…'    },
  { icon:'📋', text:'Recording claim details…'      },
  { icon:'🛡️', text:'Verifying your coverage…'      },
  { icon:'👤', text:'Assigning your adjuster…'      },
  { icon:'📧', text:'Sending your confirmation…'    },
]

const HOTSPOTS: { id:string; label:string; style:React.CSSProperties }[] = [
  { id:'Front',       label:'F',   style:{ top:'9%',    left:'50%',  transform:'translateX(-50%)' } },
  { id:'Rear',        label:'R',   style:{ bottom:'7%', left:'50%',  transform:'translateX(-50%)' } },
  { id:'Front-Left',  label:'FL',  style:{ top:'28%',   left:'10%'  } },
  { id:'Front-Right', label:'FR',  style:{ top:'28%',   right:'10%' } },
  { id:'Rear-Left',   label:'RL',  style:{ bottom:'25%',left:'10%'  } },
  { id:'Rear-Right',  label:'RR',  style:{ bottom:'25%',right:'10%' } },
  { id:'Roof',        label:'TOP', style:{ top:'47%',   left:'50%',  transform:'translate(-50%,-50%)' } },
]

const DEFAULTS: Partial<FNOLFormData> = {
  incidentType:'collision', dateOfLoss:'2025-04-22', timeOfLoss:'14:30',
  location:'I-35E & Mockingbird Ln, Dallas, TX 75204',
  description:"I was stopped at a red light when a grey Ford F-150 rear-ended my vehicle. The other driver stopped and we exchanged information. No injuries. Rear bumper and trunk lid are visibly damaged.",
  conditions:['☀️ Clear/Dry'], policeReport:'Yes — filed at the scene', policeNumber:'2024-DPD-0042821',
  injuries:'No injuries', airbags:'No', drivable:'No — I need a tow',
  otherPartyName:'Marcus T. Williams', otherPartyPhone:'(214) 555-0187',
  otherPartyInsurer:'Allstate Insurance', otherPartyPolicy:'AS-TX-8842-9921',
  otherPartyVehicle:'2019 Ford F-150 XLT', otherPartyPlate:'HJK-8821 TX',
  faultAssessment:'The other driver', damageZones:['Rear'], photoCount:0,
  selectedShopIndex:0, inspectionMethod:'virtual', rentalEnabled:true,
  rentalDate:'2025-04-23', rentalProvider:'Enterprise', towingEnabled:true,
  towingLocation:'I-35E southbound at Mockingbird Ln — right shoulder',
  certAccuracy:true, certAuthorize:true, certConsent:true,
}

/* ══════════════════════ MAIN COMPONENT ═══════════════════════════ */
export default function FNOLWizard() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(0)
  const [direction, setDirection] = useState<'fwd'|'back'>('fwd')
  const [damageZones, setDamageZones] = useState<Set<string>>(new Set(['Rear']))
  const [conditions,  setConditions]  = useState<string[]>(['☀️ Clear/Dry'])
  const [ownShop, setOwnShop]     = useState(false)
  const [submitIdx, setSubmitIdx] = useState(-1)
  const [photos, setPhotos]       = useState<Record<string,string[]>>({ vehicle:[], scene:[], doc:[] })
  const fileRefs = { vehicle: useRef<HTMLInputElement>(null), scene: useRef<HTMLInputElement>(null), doc: useRef<HTMLInputElement>(null) }

  const methods = useForm<FNOLFormData>({
    resolver: zodResolver(FNOLFormSchema),
    defaultValues: DEFAULTS as FNOLFormData,
    mode: 'onBlur',
  })
  const { handleSubmit, trigger, watch, setValue, formState: { isSubmitting } } = methods
  const { mutate: submitFNOL, isPending } = useFNOL()

  const goTo = (n: number) => {
    setDirection(n > step ? 'fwd' : 'back')
    setStep(n)
    window.scrollTo({ top:0, behavior:'smooth' })
  }

  const handleNext = async () => {
    const ok = await trigger(STEP_FIELDS[step] as any)
    if (ok) goTo(step + 1)
  }

  const toggleZone = (z: string) => setDamageZones(prev => { const n=new Set(prev); n.has(z)?n.delete(z):n.add(z); return n })
  const toggleCond = (c: string) => setConditions(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c])
  const handleFiles = (zone: string, files: FileList|null) => {
    if (!files) return
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    setPhotos(p => ({ ...p, [zone]:[...p[zone], ...urls] }))
    setValue('photoCount', (watch('photoCount')||0) + files.length)
  }

  const onSubmit = (data: FNOLFormData) => {
    let i = 0; setSubmitIdx(0)
    const t = setInterval(() => {
      setSubmitIdx(++i)
      if (i >= SUBMIT_STEPS.length) {
        clearInterval(t)
        submitFNOL({ ...data, lob:'auto' }, {
          onSuccess: (res) => navigate(`/claims/auto/${res.claimId}/status`),
          onError:   () => setSubmitIdx(-1),
        })
      }
    }, 700)
  }

  const progress = Math.round(((step+1)/STEPS.length)*100)
  const totalPhotos = Object.values(photos).reduce((s,a) => s+a.length, 0)

  /* Submitting overlay */
  if (submitIdx >= 0 || isPending) return (
    <div className="min-h-screen flex flex-col">
      <Navbar crumb="File a Claim" secondCrumb="Auto Insurance" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-[320px]">
          <div className="w-12 h-12 border-4 border-border border-t-green rounded-full animate-spin" />
          <div className="text-base font-bold text-navy">Submitting your claim…</div>
          <div className="flex flex-col gap-2 text-left w-full mt-2">
            {SUBMIT_STEPS.map((s,i) => (
              <div key={i} className={clsx('flex items-center gap-2.5 text-[12.5px] py-1',
                i < submitIdx ? 'text-green font-semibold' : i===submitIdx ? 'text-navy font-semibold' : 'text-muted')}>
                <span>{i < submitIdx ? '✅' : s.icon}</span>{s.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen flex flex-col">
        <Navbar crumb="File a Claim" secondCrumb="Auto Insurance" />

        {/* Mobile progress bar */}
        <div className="md:hidden bg-navy px-4 py-3 border-b border-white/8">
          <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
            <span>{STEPS[step].name}</span><span>Step {step+1} of {STEPS.length}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red to-[#FF5577] rounded-full transition-all duration-500" style={{ width:`${progress}%` }} />
          </div>
        </div>

        <div className="flex flex-1">
          {/* Sidebar — desktop only */}
          <Sidebar step={step} steps={STEPS} progress={progress} onGoTo={goTo} lob="auto" />

          <main className="flex-1 px-4 py-6 md:px-10 md:py-8 max-w-[860px]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={clsx(direction==='fwd' ? 'animate-[slideIn_.25s_ease]' : 'animate-[slideInBack_.25s_ease]')} key={step}>

                {step === 0 && <Step1Auto conditions={conditions} onToggle={toggleCond} />}
                {step === 1 && <Step2Auto />}
                {step === 2 && <Step3Auto damageZones={damageZones} onToggleZone={toggleZone} photos={photos} fileRefs={fileRefs} onFiles={handleFiles} totalPhotos={totalPhotos} />}
                {step === 3 && <Step4Auto />}
                {step === 4 && <Step5Auto ownShop={ownShop} onOwnShop={() => setOwnShop(v=>!v)} />}
                {step === 5 && <Step6Auto damageZones={damageZones} totalPhotos={totalPhotos} onGoTo={goTo} />}

                <div className="step-nav">
                  {step === 0
                    ? <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>← Back to Home</button>
                    : <button type="button" className="btn btn-ghost" onClick={() => goTo(step-1)}>← Back</button>
                  }
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-faint hidden sm:block">* required</span>
                    {step < 5
                      ? <button type="button" className="btn btn-primary" onClick={handleNext}>{STEPS[step+1].name} →</button>
                      : <button type="submit" className="btn btn-green px-7 py-3 text-[13.5px]" disabled={isSubmitting||isPending}>Submit My Claim →</button>
                    }
                  </div>
                </div>
              </div>
            </form>
          </main>
        </div>
      </div>
    </FormProvider>
  )
}

/* ══════════ SHARED LAYOUT COMPONENTS ══════════════════════════════ */

interface SidebarProps { step:number; steps:typeof STEPS; progress:number; onGoTo:(n:number)=>void; lob:'auto'|'home' }

export function Sidebar({ step, steps, progress, onGoTo, lob }: SidebarProps) {
  const policyNum  = lob==='home' ? '#VM-HOME-2024-33891' : '#VM-AUTO-2024-88421'
  const policyProp = lob==='home' ? '🏠 4821 Mockingbird Ln, Dallas TX' : '🚗 2021 Honda Accord EX-L · Silver'
  return (
    <aside className="hidden md:flex w-68 bg-navy flex-col sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto border-r border-white/8 flex-shrink-0">
      <div className="p-4 border-b border-white/8">
        <div className="text-[9.5px] font-bold tracking-widest uppercase text-white/30 mb-2">Your Policy</div>
        <div className="bg-white/6 border border-white/10 rounded-xl p-3">
          <div className="text-[13px] font-bold text-white">Sarah M. Johnson</div>
          <div className="text-[11px] text-white/45 mt-px">Policy {policyNum}</div>
          <div className="text-[11.5px] text-white/60 mt-1">{policyProp}</div>
          <div className="inline-flex items-center gap-1 mt-2 bg-green/20 border border-green/35 text-[10px] font-bold text-green-300 px-2 py-px rounded-full">✓ Active Coverage</div>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-white/8">
        <div className="flex justify-between text-[10.5px] text-white/35 mb-1.5"><span>Progress</span><span>Step {step+1} / {steps.length}</span></div>
        <div className="h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-red to-[#FF5577] rounded-full transition-all duration-500" style={{ width:`${progress}%` }} />
        </div>
      </div>
      <div className="py-3.5 flex-1">
        {steps.map((s,i) => (
          <button key={i} type="button" onClick={() => i<step ? onGoTo(i) : undefined}
            className={clsx('w-full flex items-start gap-3 px-5 py-2.5 border-l-[3px] transition-all text-left',
              i===step ? 'bg-red/15 border-red' : i<step ? 'border-green cursor-pointer hover:bg-white/4' : 'border-transparent cursor-default')}>
            <div className={clsx('w-[26px] h-[26px] rounded-full border-2 flex items-center justify-center text-[10.5px] font-bold flex-shrink-0 mt-px transition-all',
              i===step ? 'bg-red border-red text-white shadow-[0_0_0_4px_rgba(200,16,46,.2)]' : i<step ? 'bg-green border-green text-white' : 'border-white/15 text-white/30')}>
              {i < step ? '✓' : i+1}
            </div>
            <div>
              <div className={clsx('text-[12.5px] font-semibold leading-snug', i===step?'text-white/95':i<step?'text-white/55':'text-white/50')}>{s.name}</div>
              <div className="text-[10.5px] text-white/25 mt-px">{s.sub}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-white/8">
        <div className="text-[12px] font-bold text-white/70 mb-1">🙋 Need help?</div>
        <div className="text-[11px] text-white/35 mb-2">Claims team available 24/7.</div>
        <a href="tel:18008262534" className="text-[13px] font-bold text-[#FF8099]">📞 1-800-VM-CLAIMS</a>
      </div>
    </aside>
  )
}

export function StepHeader({ step, total=6, title, desc }: { step:number; total?:number; title:string; desc:string }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold tracking-widest uppercase text-red mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-red" /> Step {step+1} of {total}
      </div>
      <h1 className="font-display font-black text-[22px] md:text-[24px] text-navy leading-tight mb-1.5">{title}</h1>
      <p className="text-[13px] text-muted leading-relaxed max-w-[560px]">{desc}</p>
    </div>
  )
}

function FieldErr({ name }: { name:string }) {
  const { formState:{ errors } } = useFormContext<FNOLFormData>()
  const msg = (errors as Record<string,{message?:string}>)[name]?.message
  return msg ? <span className="err-msg">{msg}</span> : null
}

/* ══════════════════════ STEP 1 ════════════════════════════════════ */
function Step1Auto({ conditions, onToggle }: { conditions:string[]; onToggle:(c:string)=>void }) {
  const { register, watch, setValue, formState:{ errors } } = useFormContext<FNOLFormData>()
  const incidentType = watch('incidentType')
  return (
    <>
      <StepHeader step={0} title="Tell Us What Happened" desc="Take your time — the more detail you share, the faster we can help." />
      <InfoBox type="neutral" icon="💙">We're sorry you're dealing with this. Our team handles the details — just walk us through what happened.</InfoBox>
      <div className="card">
        <div className="card-title mb-4">What type of incident occurred? <span className="text-red">*</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {INCIDENT_TYPES.map(t => (
            <div key={t.id} onClick={() => setValue('incidentType', t.id as any)}
              className={clsx('inc-card', incidentType===t.id && 'inc-card-on')}>
              {incidentType===t.id && <span className="absolute top-1.5 right-2 text-[10px] font-black text-red">✓</span>}
              <div className="text-[22px] mb-1.5">{t.icon}</div>
              <div className="text-[11.5px] font-bold text-navy">{t.label}</div>
              <div className="text-[10px] text-muted mt-0.5">{t.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-4">When &amp; Where?</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field">
            <label className="field-label">Date of Incident <span className="text-red">*</span> <Tip title="Use police report date">An estimate is fine — correct it later if needed.</Tip></label>
            <input type="date" {...register('dateOfLoss')} className={clsx('field-input prefilled', errors.dateOfLoss && 'border-red ring-2 ring-red/10')} />
            <FieldErr name="dateOfLoss" />
          </div>
          <div className="field">
            <label className="field-label">Approximate Time <Tip title="Can't remember?">Check your call log or navigation history.</Tip></label>
            <input type="time" {...register('timeOfLoss')} className="field-input" />
          </div>
          <div className="field sm:col-span-2">
            <label className="field-label">Where did it happen? <span className="text-red">*</span></label>
            <input {...register('location')} className={clsx('field-input prefilled', errors.location && 'border-red ring-2 ring-red/10')} />
            <FieldErr name="location" />
            <span className="field-hint">📋 Pre-filled from your report — verify or update</span>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-4">Describe What Happened</div>
        <div className="field mb-4">
          <label className="field-label">In your own words <span className="text-red">*</span></label>
          <textarea {...register('description')} className={clsx('field-textarea prefilled', errors.description && 'border-red ring-2 ring-red/10')} rows={4} />
          <FieldErr name="description" />
        </div>
        <div className="field-label mb-2">Road &amp; weather conditions</div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => <button key={c} type="button" onClick={() => onToggle(c)} className={clsx('chip', conditions.includes(c) && 'chip-on')}>{c}</button>)}
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-4">Police Report &amp; Injuries</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field"><label className="field-label">Police report filed?</label><select {...register('policeReport')} className="field-select prefilled"><option>Yes — filed at the scene</option><option>No</option><option>Not yet — I'll upload later</option></select></div>
          <div className="field"><label className="field-label">Report Number</label><input {...register('policeNumber')} className="field-input prefilled" /></div>
          <div className="field"><label className="field-label">Injuries? <span className="text-red">*</span></label><select {...register('injuries')} className="field-select"><option>No injuries</option><option>Minor (treated at scene)</option><option>Yes — needed medical attention</option></select></div>
          <div className="field"><label className="field-label">Airbags deploy?</label><select {...register('airbags')} className="field-select"><option>No</option><option>Driver side only</option><option>All airbags</option></select></div>
        </div>
        <InfoBox type="red" icon="⚠️" className="mt-3.5 mb-0">If anyone was seriously injured, call <strong>1-800-VM-CLAIMS (press 1)</strong> right now.</InfoBox>
      </div>
    </>
  )
}

/* ══════════════════════ STEP 2 ════════════════════════════════════ */
function Step2Auto() {
  const { register, watch, setValue } = useFormContext<FNOLFormData>()
  const fault = watch('faultAssessment')
  return (
    <>
      <StepHeader step={1} title="People & Vehicles Involved" desc="Your vehicle details are already filled in from your policy." />
      <InfoBox type="green" icon="✅">We've pulled your vehicle and policy details. Verify, then add the other party's information.</InfoBox>
      <div className="card">
        <div className="flex items-center justify-between mb-4"><div className="card-title">🚗 Your Vehicle</div><span className="text-[10px] font-bold text-muted bg-bg border border-border px-2 py-px rounded-full">From your policy</span></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {[['Year','2021'],['Make','Honda'],['Model','Accord EX-L'],['Color','Silver'],['License Plate','KXP-4421 TX'],['VIN','1HGCV1F34MA123456']].map(([l,v]) => (
            <div key={l} className="field"><label className="field-label">{l} <span className="prefill-badge">✓ On file</span></label><input defaultValue={v} className="field-input prefilled" readOnly /></div>
          ))}
          <div className="field sm:col-span-2">
            <label className="field-label">Can you drive the vehicle? <span className="text-red">*</span></label>
            <select {...register('drivable')} className="field-select"><option>No — I need a tow</option><option>Yes — I can drive it</option><option>Not sure</option></select>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-4">🚙 The Other Party</div>
        <InfoBox type="blue" icon="📸">If you photographed the other driver's insurance card, their details should match below.</InfoBox>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field"><label className="field-label">Other Driver's Full Name</label><input {...register('otherPartyName')} className="field-input" /></div>
          <div className="field"><label className="field-label">Their Phone Number</label><input {...register('otherPartyPhone')} className="field-input" /></div>
          <div className="field"><label className="field-label">Their Insurance Company</label><input {...register('otherPartyInsurer')} className="field-input" /></div>
          <div className="field"><label className="field-label">Their Policy Number</label><input {...register('otherPartyPolicy')} className="field-input" /></div>
          <div className="field"><label className="field-label">Their Vehicle</label><input {...register('otherPartyVehicle')} className="field-input" /></div>
          <div className="field"><label className="field-label">Their License Plate</label><input {...register('otherPartyPlate')} className="field-input" /></div>
        </div>
        <div className="mt-3.5">
          <div className="field-label mb-2">Who do you think was at fault?</div>
          <div className="flex flex-wrap gap-2">
            {['The other driver','Both of us (shared)',"I'm not sure yet",'I was at fault'].map(o => (
              <button key={o} type="button" onClick={() => setValue('faultAssessment',o)} className={clsx('chip', fault===o && 'chip-on')}>{o}</button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════ STEP 3 ════════════════════════════════════ */
function Step3Auto({ damageZones, onToggleZone, photos, fileRefs, onFiles, totalPhotos }:{
  damageZones:Set<string>; onToggleZone:(z:string)=>void
  photos:Record<string,string[]>; fileRefs:any; onFiles:(z:string,f:FileList|null)=>void; totalPhotos:number
}) {
  return (
    <>
      <StepHeader step={2} title="Photos & Documents" desc="Photos are the single biggest factor in how quickly your claim resolves." />
      <InfoBox type="blue" icon="📸"><strong>Best tip:</strong> 10–15 photos from multiple angles — both vehicles, all damage, license plates, and skid marks.</InfoBox>
      <div className="card">
        <div className="card-title mb-3">🎯 Mark Where Your Car Was Damaged</div>
        <div className="bg-bg border border-border rounded-xl p-4 text-center">
          <div className="text-[10.5px] font-bold text-slate uppercase tracking-wider mb-3">2021 Honda Accord — Top View</div>
          <div className="relative inline-block max-w-[240px] w-full">
            <svg viewBox="0 0 240 420" className="w-full" fill="none">
              <rect x="44" y="50" width="152" height="320" rx="26" fill="#E2E8F0"/>
              <rect x="70" y="76" width="100" height="58" rx="9" fill="#BFDBFE" opacity=".75"/>
              <rect x="70" y="286" width="100" height="52" rx="9" fill="#BFDBFE" opacity=".75"/>
              <rect x="80" y="146" width="80" height="128" rx="6" fill="#A0AEC0"/>
              <rect x="15" y="96" width="30" height="52" rx="8" fill="#4A5568"/>
              <rect x="15" y="272" width="30" height="52" rx="8" fill="#4A5568"/>
              <rect x="195" y="96" width="30" height="52" rx="8" fill="#4A5568"/>
              <rect x="195" y="272" width="30" height="52" rx="8" fill="#4A5568"/>
            </svg>
            {HOTSPOTS.map(h => (
              <button key={h.id} type="button" onClick={() => onToggleZone(h.id)}
                className={clsx('absolute w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black transition-all hover:scale-110',
                  damageZones.has(h.id) ? 'bg-red text-white' : 'bg-border text-muted')}
                style={h.style}>{h.label}</button>
            ))}
          </div>
          <p className="text-[12px] text-slate mt-3">Marked: <span className="text-red font-bold">{damageZones.size ? [...damageZones].join(', ') : 'None'}</span></p>
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-4">📷 Upload Your Photos</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[{zone:'vehicle',icon:'🖼️',label:"🚗 Your Car's Damage",sub:'JPEG, PNG, HEIC'},{zone:'scene',icon:'📍',label:'🚙 Other Car & Scene',sub:'License plates'},{zone:'doc',icon:'📄',label:'📄 Documents',sub:'Police report, estimates'}].map(({zone,icon,label,sub}) => (
            <div key={zone}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">{label}</div>
              <div className="drop-zone" onClick={() => fileRefs[zone].current?.click()}>
                <input ref={fileRefs[zone]} type="file" accept={zone==='doc'?'image/*,.pdf':'image/*'} multiple onChange={e=>onFiles(zone,e.target.files)} className="hidden" />
                <span className="text-[22px] opacity-40">{icon}</span>
                <span className="text-[11.5px] font-semibold text-slate">Tap to upload</span>
                <span className="text-[10.5px] text-faint">{sub}</span>
              </div>
              {photos[zone].length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{photos[zone].map((url,i) => <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded-lg border border-border" />)}</div>}
            </div>
          ))}
        </div>
        {totalPhotos > 0 && <div className="text-[12px] text-green font-semibold mt-3">✅ {totalPhotos} file{totalPhotos>1?'s':''} uploaded</div>}
      </div>
    </>
  )
}

/* ══════════════════════ STEP 4 ════════════════════════════════════ */
function Step4Auto() {
  return (
    <>
      <StepHeader step={3} title="Your Coverage" desc="Here's exactly what your policy covers for this incident." />
      <div className="card">
        <div className="flex items-center justify-between mb-4"><div className="card-title">🛡️ Your Coverage — Policy #VM-AUTO-2024-88421</div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {COVERAGES.map((c,i) => (
            <div key={i} className={clsx('border rounded-xl p-3.5 transition-all', c.applies?'border-green-mid bg-green-light':'border-border opacity-55')}>
              <div className="flex items-start justify-between mb-2">
                <div className={clsx('text-[12px] font-bold', c.applies?'text-[#064E3B]':'text-navy')}>{c.name}</div>
                <span className={clsx('text-[9.5px] font-bold px-2 py-px rounded-full ml-2 flex-shrink-0', c.applies?'bg-green text-white':'bg-bg text-faint border border-border')}>{c.applies?'✓ Applies':'N/A'}</span>
              </div>
              <div className={clsx('text-[11px]', c.applies?'text-[#065F46]':'text-muted')}>{c.detail}</div>
              <div className={clsx('text-[12px] font-bold mt-1.5', c.applies?'text-green-dark':'text-navy')}>{c.amount}</div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-br from-navy to-navy-light rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10.5px] text-white/45 mb-1">Your Out-of-Pocket Deductible</div>
            <div className="font-display font-black text-[28px] text-white">$500.00</div>
            <div className="text-[10.5px] text-white/40 mt-1">We'll pursue Allstate to recover this — no action needed</div>
          </div>
          <span className="text-[36px] opacity-30">💳</span>
        </div>
      </div>
      <InfoBox type="amber" icon="💰"><strong>Getting your deductible back:</strong> Our team sends a formal demand to Allstate within 5 business days. If accepted, your <strong>$500 is refunded to you directly</strong>.</InfoBox>
    </>
  )
}

/* ══════════════════════ STEP 5 ════════════════════════════════════ */
function Step5Auto({ ownShop, onOwnShop }: { ownShop:boolean; onOwnShop:()=>void }) {
  const { watch, setValue } = useFormContext<FNOLFormData>()
  const shopIdx    = watch('selectedShopIndex')
  const inspection = watch('inspectionMethod')
  const rental     = watch('rentalEnabled')
  const towing     = watch('towingEnabled')

  return (
    <>
      <StepHeader step={4} title="Repair & Rental Options" desc="Choose your repair shop and set up your rental." />
      <InfoBox type="green" icon="🤖"><strong>Quick estimate:</strong> Based on your photos, repair is estimated at <strong>$2,800–$4,200</strong>. Adjuster will confirm.</InfoBox>
      <div className="card">
        <div className="card-title mb-4">🔧 Choose a Repair Shop</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SHOPS.map((s,i) => (
            <div key={i} onClick={() => setValue('selectedShopIndex',i)}
              className={clsx('border rounded-xl p-3.5 cursor-pointer transition-all relative',
                shopIdx===i ? 'border-red bg-red-light ring-2 ring-red/10' : 'border-border bg-white hover:border-red/40 hover:bg-red-light/50')}>
              <span className={clsx('absolute top-2 right-2 text-[9.5px] font-bold px-1.5 py-px rounded-full', s.tag==='Partner'?'bg-navy text-white':'bg-amber-light text-amber border border-amber/30')}>{s.tag}</span>
              <div className="text-[12.5px] font-bold text-navy pr-14 mb-1">{s.name}</div>
              <div className="text-[11px] text-muted mb-2">{s.addr}</div>
              <div className="text-[10.5px] text-slate leading-loose">{s.meta}</div>
              <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] mt-2.5', shopIdx===i?'bg-red border-red text-white':'border-border')}>✓</div>
            </div>
          ))}
        </div>
        {!ownShop
          ? <button type="button" onClick={onOwnShop} className="mt-3 text-[12px] font-bold text-red bg-transparent border-none cursor-pointer">+ Use my own shop</button>
          : <div className="mt-3 field"><label className="field-label">Your Shop Name &amp; Address</label><input className="field-input" placeholder="Enter your preferred shop" /></div>
        }
      </div>
      <div className="card">
        <div className="card-title mb-4">🔍 Inspection Method</div>
        {[
          { id:'virtual', label:'📱 Review My Photos', tag:'Recommended', sub:'Result within 24 hours' },
          { id:'mobile',  label:'🏠 Send Someone to Me',tag:'',           sub:'Adjuster visits within 48 hours' },
          { id:'shop',    label:'🔧 Inspect at Shop',   tag:'',           sub:'Drop off your car' },
        ].map(opt => (
          <div key={opt.id} onClick={() => setValue('inspectionMethod',opt.id as any)}
            className="flex items-center justify-between p-3.5 border border-border rounded-xl mb-2 cursor-pointer hover:bg-red-light/50 transition-all">
            <div>
              <div className="text-[12.5px] font-semibold text-navy">
                {opt.label}
                {opt.tag && <span className="ml-2 text-[10px] bg-green-light text-green border border-green-mid px-2 py-px rounded-full font-bold">{opt.tag}</span>}
              </div>
              <div className="text-[11px] text-muted mt-px">{opt.sub}</div>
            </div>
            <div className={clsx('toggle', inspection===opt.id?'toggle-on':'toggle-off')}>
              <span className={clsx('toggle-knob', inspection===opt.id?'left-[22px]':'left-[3px]')} />
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title mb-3">🚙 Rental Car <Tip title="Zero upfront cost">Up to $40/day for 30 days via Enterprise. We direct-bill them.</Tip></div>
        <InfoBox type="blue" icon="ℹ️">Covered for up to <strong>$40/day for 30 days</strong>. We direct-bill Enterprise — <strong>zero out-of-pocket</strong>.</InfoBox>
        <div onClick={() => setValue('rentalEnabled',!rental)} className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-red-light/50 transition-all mb-2">
          <div><div className="text-[12.5px] font-semibold text-navy">Yes, I need a rental car</div><div className="text-[11px] text-muted">Enterprise on Lemmon Ave — ready today</div></div>
          <div className={clsx('toggle', rental?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', rental?'left-[22px]':'left-[3px]')} /></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-3">🚛 Towing <Tip title="Covered — no charge">Dispatched under your roadside benefit. ETA ~45 min.</Tip></div>
        <div onClick={() => setValue('towingEnabled',!towing)} className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-red-light/50 transition-all">
          <div><div className="text-[12.5px] font-semibold text-navy">Send a tow truck</div><div className="text-[11px] text-muted">Covered under roadside assistance · ETA ~45 min</div></div>
          <div className={clsx('toggle', towing?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', towing?'left-[22px]':'left-[3px]')} /></div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════ STEP 6 ════════════════════════════════════ */
function Step6Auto({ damageZones, totalPhotos, onGoTo }: { damageZones:Set<string>; totalPhotos:number; onGoTo:(n:number)=>void }) {
  const { register, watch, formState:{ errors } } = useFormContext<FNOLFormData>()
  const incidentType = watch('incidentType')
  const dateOfLoss   = watch('dateOfLoss')
  const location     = watch('location')
  const shopIdx      = watch('selectedShopIndex')
  const inspection   = watch('inspectionMethod')
  const rental       = watch('rentalEnabled')
  return (
    <>
      <StepHeader step={5} title="Review & Submit" desc="Confirm everything looks right. Adjuster assigned within 2 hours of submitting." />
      <InfoBox type="green" icon="✅">Everything looks complete! You'll get an immediate confirmation with your claim number by email and text.</InfoBox>
      <div className="card">
        {[
          { title:'What Happened', step:0, rows:[['Incident',INCIDENT_TYPES.find(t=>t.id===incidentType)?.label??incidentType],['Date',dateOfLoss],['Location',location],['Police Report','DPD #2024-0042821','ok'],['Injuries','None reported','ok']] },
          { title:'People & Vehicles', step:1, rows:[['Your Vehicle','2021 Honda Accord EX-L · KXP-4421 TX'],['Other Driver','Marcus T. Williams'],['Other Insurer','Allstate #AS-TX-8842-9921']] },
          { title:'Damage & Photos', step:2, rows:[['Damage Areas',[...damageZones].join(', ')||'None marked','warn'],[`Photos`,totalPhotos>=4?`✅ ${totalPhotos} photos`:`${totalPhotos} photos — ${4-totalPhotos} more recommended`,totalPhotos>=4?'ok':'warn']] },
          { title:'Repair & Rental', step:4, rows:[['Shop',SHOPS[shopIdx]?.name??'—'],['Inspection',inspection==='virtual'?'📱 Photo review (24hr)':'🏠 Mobile adjuster'],['Rental',rental?'✓ Enterprise · Direct billing':'Not needed',rental?'ok':'']] },
        ].map((section,si) => (
          <div key={si} className={clsx(si>0 && 'mt-4 pt-4 border-t border-border')}>
            <div className="flex items-center justify-between text-[12px] font-bold text-navy pb-2 border-b-2 border-red mb-2.5">
              {section.title}
              <button type="button" onClick={() => onGoTo(section.step)} className="text-[11px] font-bold text-red bg-transparent border-none cursor-pointer">✏️ Edit</button>
            </div>
            {section.rows.map(([k,v,s]) => (
              <div key={String(k)} className="flex gap-3.5 py-1.5 border-b border-bg last:border-none">
                <div className="text-[12px] text-muted w-36 flex-shrink-0">{k}</div>
                <div className={clsx('text-[12px] font-semibold', s==='ok'?'text-green':s==='warn'?'text-amber':'text-navy')}>{v}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title mb-4">📋 Before You Submit</div>
        {[
          { name:'certAccuracy'  as const, text:"I confirm all information is accurate. Providing false information may affect my coverage." },
          { name:'certAuthorize' as const, text:'I authorize ValueMomentum and my adjuster to inspect my vehicle and process this claim.' },
          { name:'certConsent'   as const, text:'I consent to receive claim updates by text and email.' },
        ].map(({ name, text }) => (
          <label key={name} className="flex gap-3 items-start cursor-pointer text-[12px] text-slate leading-relaxed mb-3">
            <input type="checkbox" {...register(name)} style={{ accentColor:'#C8102E', width:14, height:14, flexShrink:0, marginTop:2 }} />
            {text}
            {errors[name] && <span className="err-msg ml-1">{errors[name]?.message as string}</span>}
          </label>
        ))}
        <InfoBox type="green" icon="🚀" className="mb-0">The moment you submit — your claim is logged, an adjuster is assigned, and your tow is dispatched.</InfoBox>
      </div>
    </>
  )
}
