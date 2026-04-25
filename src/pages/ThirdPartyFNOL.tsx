import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogo } from '@/lib/logoConfig'

export default function ThirdPartyFNOL() {
  const navigate = useNavigate()
  const { logo } = useLogo()
  const [submitted, setSubmitted] = useState(false)
  const [refNum] = useState(`TP-${new Date().getFullYear()}-${Math.floor(Math.random()*90000+10000)}`)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    firstName:'', lastName:'', phone:'', email:'', address:'',
    injuryStatus:'No injuries', propertyDamage:'Vehicle damage only',
    insuredName:'', insuredPlate:'', insuredPolicy:'', insuredVehicle:'',
    dateOfLoss:'', timeOfLoss:'', location:'', description:'',
    policeReport:'Not filed', policeNumber:'',
    yourVehicle:'', yourPlate:'', yourInsurer:'', yourPolicy:'',
  })
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]:v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1800))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="h-16 bg-navy flex items-center px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </div>
      </nav>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-card p-10 max-w-[480px] w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center text-[28px] text-white mx-auto mb-5">✓</div>
          <h1 className="font-display font-black text-[22px] text-navy mb-2">Third-Party Claim Submitted</h1>
          <p className="text-[13.5px] text-muted mb-5 leading-relaxed">Your claim has been received. An adjuster will contact you within 1 business day at the phone number and email you provided.</p>
          <div className="bg-bg border border-border rounded-xl p-4 mb-6">
            <div className="text-[11px] text-muted uppercase tracking-widest font-bold mb-1">Your Reference Number</div>
            <div className="font-display font-black text-[22px] text-navy">{refNum}</div>
            <div className="text-[11.5px] text-muted mt-1">Save this number to follow up on your claim status.</div>
          </div>
          <div className="flex flex-col gap-2.5">
            <a href="tel:18008262534" className="btn btn-primary justify-center py-3">📞 Call Claims Team</a>
            <button onClick={() => navigate('/')} className="btn btn-ghost justify-center">Back to Home</button>
          </div>
          <div className="mt-5 p-3 bg-blue-light border border-blue-mid rounded-xl text-[12px] text-[#1E3A8A]">
            You can also contact our claims team directly: <a href="mailto:thirdparty@valuemomentum.com" className="font-semibold underline">thirdparty@valuemomentum.com</a>
          </div>
        </div>
      </div>
    </div>
  )

  const STEPS = ['Your Information', 'Incident Details', 'Policy Information', 'Review & Submit']

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </div>
        <Link to="/file-claim" className="text-[13px] text-white/50 hover:text-white transition-colors">Back</Link>
      </nav>

      {/* Mobile progress */}
      <div className="md:hidden bg-navy px-4 py-3 border-b border-white/8">
        <div className="flex justify-between text-[11px] text-white/40 mb-1.5"><span>{STEPS[step]}</span><span>Step {step+1} of {STEPS.length}</span></div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-red rounded-full transition-all" style={{ width:`${((step+1)/STEPS.length)*100}%` }} />
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-navy flex-col sticky top-[60px] h-[calc(100vh-60px)] border-r border-white/8 flex-shrink-0 p-6">
          <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4">Third-Party Claim</div>
          <div className="text-[11px] text-white/35 mb-6 leading-relaxed">No account required. Fill in your details and we will have an adjuster contact you within 1 business day.</div>
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-3 mb-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${i < step?'bg-green text-white':i===step?'bg-red text-white':'border border-white/20 text-white/30'}`}>
                {i < step ? '✓' : i+1}
              </div>
              <div className={`text-[12px] font-semibold ${i===step?'text-white/95':i<step?'text-white/55':'text-white/35'}`}>{s}</div>
            </div>
          ))}
          <div className="mt-auto pt-6 border-t border-white/8">
            <div className="text-[11px] text-white/30 mb-1">Need immediate help?</div>
            <a href="tel:18008262534" className="text-[13px] font-bold text-[#FF8099]">1-800-VM-CLAIMS</a>
          </div>
        </aside>

        <main className="flex-1 px-5 py-8 md:px-10 max-w-[760px]">
          <form onSubmit={handleSubmit}>

            {/* Step 0 — Your Info */}
            {step === 0 && (
              <>
                <div className="mb-6">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 1 of 4</div>
                  <h1 className="font-display font-black text-[24px] text-navy mb-1">Your Information</h1>
                  <p className="text-[13.5px] text-muted">Tell us about yourself. This information is kept confidential and used only for claim processing.</p>
                </div>
                <div className="card">
                  <div className="card-title mb-4">Contact Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field"><label className="field-label">First Name <span className="text-red">*</span></label><input value={form.firstName} onChange={e=>set('firstName',e.target.value)} className="field-input" required /></div>
                    <div className="field"><label className="field-label">Last Name <span className="text-red">*</span></label><input value={form.lastName} onChange={e=>set('lastName',e.target.value)} className="field-input" required /></div>
                    <div className="field"><label className="field-label">Phone Number <span className="text-red">*</span></label><input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="(214) 555-0100" className="field-input" required /></div>
                    <div className="field"><label className="field-label">Email Address</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="your@email.com" className="field-input" /></div>
                    <div className="field sm:col-span-2"><label className="field-label">Mailing Address</label><input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Street, City, State, ZIP" className="field-input" /></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title mb-4">Damages Suffered</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field"><label className="field-label">Were you or others injured?</label>
                      <select value={form.injuryStatus} onChange={e=>set('injuryStatus',e.target.value)} className="field-select">
                        <option>No injuries</option><option>Minor injuries (treated at scene)</option><option>Injuries requiring medical attention</option><option>Serious / hospitalized</option>
                      </select>
                    </div>
                    <div className="field"><label className="field-label">Property damage</label>
                      <select value={form.propertyDamage} onChange={e=>set('propertyDamage',e.target.value)} className="field-select">
                        <option>Vehicle damage only</option><option>Vehicle and other property</option><option>Other property only</option><option>No property damage</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 1 — Incident */}
            {step === 1 && (
              <>
                <div className="mb-6">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 2 of 4</div>
                  <h1 className="font-display font-black text-[24px] text-navy mb-1">Incident Details</h1>
                  <p className="text-[13.5px] text-muted">Tell us what happened. Be as specific as possible — this helps the adjuster process your claim faster.</p>
                </div>
                <div className="card">
                  <div className="card-title mb-4">When and Where</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field"><label className="field-label">Date of Incident <span className="text-red">*</span></label><input type="date" value={form.dateOfLoss} onChange={e=>set('dateOfLoss',e.target.value)} className="field-input" required /></div>
                    <div className="field"><label className="field-label">Approximate Time</label><input type="time" value={form.timeOfLoss} onChange={e=>set('timeOfLoss',e.target.value)} className="field-input" /></div>
                    <div className="field sm:col-span-2"><label className="field-label">Location of Incident <span className="text-red">*</span></label><input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Street address, intersection, or landmark" className="field-input" required /></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title mb-4">What Happened</div>
                  <div className="field mb-4"><label className="field-label">Describe the incident in your own words <span className="text-red">*</span></label><textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={5} placeholder="Describe what happened, how the incident occurred, and what was damaged or injured. Include the sequence of events as you experienced them." className="field-textarea" required /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field"><label className="field-label">Was a police report filed?</label>
                      <select value={form.policeReport} onChange={e=>set('policeReport',e.target.value)} className="field-select">
                        <option>Not filed</option><option>Filed at the scene</option><option>Filed after the incident</option><option>In progress</option>
                      </select>
                    </div>
                    {form.policeReport !== 'Not filed' && <div className="field"><label className="field-label">Report / Incident Number</label><input value={form.policeNumber} onChange={e=>set('policeNumber',e.target.value)} className="field-input" /></div>}
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Policy Info */}
            {step === 2 && (
              <>
                <div className="mb-6">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 3 of 4</div>
                  <h1 className="font-display font-black text-[24px] text-navy mb-1">Policy Information</h1>
                  <p className="text-[13.5px] text-muted">Provide details about the policyholder involved. Even partial information helps us locate the relevant policy.</p>
                </div>
                <div className="card">
                  <div className="card-title mb-4">Our Insured's Details</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field"><label className="field-label">Their Full Name</label><input value={form.insuredName} onChange={e=>set('insuredName',e.target.value)} placeholder="Name of the policyholder" className="field-input" /></div>
                    <div className="field"><label className="field-label">Their License Plate</label><input value={form.insuredPlate} onChange={e=>set('insuredPlate',e.target.value)} placeholder="ABC-1234 TX" className="field-input" /></div>
                    <div className="field"><label className="field-label">Their Policy Number (if known)</label><input value={form.insuredPolicy} onChange={e=>set('insuredPolicy',e.target.value)} placeholder="VM-AUTO-2024-XXXXX" className="field-input" /></div>
                    <div className="field"><label className="field-label">Their Vehicle (year / make / model)</label><input value={form.insuredVehicle} onChange={e=>set('insuredVehicle',e.target.value)} placeholder="2021 Ford F-150" className="field-input" /></div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title mb-4">Your Vehicle & Insurance (optional)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="field"><label className="field-label">Your Vehicle</label><input value={form.yourVehicle} onChange={e=>set('yourVehicle',e.target.value)} placeholder="2020 Honda Civic" className="field-input" /></div>
                    <div className="field"><label className="field-label">Your License Plate</label><input value={form.yourPlate} onChange={e=>set('yourPlate',e.target.value)} placeholder="XYZ-5678 TX" className="field-input" /></div>
                    <div className="field"><label className="field-label">Your Insurance Company</label><input value={form.yourInsurer} onChange={e=>set('yourInsurer',e.target.value)} placeholder="Allstate, State Farm, etc." className="field-input" /></div>
                    <div className="field"><label className="field-label">Your Policy Number</label><input value={form.yourPolicy} onChange={e=>set('yourPolicy',e.target.value)} className="field-input" /></div>
                  </div>
                </div>
              </>
            )}

            {/* Step 3 — Review */}
            {step === 3 && (
              <>
                <div className="mb-6">
                  <div className="text-[11px] font-bold text-muted uppercase tracking-widest mb-2">Step 4 of 4</div>
                  <h1 className="font-display font-black text-[24px] text-navy mb-1">Review & Submit</h1>
                  <p className="text-[13.5px] text-muted">Review your information before submitting. An adjuster will contact you within 1 business day.</p>
                </div>
                <div className="card">
                  {[
                    { title:'Your Information', rows:[['Name',`${form.firstName} ${form.lastName}`],['Phone',form.phone],['Email',form.email||'Not provided'],['Injuries',form.injuryStatus],['Damage',form.propertyDamage]] },
                    { title:'Incident', rows:[['Date',form.dateOfLoss],['Location',form.location],['Police Report',form.policeReport]] },
                    { title:'Their Information', rows:[['Name',form.insuredName||'Not provided'],['Plate',form.insuredPlate||'Not provided'],['Policy',form.insuredPolicy||'Not provided']] },
                  ].map((section, si) => (
                    <div key={section.title} className={si > 0 ? 'mt-4 pt-4 border-t border-border' : ''}>
                      <div className="text-[12px] font-bold text-navy mb-2 pb-2 border-b border-border">{section.title}</div>
                      {section.rows.map(([k,v]) => (
                        <div key={k} className="flex gap-4 py-1.5 border-b border-bg last:border-none">
                          <div className="text-[12px] text-muted w-32 flex-shrink-0">{k}</div>
                          <div className="text-[12px] font-semibold text-navy">{v}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="card">
                  <div className="card-title mb-3">Incident Description</div>
                  <p className="text-[13px] text-slate leading-relaxed">{form.description || 'Not provided'}</p>
                </div>
                <div className="card">
                  <div className="card-title mb-3">Certification</div>
                  <label className="flex gap-3 items-start cursor-pointer text-[12.5px] text-slate leading-relaxed">
                    <input type="checkbox" required style={{ accentColor:'#C8102E', width:14, height:14, flexShrink:0, marginTop:2 }} />
                    I certify that the information provided is accurate and complete to the best of my knowledge. I understand that providing false information may result in denial of this claim and potential legal action.
                  </label>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="step-nav">
              {step === 0
                ? <Link to="/file-claim" className="btn btn-ghost">Back to Coverage</Link>
                : <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s-1)}>Back</button>
              }
              {step < 3
                ? <button type="button" className="btn btn-primary" onClick={() => setStep(s => s+1)}>{STEPS[step+1]} →</button>
                : <button type="submit" className="btn btn-green px-7 py-3 text-[13.5px]" disabled={loading}>
                    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</span> : 'Submit Claim →'}
                  </button>
              }
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
