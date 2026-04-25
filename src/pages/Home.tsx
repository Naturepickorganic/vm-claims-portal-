import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogo } from '@/lib/logoConfig'
import { useAuth } from '@/lib/authContext'
import Footer from '@/components/layout/Footer'

type LOBKey = 'auto' | 'home' | 'commercial-property' | 'commercial-auto' | 'workers-comp' | 'agri'

const LOB_TABS: { id: LOBKey; label: string; icon: string }[] = [
  { id:'auto',                label:'Personal Auto',        icon:'🚗' },
  { id:'home',                label:'Personal Home',        icon:'🏠' },
  { id:'commercial-property', label:'Commercial Property',  icon:'🏢' },
  { id:'commercial-auto',     label:'Commercial Auto',      icon:'🚚' },
  { id:'workers-comp',        label:"Workers Comp",         icon:'👷' },
  { id:'agri',                label:'Commercial Agri',      icon:'🌾' },
]

const FAQS: Record<LOBKey, { q: string; a: string }[]> = {
  auto: [
    { q:'How long does a personal auto claim take?', a:'Most auto claims resolve in 5-10 business days. Glass-only claims can be completed same-day. Complex multi-vehicle or liability disputes may take 2-4 weeks. You can track every milestone in real time through your claims dashboard.' },
    { q:'Will filing a claim raise my premium?', a:'Not necessarily. Comprehensive claims (weather, theft, glass) rarely affect premiums. At-fault collision claims may impact rates at renewal. Our team will explain any potential rate impact before finalizing your claim.' },
    { q:'What is a deductible and when do I pay it?', a:'Your deductible is your out-of-pocket portion before insurance pays. You typically pay it directly to the repair shop and we pay the remainder. If the other driver was at fault, we actively pursue subrogation to recover your deductible on your behalf.' },
    { q:'Do I need a police report to file a claim?', a:'A police report is strongly recommended for collisions, theft, and hit-and-run incidents. It validates your claim and speeds up adjuster review. If a report was not filed, contact us and our team can advise on next steps.' },
    { q:'What happens if the other driver is uninsured?', a:'If you carry Uninsured Motorist (UM) coverage, your own policy covers your damages and medical expenses. We will pursue the uninsured driver for recovery. Without UM coverage, your options are limited to a civil lawsuit against the at-fault driver.' },
    { q:'Can I choose my own repair shop?', a:'Yes. You may choose any licensed repair facility. We also maintain a network of certified Partner Shops offering lifetime warranties, direct billing, and priority scheduling typically available within 24-48 hours.' },
  ],
  home: [
    { q:'What does a standard homeowners policy (HO-3) cover?', a:'HO-3 covers your dwelling structure, other structures (garage, fence), personal property, additional living expenses (ALE), and personal liability. It covers all perils except those specifically excluded - most commonly flood and earthquake.' },
    { q:'How long does a home claim take?', a:'Simple claims (broken window, minor water damage) can resolve in 1-2 weeks. Storm or fire damage to the structure typically takes 4-12 weeks depending on contractor availability. ALE housing can be authorized within 2 hours of filing.' },
    { q:'What is my wind/hail deductible vs. all-other-perils?', a:'Most Texas HO-3 policies carry a separate wind/hail deductible expressed as a percentage of your dwelling coverage (typically 1-2%). Your all-other-perils deductible is a flat dollar amount. Your declarations page specifies both.' },
    { q:'Does homeowners insurance cover flooding?', a:'Standard HO-3 does not cover ground flooding or storm surge. Flood coverage requires a separate policy through the NFIP or a private flood insurer. We can help you determine what triggered your loss.' },
    { q:'What is Additional Living Expense (ALE) coverage?', a:'ALE covers reasonable costs to live elsewhere while your home is being repaired - hotel, meals above your normal budget, laundry, and pet boarding. Coverage is capped at your policy limit (typically 20-30% of dwelling) over a set time period.' },
    { q:'Can I make temporary repairs before the adjuster arrives?', a:'Yes - you are obligated to prevent further damage. Document everything with photos and keep all receipts. Temporary repair costs (tarps, board-ups) are typically reimbursable. Never make permanent repairs before adjuster approval.' },
  ],
  'commercial-property': [
    { q:'What is covered under a commercial property policy?', a:'Commercial property insurance covers your building, business personal property (equipment, inventory, furniture), and business income loss. Coverage can be extended to include equipment breakdown, inland marine, and spoilage depending on your policy form.' },
    { q:'How is business interruption (BI) calculated?', a:'BI pays for lost net income plus continuing expenses (rent, payroll) during the restoration period. It requires proof of historical revenue, fixed expenses, and projected income. The restoration period begins at the date of loss and ends when operations can reasonably resume.' },
    { q:'What is coinsurance and how does it affect my claim?', a:'A coinsurance clause requires you to insure your property to a minimum percentage of its replacement value (commonly 80-90%). Underinsuring triggers a coinsurance penalty - your claim payment is reduced proportionally to the amount you were underinsured.' },
    { q:'How long do commercial property claims take?', a:'Simple claims (broken glass, minor vandalism) resolve in 1-2 weeks. Significant structural damage or business income losses may take 3-6 months. Complex multi-location or high-value losses often involve appraisal or engineering consultants.' },
    { q:'What documentation is needed to file?', a:'You will need your policy declarations, proof of ownership for damaged property, photos and videos of all damage, contractor estimates, financial records for BI claims, and an inventory of damaged business personal property with purchase receipts or values.' },
  ],
  'commercial-auto': [
    { q:'How do commercial auto claims differ from personal auto?', a:'Commercial auto claims involve fleet vehicles, cargo liability, higher coverage limits, and employees as drivers. Investigation is more thorough - driver records, hours of service logs, and vehicle maintenance records may all be reviewed.' },
    { q:'Does coverage extend to employee-owned vehicles?', a:'Only if your policy includes Hired and Non-Owned Auto (HNOA) coverage. This covers liability when employees use personal vehicles for business purposes. Without HNOA, claims arising from employee-owned vehicles may be excluded.' },
    { q:'How are multi-vehicle fleet accidents handled?', a:'Fleet accidents are triaged by severity. We assign a dedicated commercial adjuster who coordinates across all involved vehicles, drivers, and third parties simultaneously. Fleet telematics data (GPS, dashcam footage) can significantly accelerate the investigation.' },
    { q:'What is cargo liability and when does it apply?', a:'Cargo liability covers loss or damage to freight you are transporting. Coverage applies while goods are in your care, custody, or control. Exclusions commonly include improper packaging by the shipper and refrigeration breakdown.' },
    { q:'How quickly can a commercial vehicle be returned to service?', a:'Priority claims are fast-tracked for commercial operators. We work with mobile repair units and rental fleets to minimize downtime. For total losses, we aim to settle ACV within 5-7 business days from inspection completion.' },
  ],
  'workers-comp': [
    { q:'What should an employee do immediately after a workplace injury?', a:'Seek medical attention first. Notify your supervisor or HR as soon as possible - most states require reporting within 24-72 hours. Your employer must then notify the insurance carrier. Delayed reporting can jeopardize your claim.' },
    { q:'What medical treatment is covered?', a:'All reasonable and necessary medical treatment related to the work injury is covered - emergency care, surgeries, hospitalization, physical therapy, prescriptions, and travel to medical appointments. Treatment must be authorized through the designated occupational medicine provider network.' },
    { q:'How is the weekly compensation benefit calculated?', a:'Temporary Total Disability (TTD) benefits are typically 66 2/3% of the employee\'s average weekly wage (AWW), subject to state-mandated minimums and maximums. AWW is calculated from the prior 52 weeks of earnings. Benefits begin after the state-defined waiting period.' },
    { q:'What is a return-to-work (RTW) program?', a:'RTW programs allow injured employees to resume modified or light-duty work while recovering. They reduce lost time, maintain morale, and lower claim costs. Employers with RTW programs typically see 40-60% lower indemnity costs.' },
    { q:'How long can a workers comp claim stay open?', a:'Duration varies by state and injury severity. Simple soft-tissue claims may close in weeks. Permanent partial or total disability claims can remain open for years. Claims are typically closed via settlement agreement or when maximum medical improvement (MMI) is reached.' },
  ],
  agri: [
    { q:'What types of agricultural losses are covered?', a:'Commercial agricultural policies typically cover crop damage (hail, drought, flood, frost, fire), livestock mortality, farm structures (barns, silos, equipment sheds), farm equipment and machinery, and agricultural product liability. Coverage is highly customizable by commodity and operation type.' },
    { q:'How is a crop damage claim assessed?', a:'Adjusters - often certified crop adjusters (CCAs) - conduct field inspections to measure yield loss. Damage is quantified against your established yield history or Actual Production History (APH). USDA Risk Management Agency (RMA) guidelines govern federal crop insurance assessments.' },
    { q:'What is Multi-Peril Crop Insurance (MPCI)?', a:'MPCI is a federally subsidized crop insurance product that protects against yield losses from most natural causes. It is sold through Approved Insurance Providers (AIPs) and reinsured by USDA-RMA. Coverage levels range from 50-85% of your APH yield.' },
    { q:'Does the policy cover livestock disease losses?', a:'Livestock mortality policies cover death from accident, illness, and specified diseases. Blanket policies cover entire herds; individual policies cover high-value animals. Widespread contagious disease events may be subject to government indemnity programs.' },
    { q:'How are farm equipment breakdown claims handled?', a:'Equipment breakdown coverage pays for sudden and accidental mechanical or electrical failure of covered farm equipment. Wear and tear and operator error are typically excluded. We work with certified agricultural equipment technicians for inspection and valuation.' },
    { q:'What documentation is needed for an agricultural claim?', a:'You will need your policy declarations, planting records, field maps, crop receipts or contracts, yield history (APH records), livestock records, veterinary records, equipment purchase invoices, and photos of all damaged crops, animals, or property.' },
  ],
}

