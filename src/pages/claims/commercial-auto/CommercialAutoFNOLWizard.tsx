import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clsx } from 'clsx'
import { z } from 'zod'

const CommercialAutoFNOLSchema = z.object({
  incidentType:    z.enum(['collision','rollover','cargo-spill','theft','vandalism','fire','weather','hitrun','backing','other']),
  dateOfLoss:      z.string().min(1, 'Date is required'),
  timeOfLoss:      z.string().optional().default(''),
  location:        z.string().min(5, 'Location is required'),
  description:     z.string().min(20, 'Please describe what happened (20+ characters)'),
  conditions:      z.array(z.string()).default([]),
  policeReport:    z.string().default('Yes — filed at scene'),
  policeNumber:    z.string().optional().default(''),
  injuries:        z.string().default('No injuries'),
  fatalitiesCount: z.number().default(0),
  roadType:        z.string().default('Interstate / Highway'),
  companyName:     z.string().min(1, 'Company name is required'),
  usdotNumber:     z.string().optional().default(''),
  mcNumber:        z.string().optional().default(''),
  unitNumber:      z.string().min(1, 'Unit number is required'),
  vehicleYear:     z.string().default(''),
  vehicleMake:     z.string().default(''),
  vehicleModel:    z.string().default(''),
  vehicleType:     z.string().default('Semi-Truck / Tractor'),
  vin:             z.string().optional().default(''),
  plate:           z.string().optional().default(''),
  gvwr:            z.string().optional().default(''),
  driverName:      z.string().min(1, 'Driver name is required'),
  driverPhone:     z.string().optional().default(''),
  driverLicense:   z.string().optional().default(''),
  cdlClass:        z.string().default('Class A'),
  hosCompliant:    z.string().default('Yes — within HOS limits'),
  driverAtFault:   z.string().default('Under investigation'),
  priorIncidents:  z.string().default('None in past 3 years'),
  dashcamAvailable:    z.boolean().default(false),
  telematicsAvailable: z.boolean().default(false),
  otherVehicles:   z.array(z.object({ name:z.string(), phone:z.string(), vehicle:z.string(), plate:z.string(), insurer:z.string(), policy:z.string() })).default([]),
  propertyDamage:  z.boolean().default(false),
  propertyDesc:    z.string().optional().default(''),
  cargoInvolved:   z.boolean().default(false),
  cargoType:       z.string().optional().default(''),
  cargoWeight:     z.string().optional().default(''),
  cargoValue:      z.string().optional().default(''),
  hazmatInvolved:  z.boolean().default(false),
  hazmatClass:     z.string().optional().default(''),
  hazmatPlacard:   z.string().optional().default(''),
  spillOccurred:   z.boolean().default(false),
  regulatoryNotified: z.boolean().default(false),
  drivable:            z.boolean().default(false),
  towingNeeded:        z.boolean().default(true),
  towingDestination:   z.string().optional().default(''),
  selectedShopIndex:   z.number().default(0),
  inspectionMethod:    z.enum(['mobile','shop','virtual']).default('mobile'),
  rentalUnitNeeded:    z.boolean().default(true),
  rentalUnitType:      z.string().default('Same class as damaged unit'),
  certAccuracy:   z.boolean().refine(v => v === true, { message: 'Certification required' }),
  certAuthorize:  z.boolean().refine(v => v === true, { message: 'Authorization required'  }),
  certConsent:    z.boolean().refine(v => v === true, { message: 'Consent required'        }),
})

type CommercialAutoFNOLData = z.infer<typeof CommercialAutoFNOLSchema>

const CA_STEP_FIELDS: Record<number, (keyof CommercialAutoFNOLData)[]> = {
  0: ['incidentType', 'dateOfLoss', 'location', 'description'],
  1: ['companyName', 'unitNumber', 'driverName'],
  2: [], 3: [], 4: ['selectedShopIndex'],
  5: ['certAccuracy', 'certAuthorize', 'certConsent'],
}
import { useFNOL } from '@/lib/api/hooks/useFNOL'
import Navbar   from '@/components/layout/Navbar'
import InfoBox  from '@/components/ui/InfoBox'
import Tip      from '@/components/ui/Tip'
import { Sidebar, StepHeader } from '@/pages/claims/auto/FNOLWizard'

/* ── Constants ────────────────────────────────────────────────── */
const STEPS = [
  { name:'Incident Details',    sub:'Type, date, location, description'  },
  { name:'Vehicle & Driver',    sub:'Fleet unit, driver info, HOS'       },
  { name:'Other Parties & Cargo', sub:'Involved parties, cargo, hazmat' },
  { name:'Photos & Documents',  sub:'Scene, vehicle, cargo, dashcam'     },
  { name:'Coverage & Repair',   sub:'Fleet shop, inspection, rental unit'},
  { name:'Review & Submit',     sub:'Confirm and file'                   },
]

const INCIDENT_TYPES = [
  { id:'collision',    icon:'💥', label:'Collision',          sub:'Vehicle-to-vehicle impact'     },
  { id:'rollover',     icon:'🔄', label:'Rollover',           sub:'Vehicle rolled or overturned'  },
  { id:'cargo-spill',  icon:'📦', label:'Cargo Spill',        sub:'Load shifted or spilled'       },
  { id:'theft',        icon:'🔓', label:'Vehicle Theft',      sub:'Unit stolen or broken into'    },
  { id:'vandalism',    icon:'🔨', label:'Vandalism',          sub:'Intentional damage'            },
  { id:'fire',         icon:'🔥', label:'Fire',               sub:'Vehicle or cargo fire'         },
  { id:'weather',      icon:'🌧️', label:'Weather',            sub:'Wind, ice, flood, hail'        },
  { id:'hitrun',       icon:'🏃', label:'Hit & Run',          sub:'Other vehicle fled scene'      },
  { id:'backing',      icon:'⬅️', label:'Backing Incident',   sub:'Backing into object or person' },
  { id:'other',        icon:'❓', label:'Other',              sub:'Describe below'                },
] as const

