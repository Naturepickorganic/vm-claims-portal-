import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { clsx } from 'clsx'
import { useFNOL } from '@/lib/api/hooks/useFNOL'
import Navbar  from '@/components/layout/Navbar'
import InfoBox from '@/components/ui/InfoBox'
import Tip     from '@/components/ui/Tip'
import { Sidebar, StepHeader } from '@/pages/claims/auto/FNOLWizard'

/* ── Schema ──────────────────────────────────────────────────────── */
const HomeSchema = z.object({
  incidentType:        z.enum(['wind-hail','fire','water','theft','tree','lightning','mold','other']),
  dateOfLoss:          z.string().min(1,'Date is required'),
  timeOfLoss:          z.string().optional().default(''),
  safeToOccupy:        z.string().default('Yes — safe to live in'),
  description:         z.string().min(20,'Please describe what happened (20+ characters)'),
  conditions:          z.array(z.string()).default([]),
  damageZones:         z.array(z.string()).default([]),
  rooms:               z.array(z.string()).default([]),
  selectedContractor:  z.number().default(0),
  inspectionMethod:    z.enum(['virtual','onsite','joint']).default('virtual'),
  aleEnabled:          z.boolean().default(false),
  certAccuracy:        z.boolean().refine(v=>v===true,{message:'Certification required'}),
  certAuthorize:       z.boolean().refine(v=>v===true,{message:'Authorization required' }),
  certConsent:         z.boolean().refine(v=>v===true,{message:'Consent required'       }),
})
type HomeData = z.infer<typeof HomeSchema>

/* ── Constants ───────────────────────────────────────────────────── */
const HOME_STEPS = [
  { name:'What Happened',    sub:'Incident type, date, property'   },
  { name:'Your Property',    sub:'Structure, damage areas, rooms'  },
  { name:'Photos',           sub:'Damage photos, receipts'         },
  { name:'Your Coverage',    sub:'Dwelling, contents, ALE'         },
  { name:'Repair & Housing', sub:'Contractor, inspection, ALE'     },
  { name:'Review & Submit',  sub:'Confirm and file'                },
]

const HOME_INCIDENT_TYPES = [
  { id:'wind-hail', icon:'🌪️', label:'Wind / Hail',        sub:'Storm, hail damage'    },
  { id:'fire',      icon:'🔥', label:'Fire / Smoke',        sub:'Structure or contents' },
  { id:'water',     icon:'💧', label:'Water Damage',        sub:'Burst pipe, flood'     },
  { id:'theft',     icon:'🔓', label:'Theft / Burglary',   sub:'Break-in or vandalism' },
  { id:'tree',      icon:'🌳', label:'Tree / Object',       sub:'Tree fell on structure'},
  { id:'lightning', icon:'⚡', label:'Lightning / Power',   sub:'Surge, appliance'     },
  { id:'mold',      icon:'🍃', label:'Mold / Fungi',        sub:'Discovered mold'      },
  { id:'other',     icon:'❓', label:'Something Else',      sub:'Describe below'       },
] as const

const CONDITIONS = ['🌧️ Heavy Rain','⛈️ Severe Storm','🌩️ Hail','🌪️ High Winds','🔥 Dry / Hot','❄️ Ice / Snow','⚡ Lightning','🌫️ Low Visibility']
const DAMAGE_AREAS = ['🏠 Roof','🌧️ Gutters','🪟 Windows','🧱 Siding','🚪 Doors','❄️ HVAC','🧱 Chimney','🌿 Fence']
const ROOMS = [['🛏️','Master Bedroom'],['🛁','Bathrooms'],['🍳','Kitchen'],['🛋️','Living Room'],['🍽️','Dining Room'],['🔧','Garage'],['📦','Attic'],['🏊','Basement']] as const