export default function Home() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { logo, logoKey, setLogo, presets } = useLogo()
  const [activeLOB, setActiveLOB] = useState<LOBKey>('auto')
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)
  const [chatOpen, setChatOpen] = useState(false)
  const [showBrand, setShowBrand] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { from:'agent', text:'Hi! How can I help you with your claim today?' }
  ])

  const sendChat = () => {
    if (!chatMsg.trim()) return
    setChatHistory(h => [...h, { from:'user', text:chatMsg }])
    setChatMsg('')
    setTimeout(() => setChatHistory(h => [...h, { from:'agent', text:'Thank you. A claims specialist will follow up shortly. You can also file or track a claim using the buttons above.' }]), 1000)
  }

  return (
    <div className="min-h-screen bg-bg font-body flex flex-col">

      {/* NAV */}
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
          <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBrand(v => !v)} className="hidden md:flex text-[11.5px] text-white/40 hover:text-white/70 transition-colors bg-transparent border-none cursor-pointer">
            Brand
          </button>
          {isAuthenticated
            ? <div className="flex items-center gap-3">
                <span className="hidden md:block text-[12px] text-white/50">Welcome, {user?.name?.split(' ')[0]}</span>
                <button onClick={() => { logout(); navigate('/') }} className="text-[13px] text-white/50 hover:text-white bg-transparent border-none cursor-pointer transition-colors">Log Out</button>
              </div>
            : <Link to="/login" className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">Log In</Link>
          }
        </div>
      </nav>

      {/* BRAND PANEL */}
      {showBrand && (
        <div className="bg-navy border-b border-white/10 px-5 md:px-8 py-4 z-30">
          <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Brand Switcher</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, p]) => (
              <button key={key} onClick={() => { setLogo(key); setShowBrand(false) }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer transition-all ${logoKey===key?'bg-white text-navy border-white':'bg-transparent text-white/60 border-white/20 hover:border-white/50'}`}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white" style={{ background: p.primaryColor }}>{p.initials}</div>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="bg-gradient-to-br from-navy via-[#0D1E35] to-[#1A3050] px-5 md:px-[60px] py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse 60% 50% at 70% 40%,rgba(200,16,46,.12) 0%,transparent 70%)' }} />
        <div className="max-w-[560px] relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white/70 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Claims team available 24/7
          </div>
          <h1 className="font-display font-black text-[32px] md:text-[44px] text-white leading-[1.1] mb-4">
            Welcome to our easy claims center
          </h1>
          <p className="text-[14px] text-white/60 leading-relaxed mb-8 max-w-[440px]">
            File a new claim or track an existing one. Most claims resolved in under 7 days.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => navigate('/file-claim')} className="bg-red text-white font-bold text-[15px] px-7 py-3.5 rounded-full hover:bg-red-dark transition-all shadow-red border-none cursor-pointer">
              File a Claim
            </button>
            <Link to="/track" className="bg-transparent text-white font-bold text-[15px] px-7 py-3.5 rounded-full border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all">
              Track a Claim
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <button onClick={() => navigate('/claims/third-party/new')} className="flex items-center gap-2 text-[12.5px] text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
              Claims for non-customers
            </button>
            <button onClick={() => alert('Call 1-800-VM-CLAIMS and press 3 for roadside assistance.')} className="flex items-center gap-2 text-[12.5px] text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
              Get roadside assistance
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-white border-b border-border">
        {[['< 2 hrs','Adjuster assigned'],['7 Days','Avg. auto resolution'],['98.4%','Customer satisfaction'],['24/7','Claims available']].map(([v,l]) => (
          <div key={l} className="text-center py-8 px-4 border-r border-border last:border-r-0">
            <div className="font-display font-black text-[26px] md:text-[30px] text-navy">{v}</div>
            <div className="text-[12.5px] text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="px-5 md:px-[60px] py-14 bg-bg flex-1">
        <div className="text-[11.5px] font-bold text-muted uppercase tracking-widest mb-2">Frequently Asked Questions</div>
        <h2 className="font-display font-black text-[24px] md:text-[30px] text-navy mb-8">What can we help you with?</h2>

        <div className="flex flex-wrap gap-2 mb-8">
          {LOB_TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveLOB(tab.id); setOpenFAQ(0) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold border cursor-pointer transition-all ${activeLOB===tab.id?'bg-navy text-white border-navy':'bg-white text-slate border-border hover:border-navy hover:text-navy'}`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="max-w-[760px]">
          {FAQS[activeLOB].map((item, i) => (
            <div key={i} className="border-t border-border last:border-b">
              <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left bg-transparent border-none cursor-pointer group">
                <span className={`text-[14.5px] font-semibold pr-6 leading-snug transition-colors ${openFAQ===i?'text-navy':'text-slate group-hover:text-navy'}`}>{item.q}</span>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center text-[14px] text-muted transition-all ${openFAQ===i?'bg-navy border-navy text-white rotate-45':'group-hover:border-navy'}`}>+</span>
              </button>
              {openFAQ === i && (
                <div className="pb-5 pr-10">
                  <p className="text-[13.5px] text-slate leading-[1.75]">{item.a}</p>
                  <button onClick={() => navigate('/file-claim')} className="mt-4 text-[12.5px] font-bold text-red hover:underline bg-transparent border-none cursor-pointer">
                    File a {LOB_TABS.find(t => t.id === activeLOB)?.label} claim
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-8 max-w-[760px] pt-6 border-t border-border">
          <button onClick={() => setChatOpen(true)} className="btn btn-primary text-[13px]">Chat with us</button>
          <a href="tel:18008262534" className="btn btn-ghost text-[13px]">1-800-VM-CLAIMS</a>
          <a href="mailto:claims@valuemomentum.com" className="btn btn-ghost text-[13px]">Email us</a>
        </div>
      </div>

      <Footer />

      {/* CHAT */}
      <button onClick={() => setChatOpen(v => !v)} className="fixed bottom-6 right-6 w-14 h-14 bg-red rounded-full flex items-center justify-center text-white text-[22px] shadow-[0_4px_20px_rgba(200,16,46,.4)] hover:bg-red-dark transition-all z-50 border-none cursor-pointer">
        {chatOpen ? 'x' : '💬'}
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-[320px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,.18)] z-50 flex flex-col overflow-hidden border border-border">
          <div className="bg-navy px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center text-white text-[13px] font-bold">{logo.initials}</div>
            <div><div className="text-[13px] font-bold text-white">Claims Assistant</div><div className="flex items-center gap-1.5 text-[11px] text-green-300"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Online</div></div>
            <button onClick={() => setChatOpen(false)} className="ml-auto text-white/40 hover:text-white bg-transparent border-none cursor-pointer text-[18px]">x</button>
          </div>
          <div className="flex flex-col gap-3 p-3.5 max-h-[220px] overflow-y-auto bg-bg">
            {chatHistory.map((m,i) => (
              <div key={i} className={`max-w-[85%] ${m.from==='user'?'self-end':'self-start'}`}>
                <div className={`px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed ${m.from==='agent'?'bg-white border border-border text-navy':'bg-navy text-white/90'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-border">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)} onKeyDown={e => e.key==='Enter'&&sendChat()} placeholder="Type a message..." className="flex-1 text-[12.5px] border border-border rounded-lg px-3 py-2 outline-none focus:border-red font-body" />
            <button onClick={sendChat} className="bg-red text-white border-none rounded-lg px-3 py-2 cursor-pointer text-[12px] font-bold">Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