const VEHICLE_TYPES = [
  'Semi-Truck / Tractor', 'Box Truck (Straight)', 'Flatbed',
  'Tanker', 'Refrigerated (Reefer)', 'Dump Truck', 'Crane / Boom',
  'Pickup Truck (Commercial)', 'Cargo Van', 'Bus / Shuttle', 'Other',
]

const CONDITIONS = [
  '☀️ Clear/Dry', '🌧️ Rain/Wet', '🌫️ Fog/Low Visibility', '❄️ Snow/Ice',
  '🌬️ High Winds', '🌆 Night/Dark', '🚧 Construction Zone', '🛣️ Interstate/Highway',
]

const FLEET_SHOPS = [
  { name:'Freightliner Truck Center — Dallas',    addr:'8700 N Stemmons Fwy, Dallas TX 75247',  meta:'⭐ 4.8 · 24/7 Commercial · Fleet Priority · Warranty', tag:'Fleet Partner'  },
  { name:'Rush Truck Centers — Fort Worth',       addr:'14001 Trinity Blvd, Fort Worth TX 76040',meta:'⭐ 4.7 · Same-day mobile available · All makes/models',  tag:'Fleet Partner'  },
  { name:'Peterbilt of Dallas',                   addr:'1102 E Highway 80, Mesquite TX 75149',   meta:'⭐ 4.6 · OEM Parts · DOT compliance repairs',           tag:'Certified'      },
]

const HAZMAT_CLASSES = [
  'Class 1 — Explosives', 'Class 2 — Gases', 'Class 3 — Flammable Liquids',
  'Class 4 — Flammable Solids', 'Class 5 — Oxidizers/Peroxides',
  'Class 6 — Toxic / Infectious', 'Class 7 — Radioactive',
  'Class 8 — Corrosives', 'Class 9 — Miscellaneous',
]

const SUBMIT_STEPS = [
  { icon:'🔒', text:'Securing transmission…'           },
  { icon:'📋', text:'Recording commercial claim…'      },
  { icon:'🛡️', text:'Verifying fleet coverage…'        },
  { icon:'🚛', text:'Assigning commercial adjuster…'   },
  { icon:'🔧', text:'Alerting fleet repair partner…'   },
  { icon:'📧', text:'Sending confirmation…'            },
]

const DEFAULTS: Partial<CommercialAutoFNOLData> = {
  incidentType:'collision', dateOfLoss: new Date().toISOString().split('T')[0], timeOfLoss:'',
  location:'', description:'', conditions:[], policeReport:'Yes — filed at scene',
  injuries:'No injuries', fatalitiesCount:0, roadType:'Interstate / Highway',
  companyName:'', usdotNumber:'', mcNumber:'', unitNumber:'', vehicleType:'Semi-Truck / Tractor',
  vehicleYear:'', vehicleMake:'', vehicleModel:'', cdlClass:'Class A',
  hosCompliant:'Yes — within HOS limits', driverAtFault:'Under investigation',
  priorIncidents:'None in past 3 years', dashcamAvailable:false, telematicsAvailable:false,
  otherVehicles:[], propertyDamage:false, cargoInvolved:false, hazmatInvolved:false,
  spillOccurred:false, regulatoryNotified:false,
  drivable:false, towingNeeded:true, selectedShopIndex:0, inspectionMethod:'mobile',
  rentalUnitNeeded:true, rentalUnitType:'Same class as damaged unit',
  certAccuracy:true, certAuthorize:true, certConsent:true,
}