const CONTRACTORS = [
  { name:'DFW Elite Roofing & Restoration', addr:'1840 W Northwest Hwy, Dallas TX 75220', meta:'⭐ 4.9 · 3.2 mi · Apr 24 · 5-yr warranty', tag:'Partner'  },
  { name:'Texas Storm Pros',                addr:'4200 Belt Line Rd, Addison TX 75001',   meta:'⭐ 4.8 · 7.1 mi · Apr 25 · Lifetime',       tag:'Partner'  },
  { name:'Pinnacle Property Services',      addr:'2901 Greenville Ave, Dallas TX 75206',  meta:'⭐ 4.7 · 2.9 mi · Apr 23 · 3-yr warranty', tag:'Certified'},
]

const COVERAGES = [
  { badge:'Cov A', name:'Dwelling — Structure',   applies:true,  amount:'$425,000',        detail:'Roof, walls, windows, siding from wind/hail'  },
  { badge:'Cov B', name:'Other Structures',       applies:true,  amount:'$42,500',         detail:'Fence, garage, shed'                          },
  { badge:'Cov C', name:'Personal Property',      applies:true,  amount:'$212,500',        detail:'Furniture, electronics, appliances'           },
  { badge:'Cov D', name:'Additional Living Exp.', applies:true,  amount:'$85,000 · 24mo', detail:'Hotel, meals if home uninhabitable'           },
  { badge:'Cov E', name:'Personal Liability',     applies:true,  amount:'$300,000',        detail:'Injury to guests on your property'            },
  { badge:'Flood', name:'Flood / Sewer Backup',   applies:false, amount:'Not covered',     detail:'Standard HO-3 excludes ground flooding'      },
]

const SUBMIT_STEPS = ['🔒 Securing…','📋 Recording…','🛡️ Verifying…','👤 Assigning adjuster…','🔨 Notifying contractor…','📧 Sending confirmation…']

const STEP_FIELDS: Record<number,(keyof HomeData)[]> = {
  0:['incidentType','dateOfLoss','description'], 1:['damageZones'],
  2:[], 3:[], 4:['inspectionMethod'], 5:['certAccuracy','certAuthorize','certConsent'],
}

/* ══════════════════ MAIN COMPONENT ════════════════════════════════ */
export default function HomeFNOLWizard() {
  const navigate        = useNavigate()
  const [step, setStep] = useState(0)
  const [dir,  setDir]  = useState<'fwd'|'back'>('fwd')
  const [submitIdx, setSubmitIdx] = useState(-1)

  const methods = useForm<HomeData>({
    resolver: zodResolver(HomeSchema),
    defaultValues: {
      incidentType:'wind-hail', dateOfLoss:'2025-04-22', timeOfLoss:'14:30',
      safeToOccupy:'Yes — safe to live in',
      description:"At approximately 2:30 PM a severe hailstorm struck the Dallas area. I discovered significant damage to the roof — multiple missing shingles, damaged gutters, a dented HVAC unit, and two broken windows on the west side. There also appears to be a water stain on the master bedroom ceiling.",
      conditions:['🌧️ Heavy Rain','⛈️ Severe Storm','🌩️ Hail'],
      damageZones:['🏠 Roof','🪟 Windows'], rooms:['Master Bedroom'],
      selectedContractor:0, inspectionMethod:'virtual', aleEnabled:false,
      certAccuracy:true, certAuthorize:true, certConsent:true,
    },
    mode:'onBlur',
  })

  const { handleSubmit, trigger, formState:{isSubmitting} } = methods
  const { mutate: submitFNOL, isPending } = useFNOL()

  const goTo = (n:number) => { setDir(n>step?'fwd':'back'); setStep(n); window.scrollTo({top:0,behavior:'smooth'}) }
  const handleNext = async () => { const ok = await trigger(STEP_FIELDS[step] as any); if(ok) goTo(step+1) }

  const onSubmit = (data: HomeData) => {
    let i=0; setSubmitIdx(0)
    const t = setInterval(() => {
      setSubmitIdx(++i)
      if(i >= SUBMIT_STEPS.length) {
        clearInterval(t)
        submitFNOL({ ...data, lob:'home' }, {
          onSuccess:(res) => navigate(`/claims/home/${res.claimId}/status`),
          onError:() => setSubmitIdx(-1),
        })
      }
    }, 700)
  }

  const progress = Math.round(((step+1)/HOME_STEPS.length)*100)

  if(submitIdx >= 0 || isPending) return (
    <div className="min-h-screen flex flex-col">
      <Navbar crumb="File a Claim" secondCrumb="Home Insurance" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-[320px]">
          <div className="w-12 h-12 border-4 border-border border-t-green rounded-full animate-spin" />
          <div className="text-base font-bold text-navy">Submitting your claim…</div>
          <div className="flex flex-col gap-2 text-left w-full mt-2">
            {SUBMIT_STEPS.map((s,i) => (
              <div key={i} className={clsx('flex items-center gap-2.5 text-[12.5px] py-1', i<submitIdx?'text-green font-semibold':i===submitIdx?'text-navy font-semibold':'text-muted')}>
                <span>{i<submitIdx?'✅':s.split(' ')[0]}</span><span>{s.split(' ').slice(1).join(' ')}</span>
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
        <Navbar crumb="File a Claim" secondCrumb="Home Insurance" />

        {/* Mobile progress */}
        <div className="md:hidden bg-navy px-4 py-3 border-b border-white/8">
          <div className="flex justify-between text-[11px] text-white/40 mb-1.5"><span>{HOME_STEPS[step].name}</span><span>Step {step+1} of {HOME_STEPS.length}</span></div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-red to-[#FF5577] rounded-full transition-all duration-500" style={{width:`${progress}%`}} /></div>
        </div>

        <div className="flex flex-1">
          <Sidebar step={step} steps={HOME_STEPS} progress={progress} onGoTo={goTo} lob="home" />

          <main className="flex-1 px-4 py-6 md:px-10 md:py-8 max-w-[860px]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className={clsx(dir==='fwd'?'animate-[slideIn_.25s_ease]':'animate-[slideInBack_.25s_ease]')} key={step}>
                {step===0 && <HomeStep1 />}
                {step===1 && <HomeStep2 />}
                {step===2 && <HomeStep3 />}
                {step===3 && <HomeStep4 />}
                {step===4 && <HomeStep5 />}
                {step===5 && <HomeStep6 onGoTo={goTo} />}

                <div className="step-nav">
                  {step===0
                    ? <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>← Back to Home</button>
                    : <button type="button" className="btn btn-ghost" onClick={() => goTo(step-1)}>← Back</button>
                  }
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-faint hidden sm:block">* required</span>
                    {step<5
                      ? <button type="button" className="btn btn-primary" onClick={handleNext}>{HOME_STEPS[step+1].name} →</button>
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

/* ══════════ MODULE-LEVEL STEP COMPONENTS (not inside render) ══════ */

function HomeStep1() {
  const { register, watch, setValue, formState:{errors} } = useFormContext<HomeData>()
  const incType    = watch('incidentType')
  const conditions = watch('conditions')
  const toggle = (c:string) => setValue('conditions', conditions.includes(c) ? conditions.filter(x=>x!==c) : [...conditions,c])
  return (
    <>
      <StepHeader step={0} title="Tell Us What Happened" desc="We're here to help you through this. Share the basics and we'll handle the details." />
      <InfoBox type="neutral" icon="💙">We know property damage is stressful. Our team has handled thousands of storm, fire, and flood claims across Texas.</InfoBox>
      <div className="card">
        <div className="card-title mb-4">What type of damage occurred? <span className="text-red">*</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {HOME_INCIDENT_TYPES.map(t => (
            <div key={t.id} onClick={() => setValue('incidentType', t.id as any)} className={clsx('inc-card', incType===t.id&&'inc-card-on')}>
              {incType===t.id && <span className="absolute top-1.5 right-2 text-[10px] font-black text-red">✓</span>}
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
          <div className="field"><label className="field-label">Date of Incident <span className="text-red">*</span></label><input type="date" {...register('dateOfLoss')} className={clsx('field-input', errors.dateOfLoss&&'border-red')} /></div>
          <div className="field"><label className="field-label">Approximate Time</label><input type="time" {...register('timeOfLoss')} className="field-input" /></div>
          <div className="field sm:col-span-2"><label className="field-label">Property Address <span className="prefill-badge">✓ On file</span></label><input defaultValue="4821 Mockingbird Ln, Dallas, TX 75209" className="field-input prefilled" readOnly /></div>
          <div className="field"><label className="field-label">Safe to occupy?</label><select {...register('safeToOccupy')} className="field-select"><option>Yes — safe to live in</option><option>Partially — some areas unsafe</option><option>No — I've had to leave</option></select></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-4">Describe What Happened</div>
        <div className="field mb-4"><label className="field-label">In your own words <span className="text-red">*</span></label><textarea {...register('description')} className={clsx('field-textarea prefilled', errors.description&&'border-red')} rows={4} /></div>
        <div className="field-label mb-2">Weather / event conditions</div>
        <div className="flex flex-wrap gap-2">{CONDITIONS.map(c => <button key={c} type="button" onClick={() => toggle(c)} className={clsx('chip', conditions.includes(c)&&'chip-on')}>{c}</button>)}</div>
      </div>
      <InfoBox type="red" icon="⚠️">If your home is not safe to occupy, call <strong>1-800-VM-CLAIMS (press 2)</strong> right now. We can authorize hotel tonight.</InfoBox>
    </>
  )
}

function HomeStep2() {
  const { watch, setValue } = useFormContext<HomeData>()
  const damageZones = watch('damageZones')
  const rooms       = watch('rooms')
  const toggleZone  = (z:string) => setValue('damageZones', damageZones.includes(z) ? damageZones.filter(x=>x!==z) : [...damageZones,z])
  const toggleRoom  = (r:string) => setValue('rooms', rooms.includes(r) ? rooms.filter(x=>x!==r) : [...rooms,r])
  return (
    <>
      <StepHeader step={1} title="Your Property & Damage Areas" desc="Confirm your property details and mark where the damage occurred." />
      <InfoBox type="green" icon="✅">Your property details are pre-filled from your policy. Verify, then mark damaged areas.</InfoBox>
      <div className="card">
        <div className="flex items-center justify-between mb-4"><div className="card-title">🏠 Your Property</div><span className="text-[10px] font-bold text-muted bg-bg border border-border px-2 py-px rounded-full">From your policy</span></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {[['Property Type','Single Family Home'],['Year Built','2008'],['Square Footage','2,240 sq ft'],['Roof Type','Asphalt Shingles'],['Construction','Wood Frame'],['Stories','2 stories']].map(([l,v]) => (
            <div key={l} className="field"><label className="field-label">{l} <span className="prefill-badge">✓ On file</span></label><input defaultValue={v} className="field-input prefilled" readOnly /></div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-3">🎯 Exterior Damage Areas</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {DAMAGE_AREAS.map(z => <button key={z} type="button" onClick={() => toggleZone(z)} className={clsx('chip', damageZones.includes(z)&&'chip-on')}>{z}</button>)}
        </div>
        {damageZones.length>0 && <div className="text-[12px] text-slate mt-2">Selected: <span className="text-red font-semibold">{damageZones.join(', ')}</span></div>}
      </div>
      <div className="card">
        <div className="card-title mb-3">🏠 Interior Rooms Affected</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ROOMS.map(([icon,label]) => (
            <div key={label} onClick={() => toggleRoom(label)} className={clsx('border rounded-xl p-3 cursor-pointer text-center transition-all relative', rooms.includes(label)?'border-red bg-red-light':'border-border bg-white hover:border-amber hover:bg-amber-light')}>
              {rooms.includes(label) && <span className="absolute top-1 right-2 text-[9px] font-black text-red">✓</span>}
              <div className="text-[20px] mb-1">{icon}</div>
              <div className="text-[10.5px] font-bold text-navy">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function HomeStep3() {
  return (
    <>
      <StepHeader step={2} title="Photos & Documents" desc="Photos are the most powerful thing you can provide." />
      <InfoBox type="blue" icon="📸"><strong>Best practice:</strong> Photograph before cleaning or making repairs. Wide shots for context, close-ups for damage detail.</InfoBox>
      <div className="card">
        <div className="card-title mb-4">📷 Upload Your Photos</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[['🏠 Exterior & Roof','All sides, roof, gutters'],['🛋️ Interior Rooms','Ceilings, walls, flooring'],['📄 Documents & Receipts','Police report, estimates']].map(([l,s]) => (
            <div key={l}><div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">{l}</div>
              <div className="drop-zone"><span className="text-[22px] opacity-40">📷</span><span className="text-[11.5px] font-semibold text-slate">Tap to upload</span><span className="text-[10.5px] text-faint">{s}</span></div>
            </div>
          ))}
        </div>
        <InfoBox type="amber" icon="⏳" className="mt-4 mb-0">You can upload additional documents at any time after filing — don't delay submitting.</InfoBox>
      </div>
    </>
  )
}

function HomeStep4() {
  return (
    <>
      <StepHeader step={3} title="Your Coverage" desc="Here's exactly what your homeowners policy covers for this type of damage." />
      <div className="card">
        <div className="flex items-center justify-between mb-4"><div className="card-title">🛡️ HO-3 Special Form — Policy #VM-HOME-2024-33891</div></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {COVERAGES.map((c,i) => (
            <div key={i} className={clsx('border rounded-xl p-3.5', c.applies?'border-green-mid bg-green-light':'border-border opacity-55')}>
              <div className="flex items-start justify-between mb-2">
                <div><div className={clsx('text-[9.5px] font-bold uppercase tracking-wide mb-0.5', c.applies?'text-green-500':'text-faint')}>{c.badge}</div><div className={clsx('text-[12px] font-bold', c.applies?'text-[#064E3B]':'text-navy')}>{c.name}</div></div>
                <span className={clsx('text-[9.5px] font-bold px-2 py-px rounded-full ml-2 flex-shrink-0', c.applies?'bg-green text-white':'bg-bg text-faint border border-border')}>{c.applies?'✓':'N/A'}</span>
              </div>
              <div className={clsx('text-[11px]', c.applies?'text-[#065F46]':'text-muted')}>{c.detail}</div>
              <div className={clsx('font-display font-black text-[13px] mt-1.5', c.applies?'text-green-dark':'text-navy')}>{c.amount}</div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-br from-navy to-navy-light rounded-xl p-4 flex items-center justify-between">
          <div><div className="text-[10.5px] text-white/45 mb-1">Wind / Hail Deductible <Tip title="Separate from all-other-perils">Texas wind/hail deductibles are typically 1–2% of dwelling value. Your 1% = $4,250.</Tip></div><div className="font-display font-black text-[28px] text-white">$4,250</div><div className="text-[10.5px] text-white/40 mt-1">1% of $425,000 dwelling coverage</div></div>
          <span className="text-[36px] opacity-30">🌩️</span>
        </div>
      </div>
      <InfoBox type="teal" icon="💡"><strong>Replacement Cost Value (RCV):</strong> Your policy pays what it costs to rebuild at today's prices — not depreciated value. Significant benefit for roofing in a hail claim.</InfoBox>
      <div className="card">
        <div className="card-title mb-3">📊 Preliminary Estimate</div>
        <InfoBox type="green" icon="🔍">Based on description + NOAA storm data: <strong>$18,400–$24,600</strong>. Confirmed after inspection.</InfoBox>
        <div className="grid grid-cols-3 gap-3">
          {[['Roof Repair','$12K–$16K','Shingles, flashing'],['Windows & Exterior','$4K–$6K','2 windows, gutters, HVAC'],['Interior / Ceiling','$2K–$3K','Master bedroom stain']].map(([l,v,s]) => (
            <div key={l} className="bg-bg border border-border rounded-xl p-3.5 text-center"><div className="text-[10.5px] font-bold uppercase tracking-wider text-muted mb-1">{l}</div><div className="font-display font-black text-[18px] text-navy">{v}</div><div className="text-[10.5px] text-faint mt-1">{s}</div></div>
          ))}
        </div>
      </div>
    </>
  )
}

function HomeStep5() {
  const { watch, setValue } = useFormContext<HomeData>()
  const selCont    = watch('selectedContractor')
  const inspection = watch('inspectionMethod')
  const aleEnabled = watch('aleEnabled')
  return (
    <>
      <StepHeader step={4} title="Repair & Temporary Housing" desc="Choose your contractor and set up ALE if your home is not safe to stay in." />
      <InfoBox type="green" icon="⚡">Based on your description, your home appears livable. ALE hotel authorization can be issued <strong>within 2 hours</strong> if that changes.</InfoBox>
      <div className="card">
        <div className="card-title mb-4">🔨 Choose Your Contractor</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CONTRACTORS.map((c,i) => (
            <div key={i} onClick={() => setValue('selectedContractor',i)}
              className={clsx('border rounded-xl p-3.5 cursor-pointer transition-all relative', selCont===i?'border-red bg-red-light ring-2 ring-red/10':'border-border bg-white hover:border-red/40 hover:bg-red-light/50')}>
              <span className={clsx('absolute top-2 right-2 text-[9.5px] font-bold px-1.5 py-px rounded-full', c.tag==='Partner'?'bg-navy text-white':'bg-amber-light text-amber border border-amber/30')}>{c.tag}</span>
              <div className="text-[12.5px] font-bold text-navy pr-14 mb-1">{c.name}</div>
              <div className="text-[11px] text-muted mb-2">{c.addr}</div>
              <div className="text-[10.5px] text-slate">{c.meta}</div>
              <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] mt-2.5', selCont===i?'bg-red border-red text-white':'border-border')}>✓</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-title mb-4">🔍 Inspection Method</div>
        {[{id:'virtual',label:'📱 Photo & Virtual Review',tag:'Recommended',sub:'Estimate within 24 hours'},{id:'onsite',label:'🏠 In-Person Adjuster',tag:'',sub:'Within 48–72 hours'},{id:'joint',label:'🔨 Contractor-Assisted',tag:'',sub:'Most thorough for complex damage'}].map(opt => (
          <div key={opt.id} onClick={() => setValue('inspectionMethod',opt.id as any)} className="flex items-center justify-between p-3.5 border border-border rounded-xl mb-2 cursor-pointer hover:bg-red-light/50 transition-all">
            <div><div className="text-[12.5px] font-semibold text-navy">{opt.label}{opt.tag&&<span className="ml-2 text-[10px] bg-green-light text-green border border-green-mid px-2 py-px rounded-full font-bold">{opt.tag}</span>}</div><div className="text-[11px] text-muted mt-px">{opt.sub}</div></div>
            <div className={clsx('toggle', inspection===opt.id?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', inspection===opt.id?'left-[22px]':'left-[3px]')} /></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title mb-3">🏨 Additional Living Expenses (ALE) <Tip title="Coverage D">Hotel, meals above budget, laundry, pet boarding. Available immediately upon adjuster approval.</Tip></div>
        <InfoBox type="blue" icon="🏨">Policy covers up to <strong>$85,000 / 24 months</strong> if your home is uninhabitable. Marriott/Hilton preferred partners with direct billing.</InfoBox>
        <div onClick={() => setValue('aleEnabled',!aleEnabled)} className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-red-light/50 transition-all">
          <div><div className="text-[12.5px] font-semibold text-navy">Activate ALE — My home is not safe to occupy</div><div className="text-[11px] text-muted">Hotel authorization within 2 hours</div></div>
          <div className={clsx('toggle', aleEnabled?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', aleEnabled?'left-[22px]':'left-[3px]')} /></div>
        </div>
        {aleEnabled && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[['Hotel / Night','Up to $175'],['Meals','$60/day above budget'],['Duration','24 months'],['Billing','Direct to hotel']].map(([l,v]) => (
              <div key={l} className="bg-bg border border-border rounded-xl p-3"><div className="text-[10.5px] font-bold uppercase tracking-wider text-muted mb-1">{l}</div><div className="text-[13px] font-bold text-navy">{v}</div></div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function HomeStep6({ onGoTo }: { onGoTo:(n:number)=>void }) {
  const { register, watch, formState:{errors} } = useFormContext<HomeData>()
  const incType    = watch('incidentType')
  const dateOfLoss = watch('dateOfLoss')
  const damageZones= watch('damageZones')
  const selCont    = watch('selectedContractor')
  const inspection = watch('inspectionMethod')
  const aleEnabled = watch('aleEnabled')
  return (
    <>
      <StepHeader step={5} title="Review & Submit" desc="Your property adjuster is assigned within 2 hours of submitting." />
      <InfoBox type="green" icon="✅">Everything looks complete! You'll receive an immediate confirmation with your claim number.</InfoBox>
      <div className="card">
        {[
          { title:'What Happened', step:0, rows:[['Incident',HOME_INCIDENT_TYPES.find(t=>t.id===incType)?.label??incType],['Date',dateOfLoss],['Property','4821 Mockingbird Ln, Dallas TX'],['Safe to Occupy','Yes — minor damage only','ok']] },
          { title:'Damage Areas',  step:1, rows:[['Exterior',damageZones.join(', ')||'None marked'],['Rooms','Master Bedroom']] },
          { title:'Coverage',      step:3, rows:[['Policy','HO-3 · #VM-HOME-2024-33891'],['Deductible','$4,250 (1% wind/hail)'],['Est. Damage','$18,400–$24,600']] },
          { title:'Contractor',    step:4, rows:[['Contractor',CONTRACTORS[selCont]?.name??'—','ok'],['Inspection',inspection==='virtual'?'📱 Photo review (24hr)':'🏠 In-Person'],['ALE',aleEnabled?'Activated':'Not required','ok']] },
        ].map((s,si) => (
          <div key={si} className={clsx(si>0&&'mt-4 pt-4 border-t border-border')}>
            <div className="flex items-center justify-between text-[12px] font-bold text-navy pb-2 border-b-2 border-red mb-2.5">
              {s.title}<button type="button" onClick={() => onGoTo(s.step)} className="text-[11px] font-bold text-red bg-transparent border-none cursor-pointer">✏️ Edit</button>
            </div>
            {s.rows.map(([k,v,style]) => (
              <div key={String(k)} className="flex gap-3.5 py-1.5 border-b border-bg last:border-none">
                <div className="text-[12px] text-muted w-32 flex-shrink-0">{k}</div>
                <div className={clsx('text-[12px] font-semibold', style==='ok'?'text-green':'text-navy')}>{v}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-title mb-4">📋 Certifications</div>
        {(['certAccuracy','certAuthorize','certConsent'] as const).map((name,i) => (
          <label key={name} className="flex gap-3 items-start cursor-pointer text-[12px] text-slate leading-relaxed mb-3">
            <input type="checkbox" {...register(name)} style={{accentColor:'#C8102E',width:14,height:14,flexShrink:0,marginTop:2}} />
            {['I confirm all information is accurate. Providing false information may void my coverage.','I authorize ValueMomentum and my adjuster to inspect my property and process this claim.','I consent to receive claim updates by text and email.'][i]}
            {errors[name] && <span className="err-msg">{errors[name]?.message as string}</span>}
          </label>
        ))}
        <InfoBox type="green" icon="🚀" className="mb-0">The moment you submit — your claim is logged, {CONTRACTORS[0].name} is notified, and a property adjuster is assigned.</InfoBox>
      </div>
    </>
  )
}