/* ════════════════ MAIN COMPONENT ══════════════════════════════ */
export default function CommercialAutoFNOLWizard() {
  const navigate             = useNavigate()
  const [step, setStep]      = useState(0)
  const [direction, setDir]  = useState<'fwd'|'back'>('fwd')
  const [conditions, setConds] = useState<string[]>([])
  const [submitIdx, setIdx]  = useState(-1)
  const [photos, setPhotos]  = useState<Record<string,string[]>>({ scene:[], vehicle:[], cargo:[], doc:[] })
  const fileRefs = {
    scene:   useRef<HTMLInputElement>(null),
    vehicle: useRef<HTMLInputElement>(null),
    cargo:   useRef<HTMLInputElement>(null),
    doc:     useRef<HTMLInputElement>(null),
  }

  const methods = useForm<CommercialAutoFNOLData>({
    resolver: zodResolver(CommercialAutoFNOLSchema),
    defaultValues: DEFAULTS as CommercialAutoFNOLData,
    mode: 'onBlur',
  })
  const { handleSubmit, trigger, formState: { isSubmitting } } = methods
  const { mutate: submitFNOL, isPending } = useFNOL()

  const goTo = (n: number) => {
    setDir(n > step ? 'fwd' : 'back')
    setStep(n)
    window.scrollTo({ top:0, behavior:'smooth' })
  }
  const handleNext = async () => {
    const ok = await trigger(CA_STEP_FIELDS[step] as any)
    if (ok) goTo(step + 1)
  }
  const toggleCond = (c: string) =>
    setConds(prev => prev.includes(c) ? prev.filter(x=>x!==c) : [...prev,c])

  const handleFiles = (zone: string, files: FileList | null) => {
    if (!files) return
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    setPhotos(p => ({ ...p, [zone]: [...p[zone], ...urls] }))
  }

  const onSubmit = (data: CommercialAutoFNOLData) => {
    let i = 0; setIdx(0)
    const t = setInterval(() => {
      setIdx(++i)
      if (i >= SUBMIT_STEPS.length) {
        clearInterval(t)
        submitFNOL({ ...data, lob:'commercial-auto' } as any, {
          onSuccess: (res) => navigate(`/claims/commercial-auto/${res.claimId}/status`),
          onError:   () => setIdx(-1),
        })
      }
    }, 700)
  }

  const progress = Math.round(((step+1)/STEPS.length)*100)
  const totalPhotos = Object.values(photos).reduce((s,a) => s+a.length, 0)

  /* Submitting overlay */
  if (submitIdx >= 0 || isPending) return (
    <div className="min-h-screen flex flex-col">
      <Navbar crumb="Commercial Auto Claim" secondCrumb="Commercial Lines" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-[340px]">
          <div className="w-12 h-12 border-4 border-border border-t-green rounded-full animate-spin" />
          <div className="text-base font-bold text-navy">Submitting your commercial claim…</div>
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
        <Navbar crumb="File a Claim" secondCrumb="Commercial Auto" />

        {/* Mobile progress */}
        <div className="md:hidden bg-navy px-4 py-3 border-b border-white/8">
          <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
            <span>{STEPS[step].name}</span><span>Step {step+1} of {STEPS.length}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red to-[#FF5577] rounded-full transition-all duration-500"
              style={{ width:`${progress}%` }} />
          </div>
        </div>

        <div className="flex flex-1">
          <Sidebar step={step} steps={STEPS} progress={progress} onGoTo={goTo} lob="auto" />

          <main className="flex-1 px-4 py-6 md:px-10 md:py-8 max-w-[860px]">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div key={step}>
                {step===0 && <CAStep1 conditions={conditions} onToggle={toggleCond} />}
                {step===1 && <CAStep2 />}
                {step===2 && <CAStep3 />}
                {step===3 && <CAStep4 photos={photos} fileRefs={fileRefs} onFiles={handleFiles} totalPhotos={totalPhotos} />}
                {step===4 && <CAStep5 />}
                {step===5 && <CAStep6 onGoTo={goTo} />}

                <div className="step-nav">
                  {step===0
                    ? <button type="button" className="btn btn-ghost" onClick={() => navigate('/file-claim')}>Back to Coverage</button>
                    : <button type="button" className="btn btn-ghost" onClick={() => goTo(step-1)}>Back</button>
                  }
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-faint hidden sm:block">* required</span>
                    {step < 5
                      ? <button type="button" className="btn btn-primary" onClick={handleNext}>{STEPS[step+1].name} →</button>
                      : <button type="submit" className="btn btn-green px-7 py-3 text-[13.5px]"
                          disabled={isSubmitting||isPending}>Submit Commercial Claim →</button>
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

/* ════════════════ MODULE-LEVEL STEP COMPONENTS ══════════════════ */

/* ── Step 1: Incident Details ─────────────────────────────────── */
function CAStep1({ conditions, onToggle }: { conditions:string[]; onToggle:(c:string)=>void }) {
  const { register, watch, setValue, formState:{ errors } } = useFormContext<CommercialAutoFNOLData>()
  const incType = watch('incidentType')

  return (
    <>
      <StepHeader step={0} title="Tell Us What Happened" desc="Describe the commercial vehicle incident. Be as specific as possible — our commercial adjusters need detail to process your claim quickly." />
      <InfoBox type="red" icon="🚨">
        If this incident involved <strong>injuries, fatalities, hazardous materials, or a vehicle crossing a median</strong>, call <strong>1-800-VM-CLAIMS (press 1)</strong> immediately. A senior commercial adjuster is standing by 24/7.
      </InfoBox>

      <div className="card">
        <div className="card-title mb-4">Incident Type <span className="text-red">*</span></div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {INCIDENT_TYPES.map(t => (
            <div key={t.id} onClick={() => setValue('incidentType', t.id as any)}
              className={clsx('inc-card', incType===t.id && 'inc-card-on')}>
              {incType===t.id && <span className="absolute top-1.5 right-2 text-[10px] font-black text-red">✓</span>}
              <div className="text-[20px] mb-1.5">{t.icon}</div>
              <div className="text-[11px] font-bold text-navy">{t.label}</div>
              <div className="text-[10px] text-muted mt-0.5 leading-tight">{t.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title mb-4">When, Where & Road Type</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field">
            <label className="field-label">Date of Incident <span className="text-red">*</span></label>
            <input type="date" {...register('dateOfLoss')} className={clsx('field-input', errors.dateOfLoss && 'border-red')} />
          </div>
          <div className="field">
            <label className="field-label">Time of Incident <Tip title="Check ELD/telematics logs">Electronic logs can pinpoint exact time if driver is unsure.</Tip></label>
            <input type="time" {...register('timeOfLoss')} className="field-input" />
          </div>
          <div className="field sm:col-span-2">
            <label className="field-label">Exact Location <span className="text-red">*</span></label>
            <input {...register('location')} placeholder="Mile marker, exit, cross street, city, state" className={clsx('field-input', errors.location && 'border-red')} />
            <span className="field-hint">Include mile marker or GPS coordinates if available</span>
          </div>
          <div className="field">
            <label className="field-label">Road / Area Type</label>
            <select {...register('roadType')} className="field-select">
              {['Interstate / Highway','State Highway','City Street','Parking Lot / Yard','Customer Property','Loading Dock / Warehouse','Off-Road / Construction Site'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Injuries?</label>
            <select {...register('injuries')} className="field-select">
              <option>No injuries</option>
              <option>Minor — treated at scene</option>
              <option>Injuries requiring medical attention</option>
              <option>Serious / hospitalized</option>
              <option>Fatality</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title mb-4">Description & Conditions</div>
        <div className="field mb-4">
          <label className="field-label">Describe what happened <span className="text-red">*</span></label>
          <textarea {...register('description')} rows={5}
            placeholder="Describe the sequence of events leading up to and including the incident. Include what the driver was doing, what happened, and what was damaged."
            className={clsx('field-textarea', errors.description && 'border-red')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
          <div className="field">
            <label className="field-label">Police / Law Enforcement?</label>
            <select {...register('policeReport')} className="field-select">
              <option>Yes — filed at scene</option>
              <option>Yes — filed after incident</option>
              <option>DOT / FMCSA involved</option>
              <option>No</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Report / Incident Number</label>
            <input {...register('policeNumber')} placeholder="Police or DOT report number" className="field-input" />
          </div>
        </div>
        <div className="field-label mb-2">Road & weather conditions at time of incident</div>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => (
            <button key={c} type="button" onClick={() => onToggle(c)}
              className={clsx('chip', conditions.includes(c) && 'chip-on')}>{c}</button>
          ))}
        </div>
      </div>
    </>
  )
}

/* ── Step 2: Fleet Vehicle & Driver ───────────────────────────── */
function CAStep2() {
  const { register, watch, setValue } = useFormContext<CommercialAutoFNOLData>()
  const dashcam = watch('dashcamAvailable')
  const telematics = watch('telematicsAvailable')

  return (
    <>
      <StepHeader step={1} title="Fleet Vehicle & Driver" desc="Provide details about the commercial vehicle involved and the driver at the time of the incident." />
      <InfoBox type="blue" icon="🔍">
        Driver hours of service (HOS) records, ELD logs, and dashcam footage are critical for commercial claims. Preserve all data immediately.
      </InfoBox>

      <div className="card">
        <div className="card-title mb-4">Company & DOT Information</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field sm:col-span-2">
            <label className="field-label">Company / Fleet Name <span className="text-red">*</span></label>
            <input {...register('companyName')} placeholder="ABC Logistics LLC" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">USDOT Number <Tip title="Found on vehicle door or registration">Required for carriers operating in interstate commerce.</Tip></label>
            <input {...register('usdotNumber')} placeholder="USDOT 1234567" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">MC Number (if applicable)</label>
            <input {...register('mcNumber')} placeholder="MC-987654" className="field-input" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title mb-4">Commercial Vehicle (Fleet Unit)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field">
            <label className="field-label">Fleet Unit Number <span className="text-red">*</span></label>
            <input {...register('unitNumber')} placeholder="Unit #1042" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Vehicle Type</label>
            <select {...register('vehicleType')} className="field-select">
              {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Year</label>
            <input {...register('vehicleYear')} placeholder="2022" maxLength={4} className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Make</label>
            <input {...register('vehicleMake')} placeholder="Freightliner, Peterbilt, Kenworth…" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Model</label>
            <input {...register('vehicleModel')} placeholder="Cascadia, 579, T680…" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">GVWR <Tip title="Gross Vehicle Weight Rating">Found on the vehicle door placard or registration. Used to determine regulatory thresholds.</Tip></label>
            <input {...register('gvwr')} placeholder="80,000 lbs" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">VIN</label>
            <input {...register('vin')} placeholder="1FUJGEDV9CLBP7210" maxLength={17} className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">License Plate</label>
            <input {...register('plate')} placeholder="TX ABC-1234" className="field-input" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title mb-4">Driver Information</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field sm:col-span-2">
            <label className="field-label">Driver Full Name <span className="text-red">*</span></label>
            <input {...register('driverName')} placeholder="Full legal name" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Driver Phone</label>
            <input type="tel" {...register('driverPhone')} placeholder="(214) 555-0100" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">CDL Number</label>
            <input {...register('driverLicense')} placeholder="State CDL number" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">CDL Class <Tip title="Class A covers combination vehicles over 26,001 lbs">Class A is required for most semi-trucks. Class B covers straight trucks and buses.</Tip></label>
            <select {...register('cdlClass')} className="field-select">
              <option>Class A</option><option>Class B</option><option>Class C</option><option>Non-CDL</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Prior Incidents (3 years)</label>
            <select {...register('priorIncidents')} className="field-select">
              <option>None in past 3 years</option>
              <option>1 minor incident</option>
              <option>2+ incidents</option>
              <option>At-fault accident on record</option>
            </select>
          </div>
          <div className="field sm:col-span-2">
            <label className="field-label">HOS Compliance at Time of Incident <Tip title="Hours of Service">Federal Motor Carrier Safety Administration (FMCSA) limits driving time. An adjuster will request ELD logs.</Tip></label>
            <select {...register('hosCompliant')} className="field-select">
              <option>Yes — within HOS limits</option>
              <option>Under review — logs being pulled</option>
              <option>Possible violation — under investigation</option>
              <option>Not applicable (short-haul exemption)</option>
            </select>
          </div>
          <div className="field">
            <label className="field-label">Fault Assessment</label>
            <select {...register('driverAtFault')} className="field-select">
              <option>Under investigation</option>
              <option>Other party at fault</option>
              <option>Shared responsibility</option>
              <option>Our driver at fault</option>
              <option>Weather / road conditions</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title mb-3">Electronic Evidence Available</div>
        <p className="text-[12.5px] text-muted mb-3">Preserve all electronic data immediately. Do not overwrite or reset devices.</p>
        <div className="flex flex-col gap-2">
          <div onClick={() => setValue('dashcamAvailable', !dashcam)}
            className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-bg transition-all">
            <div>
              <div className="text-[13px] font-semibold text-navy">Dashcam footage available</div>
              <div className="text-[11.5px] text-muted">Front or rear dashcam video of the incident</div>
            </div>
            <div className={clsx('toggle', dashcam?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', dashcam?'left-[22px]':'left-[3px]')} /></div>
          </div>
          <div onClick={() => setValue('telematicsAvailable', !telematics)}
            className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-bg transition-all">
            <div>
              <div className="text-[13px] font-semibold text-navy">Telematics / ELD data available</div>
              <div className="text-[11.5px] text-muted">GPS track, speed, braking, engine data at time of incident</div>
            </div>
            <div className={clsx('toggle', telematics?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', telematics?'left-[22px]':'left-[3px]')} /></div>
          </div>
        </div>
        {(dashcam || telematics) && (
          <InfoBox type="green" icon="✅" className="mt-3 mb-0">
            Our commercial adjuster will contact you within 2 hours to arrange secure data transfer. Do not reset or clear devices.
          </InfoBox>
        )}
      </div>
    </>
  )
}

/* ── Step 3: Other Parties & Cargo ────────────────────────────── */
function CAStep3() {
  const { register, watch, setValue } = useFormContext<CommercialAutoFNOLData>()
  const cargoInvolved  = watch('cargoInvolved')
  const hazmatInvolved = watch('hazmatInvolved')
  const spillOccurred  = watch('spillOccurred')
  const propertyDamage = watch('propertyDamage')

  return (
    <>
      <StepHeader step={2} title="Other Parties & Cargo" desc="Provide information about other vehicles involved and any cargo that was being transported." />

      {hazmatInvolved && (
        <InfoBox type="red" icon="🚨">
          <strong>Hazmat incident — mandatory reporting.</strong> FMCSA requires immediate notification for hazmat releases. If you have not already called 1-800-VM-CLAIMS, do so now. Our hazmat response coordinator is standing by.
        </InfoBox>
      )}

      <div className="card">
        <div className="card-title mb-4">Other Vehicles Involved</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="field">
            <label className="field-label">Other Driver Name</label>
            <input placeholder="Full legal name" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Other Driver Phone</label>
            <input type="tel" placeholder="(214) 555-0100" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Other Vehicle (Year / Make / Model)</label>
            <input placeholder="2020 Toyota Camry" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Other Vehicle License Plate</label>
            <input placeholder="ABC-1234 TX" className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Other Party Insurance</label>
            <input placeholder="Allstate, State Farm, etc." className="field-input" />
          </div>
          <div className="field">
            <label className="field-label">Other Policy Number</label>
            <input placeholder="Policy number if available" className="field-input" />
          </div>
        </div>
        <button type="button" className="mt-3 text-[12.5px] font-bold text-red bg-transparent border-none cursor-pointer">
          + Add another vehicle
        </button>
      </div>

      <div className="card">
        <div className="card-title mb-3">Property Damage (non-vehicle)</div>
        <div onClick={() => setValue('propertyDamage', !propertyDamage)}
          className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-bg transition-all mb-3">
          <div>
            <div className="text-[13px] font-semibold text-navy">Non-vehicle property was damaged</div>
            <div className="text-[11.5px] text-muted">Guardrail, sign, building, fence, infrastructure, etc.</div>
          </div>
          <div className={clsx('toggle', propertyDamage?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', propertyDamage?'left-[22px]':'left-[3px]')} /></div>
        </div>
        {propertyDamage && (
          <div className="field">
            <label className="field-label">Describe the property damage</label>
            <textarea {...register('propertyDesc')} rows={2} placeholder="Describe what property was damaged and the apparent extent of damage" className="field-textarea" />
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title mb-3">Cargo Information <Tip title="Why this matters">Cargo damage is a separate coverage. Accurate cargo details allow us to involve the right adjusters immediately.</Tip></div>
        <div onClick={() => setValue('cargoInvolved', !cargoInvolved)}
          className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-bg transition-all mb-3">
          <div>
            <div className="text-[13px] font-semibold text-navy">Vehicle was carrying cargo at time of incident</div>
            <div className="text-[11.5px] text-muted">Freight, goods, materials, or equipment</div>
          </div>
          <div className={clsx('toggle', cargoInvolved?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', cargoInvolved?'left-[22px]':'left-[3px]')} /></div>
        </div>
        {cargoInvolved && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3">
            <div className="field">
              <label className="field-label">Cargo Type / Commodity</label>
              <input {...register('cargoType')} placeholder="Electronics, food, machinery…" className="field-input" />
            </div>
            <div className="field">
              <label className="field-label">Cargo Weight (lbs)</label>
              <input {...register('cargoWeight')} placeholder="42,000" className="field-input" />
            </div>
            <div className="field">
              <label className="field-label">Declared Cargo Value</label>
              <input {...register('cargoValue')} placeholder="$185,000" className="field-input" />
            </div>
          </div>
        )}

        <div onClick={() => setValue('hazmatInvolved', !hazmatInvolved)}
          className={clsx('flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all mb-3',
            hazmatInvolved ? 'border-red bg-red-light' : 'border-border hover:bg-bg')}>
          <div>
            <div className="text-[13px] font-semibold text-navy flex items-center gap-2">
              Hazardous materials (HAZMAT) involved
              {hazmatInvolved && <span className="text-[10px] bg-red text-white px-2 py-px rounded-full font-bold">Mandatory Reporting</span>}
            </div>
            <div className="text-[11.5px] text-muted">Vehicle was carrying placarded hazmat materials</div>
          </div>
          <div className={clsx('toggle', hazmatInvolved?'toggle-on bg-red':'toggle-off')}><span className={clsx('toggle-knob', hazmatInvolved?'left-[22px]':'left-[3px]')} /></div>
        </div>

        {hazmatInvolved && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3">
            <div className="field">
              <label className="field-label">Hazmat Class</label>
              <select {...register('hazmatClass')} className="field-select">
                {HAZMAT_CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label">UN Placard Number</label>
              <input {...register('hazmatPlacard')} placeholder="UN1203, UN1993…" className="field-input" />
            </div>
            <div className="field">
              <label className="field-label">Spill / Release occurred?</label>
              <div onClick={() => setValue('spillOccurred', !spillOccurred)}
                className={clsx('flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all',
                  spillOccurred ? 'border-red bg-red-light' : 'border-border hover:bg-bg')}>
                <span className="text-[13px] font-semibold text-navy">{spillOccurred ? 'Yes — spill or release occurred' : 'No release'}</span>
                <div className={clsx('toggle', spillOccurred?'toggle-on bg-red':'toggle-off')}><span className={clsx('toggle-knob', spillOccurred?'left-[22px]':'left-[3px]')} /></div>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Authorities / CHEMTREC notified?</label>
              <div onClick={() => setValue('regulatoryNotified', !watch('regulatoryNotified'))}
                className="flex items-center justify-between p-3 border border-border rounded-xl cursor-pointer hover:bg-bg transition-all">
                <span className="text-[13px] font-semibold text-navy">{watch('regulatoryNotified') ? 'Yes — authorities notified' : 'Not yet'}</span>
                <div className={clsx('toggle', watch('regulatoryNotified')?'toggle-on':'toggle-off')}><span className={clsx('toggle-knob', watch('regulatoryNotified')?'left-[22px]':'left-[3px]')} /></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ── Step 4: Photos & Documents ────────────────────────────────── */
function CAStep4({ photos, fileRefs, onFiles, totalPhotos }: {
  photos: Record<string,string[]>
  fileRefs: Record<string, React.RefObject<HTMLInputElement>>
  onFiles: (zone:string, files:FileList|null) => void
  totalPhotos: number
}) {
  const ZONES = [
    { id:'scene',   icon:'📍', label:'Accident Scene', sub:'Wide shots, skid marks, road conditions, surroundings' },
    { id:'vehicle', icon:'🚛', label:'Commercial Vehicle', sub:'All sides, damage close-ups, unit number plate' },
    { id:'cargo',   icon:'📦', label:'Cargo & Load', sub:'Cargo condition, load shifting, spills, placards' },
    { id:'doc',     icon:'📄', label:'Documents', sub:'Police report, BOL, manifest, registration, dashcam screenshots' },
  ]

  return (
    <>
      <StepHeader step={3} title="Photos & Documents" desc="Commercial claims require thorough documentation. The more photos you provide, the faster your claim resolves." />
      <InfoBox type="blue" icon="📸">
        <strong>Critical:</strong> Photograph before moving any vehicles (if safe to do so). Capture skid marks, debris field, all damage angles, cargo condition, placards, and all license plates.
      </InfoBox>

      <div className="card">
        <div className="card-title mb-4">Upload Photos & Documents</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ZONES.map(z => (
            <div key={z.id}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">{z.icon} {z.label}</div>
              <div className="drop-zone" onClick={() => fileRefs[z.id]?.current?.click()}>
                <input ref={fileRefs[z.id]} type="file" multiple accept="image/*,.pdf"
                  onChange={e => onFiles(z.id, e.target.files)} className="hidden" />
                <span className="text-[22px] opacity-40">📷</span>
                <span className="text-[11.5px] font-semibold text-slate">Tap to upload</span>
                <span className="text-[10.5px] text-faint text-center">{z.sub}</span>
              </div>
              {photos[z.id]?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {photos[z.id].map((url,i) => (
                    <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded-lg border border-border" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {totalPhotos > 0 && (
          <div className="text-[12px] text-green font-semibold mt-3">✅ {totalPhotos} file{totalPhotos>1?'s':''} uploaded</div>
        )}
      </div>

      <div className="card">
        <div className="card-title mb-3">Key Documents Checklist</div>
        <p className="text-[12.5px] text-muted mb-3">These documents are typically required for commercial auto claims. Upload what you have now — additional documents can be submitted later.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ['📋','Police / Crash Report','Mandatory for liability determination'],
            ['📦','Bill of Lading (BOL)','Proof of cargo being transported'],
            ['🚛','Vehicle Registration / Title','Commercial registration documents'],
            ['👤','Driver License & MVR','CDL and driving record'],
            ['⏱️','ELD / HOS Log Export','Hours of service at time of incident'],
            ['📹','Dashcam Footage','Video evidence of the incident'],
            ['🏭','Cargo Manifest','Full inventory of cargo on board'],
            ['🔧','Maintenance Records','Recent service history for the unit'],
          ].map(([icon, label, sub]) => (
            <div key={label} className="flex items-start gap-2.5 p-2.5 border border-border rounded-lg bg-bg">
              <span className="text-[16px] flex-shrink-0">{icon}</span>
              <div>
                <div className="text-[12px] font-semibold text-navy">{label}</div>
                <div className="text-[10.5px] text-muted">{sub}</div>
              </div>
            </div>
          ))}
        </div>
        <InfoBox type="amber" icon="⏳" className="mt-4 mb-0">
          You can upload additional documents at any time after filing. Do not delay submitting your claim — your adjuster can begin review with what you have.
        </InfoBox>
      </div>
    </>
  )
}

/* ── Step 5: Coverage & Repair ──────────────────────────────────── */
function CAStep5() {
  const { watch, setValue, register } = useFormContext<CommercialAutoFNOLData>()
  const drivable     = watch('drivable')
  const towing       = watch('towingNeeded')
  const shopIdx      = watch('selectedShopIndex')
  const inspection   = watch('inspectionMethod')
  const rental       = watch('rentalUnitNeeded')

  return (
    <>
      <StepHeader step={4} title="Coverage & Repair" desc="Arrange repair and replacement for your commercial unit. We work with fleet repair specialists to minimize downtime." />

      <div className="card">
        <div className="card-title mb-3">Vehicle Status</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div onClick={() => { setValue('drivable', true); setValue('towingNeeded', false) }}
            className={clsx('flex-1 p-4 border rounded-xl cursor-pointer transition-all text-center',
              drivable ? 'border-green bg-green-light' : 'border-border hover:bg-bg')}>
            <div className="text-[22px] mb-1">✅</div>
            <div className="text-[13px] font-semibold text-navy">Vehicle is drivable</div>
            <div className="text-[11.5px] text-muted">Can be driven to a repair facility</div>
          </div>
          <div onClick={() => { setValue('drivable', false); setValue('towingNeeded', true) }}
            className={clsx('flex-1 p-4 border rounded-xl cursor-pointer transition-all text-center',
              !drivable ? 'border-red bg-red-light' : 'border-border hover:bg-bg')}>
            <div className="text-[22px] mb-1">🚛</div>
            <div className="text-[13px] font-semibold text-navy">Needs towing</div>
            <div className="text-[11.5px] text-muted">Commercial tow truck required</div>
          </div>
        </div>
        {!drivable && (
          <div className="mt-3 field">
            <label className="field-label">Towing destination (if known)</label>
            <input {...register('towingDestination')} placeholder="Preferred fleet repair facility or storage" className="field-input" />
            <span className="field-hint">Leave blank and our commercial tow coordinator will arrange immediately</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title mb-4">Fleet Repair Facility</div>
        <div className="flex flex-col gap-3">
          {FLEET_SHOPS.map((s,i) => (
            <div key={i} onClick={() => setValue('selectedShopIndex', i)}
              className={clsx('flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all relative',
                shopIdx===i ? 'border-red bg-red-light ring-2 ring-red/10' : 'border-border bg-white hover:border-red/40 hover:bg-red-light/50')}>
              <span className={clsx('absolute top-2 right-3 text-[9.5px] font-bold px-2 py-px rounded-full',
                s.tag==='Fleet Partner' ? 'bg-navy text-white' : 'bg-amber-light text-amber border border-amber/30')}>
                {s.tag}
              </span>
              <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-[20px] flex-shrink-0">🔧</div>
              <div className="flex-1 pr-20">
                <div className="text-[13px] font-bold text-navy">{s.name}</div>
                <div className="text-[11.5px] text-muted mt-0.5">{s.addr}</div>
                <div className="text-[11px] text-slate mt-1">{s.meta}</div>
              </div>
              <div className={clsx('w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] flex-shrink-0',
                shopIdx===i ? 'bg-red border-red text-white' : 'border-border')}>✓</div>
            </div>
          ))}
        </div>
        <button type="button" className="mt-3 text-[12.5px] font-bold text-red bg-transparent border-none cursor-pointer">
          + Use our own fleet repair shop
        </button>
      </div>

      <div className="card">
        <div className="card-title mb-4">Inspection Method</div>
        {[
          { id:'mobile',  label:'🚐 Mobile Commercial Adjuster', sub:'Adjuster comes to the vehicle — recommended for large units', tag:'Recommended' },
          { id:'shop',    label:'🔧 Inspect at Fleet Shop',       sub:'Drop the unit at the repair facility for inspection',         tag:'' },
          { id:'virtual', label:'📱 Virtual Photo Review',        sub:'Submit photos for preliminary estimate — 24 hour turnaround', tag:'' },
        ].map(opt => (
          <div key={opt.id} onClick={() => setValue('inspectionMethod', opt.id as any)}
            className="flex items-center justify-between p-3.5 border border-border rounded-xl mb-2 cursor-pointer hover:bg-bg transition-all">
            <div>
              <div className="text-[13px] font-semibold text-navy">
                {opt.label}
                {opt.tag && <span className="ml-2 text-[10px] bg-green-light text-green border border-green-mid px-2 py-px rounded-full font-bold">{opt.tag}</span>}
              </div>
              <div className="text-[11.5px] text-muted mt-px">{opt.sub}</div>
            </div>
            <div className={clsx('toggle', inspection===opt.id?'toggle-on':'toggle-off')}>
              <span className={clsx('toggle-knob', inspection===opt.id?'left-[22px]':'left-[3px]')} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title mb-3">Replacement Unit <Tip title="Commercial rental covered">Your policy's rental reimbursement covers a like-for-like commercial unit while yours is being repaired.</Tip></div>
        <div onClick={() => setValue('rentalUnitNeeded', !rental)}
          className="flex items-center justify-between p-3.5 border border-border rounded-xl cursor-pointer hover:bg-bg transition-all mb-3">
          <div>
            <div className="text-[13px] font-semibold text-navy">Replacement unit needed</div>
            <div className="text-[11.5px] text-muted">We will arrange a commercial rental to keep your operations running</div>
          </div>
          <div className={clsx('toggle', rental?'toggle-on':'toggle-off')}>
            <span className={clsx('toggle-knob', rental?'left-[22px]':'left-[3px]')} />
          </div>
        </div>
        {rental && (
          <div className="field">
            <label className="field-label">Unit type required</label>
            <select {...register('rentalUnitType')} className="field-select">
              <option>Same class as damaged unit</option>
              <option>Semi-Truck / Tractor</option>
              <option>Box Truck (26 ft)</option>
              <option>Flatbed</option>
              <option>Refrigerated (Reefer)</option>
              <option>Cargo Van</option>
            </select>
          </div>
        )}
        <InfoBox type="blue" icon="ℹ️" className="mt-3 mb-0">
          Commercial rental availability varies by region. Our fleet coordinator will confirm availability and arrange direct billing within 4 hours.
        </InfoBox>
      </div>
    </>
  )
}

/* ── Step 6: Review & Submit ────────────────────────────────────── */
function CAStep6({ onGoTo }: { onGoTo:(n:number)=>void }) {
  const { register, watch, formState:{ errors } } = useFormContext<CommercialAutoFNOLData>()
  const d = {
    incType:     watch('incidentType'),
    date:        watch('dateOfLoss'),
    location:    watch('location'),
    company:     watch('companyName'),
    unit:        watch('unitNumber'),
    vehicleType: watch('vehicleType'),
    driver:      watch('driverName'),
    hos:         watch('hosCompliant'),
    cargo:       watch('cargoInvolved'),
    hazmat:      watch('hazmatInvolved'),
    shop:        FLEET_SHOPS[watch('selectedShopIndex')]?.name ?? '—',
    inspection:  watch('inspectionMethod'),
    rental:      watch('rentalUnitNeeded'),
  }

  const INCIDENT_LABEL = INCIDENT_TYPES.find(t => t.id === d.incType)?.label ?? d.incType

  return (
    <>
      <StepHeader step={5} title="Review & Submit" desc="A dedicated commercial adjuster will be assigned within 2 hours. ELD data and dashcam footage will be requested immediately." />
      <InfoBox type="green" icon="✅">
        Everything looks complete. You will receive an immediate confirmation with your commercial claim number by email and text.
      </InfoBox>

      <div className="card">
        {[
          { title:'Incident',          step:0, rows:[['Type',INCIDENT_LABEL],['Date',d.date],['Location',d.location]] },
          { title:'Vehicle & Driver',  step:1, rows:[['Company',d.company],['Unit',d.unit],['Type',d.vehicleType],['Driver',d.driver],['HOS',d.hos]] },
          { title:'Cargo & Parties',   step:2, rows:[['Cargo',d.cargo?'Yes — cargo on board':'No cargo'],['Hazmat',d.hazmat?'⚠️ Yes — hazmat involved':'No hazmat','warn']] },
          { title:'Repair',            step:4, rows:[['Shop',d.shop],['Inspection',d.inspection==='mobile'?'Mobile adjuster (recommended)':d.inspection==='shop'?'At fleet shop':'Virtual photo review'],['Rental Unit',d.rental?'Yes — requested':'Not needed']] },
        ].map((section, si) => (
          <div key={section.title} className={clsx(si > 0 && 'mt-4 pt-4 border-t border-border')}>
            <div className="flex items-center justify-between text-[12px] font-bold text-navy pb-2 border-b-2 border-red mb-2.5">
              {section.title}
              <button type="button" onClick={() => onGoTo(section.step)}
                className="text-[11px] font-bold text-red bg-transparent border-none cursor-pointer">✏️ Edit</button>
            </div>
            {section.rows.map(([k,v,style]) => (
              <div key={String(k)} className="flex gap-3.5 py-1.5 border-b border-bg last:border-none">
                <div className="text-[12px] text-muted w-36 flex-shrink-0">{k}</div>
                <div className={clsx('text-[12px] font-semibold', style==='warn'?'text-amber':'text-navy')}>{v}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title mb-4">Certifications</div>
        {([
          { name:'certAccuracy'  as const, text:'I certify that all information provided is accurate and complete to the best of my knowledge. I understand that providing false information in connection with an insurance claim is a criminal offense.' },
          { name:'certAuthorize' as const, text:'I authorize ValueMomentum and the assigned commercial adjuster to inspect the vehicle, review electronic data (ELD, telematics, dashcam), and conduct all necessary investigation to process this claim.' },
          { name:'certConsent'   as const, text:'I consent to receive claim updates by text and email, and I understand that all communications related to this claim may be recorded for quality assurance.' },
        ]).map(({ name, text }) => (
          <label key={name} className="flex gap-3 items-start cursor-pointer text-[12px] text-slate leading-relaxed mb-3">
            <input type="checkbox" {...register(name)}
              style={{ accentColor:'#C8102E', width:14, height:14, flexShrink:0, marginTop:2 }} />
            {text}
            {errors[name] && <span className="err-msg ml-1">{errors[name]?.message as string}</span>}
          </label>
        ))}
        <InfoBox type="green" icon="🚛" className="mb-0">
          Upon submission — your claim is logged, a commercial adjuster is assigned, your fleet repair partner is notified, and ELD / dashcam data request is initiated simultaneously.
        </InfoBox>
      </div>
    </>
  )
}
