import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Car, Home as HomeIcon, Building2, Truck, HardHat, Sprout,
  AppWindow, MessageSquare, Phone, Mail, ChevronDown, ChevronUp,
  Clock, ThumbsUp, Users, HeadphonesIcon, AlertTriangle
} from 'lucide-react'
import { useLogo } from '@/lib/logoConfig'
import { useAuth } from '@/lib/authContext'
import Footer from '@/components/layout/Footer'
import VMlogo from '@/components/ui/VMlogo'

type LOBKey = 'auto' | 'home' | 'commercial-property' | 'commercial-auto' | 'workers-comp' | 'agri'

const LOB_TABS: { id: LOBKey; label: string; Icon: React.ElementType; color: string; bg: string }[] = [
  { id:'auto',                label:'Personal Auto',       Icon:Car,       color:'#0254CC', bg:'#EBF3FF' },
  { id:'home',                label:'Personal Home',       Icon:HomeIcon,  color:'#0254CC', bg:'#EBF3FF' },
  { id:'commercial-property', label:'Commercial Property', Icon:Building2, color:'#0254CC', bg:'#EBF3FF' },
  { id:'commercial-auto',     label:'Commercial Auto',     Icon:Truck,     color:'#0254CC', bg:'#EBF3FF' },
  { id:'workers-comp',        label:"Workers' Comp",       Icon:HardHat,   color:'#2EB124', bg:'#EDFAEB' },
  { id:'agri',                label:'Commercial Agri',     Icon:Sprout,    color:'#2EB124', bg:'#EDFAEB' },
]

const LOBS = [
  { id:'auto'            as LOBKey, Icon:Car,       label:'Personal Auto',         desc:'Collision, theft, weather, and glass damage.',           href:'/claims/auto/new',  active:true, color:'#0254CC', bg:'#EBF3FF' },
  { id:'home'            as LOBKey, Icon:HomeIcon,  label:'Personal Home',         desc:'Wind/hail, fire, water damage, and theft.',              href:'/claims/home/new',  active:true, color:'#0254CC', bg:'#EBF3FF' },
  { id:'auto'            as LOBKey, Icon:AppWindow, label:'Glass / Windshield',    desc:'Chip repair or full replacement — same-day available.',  href:'/claims/glass/new', active:true, color:'#FABD00', bg:'#FFF8E1', tag:'Fast track' },
  { id:'commercial-auto' as LOBKey, Icon:Truck,     label:'Commercial Auto',       desc:'Fleet vehicles, cargo, DOT incidents.',                  href:'/claims/commercial-auto/new', active:true, color:'#0254CC', bg:'#EBF3FF' },
  { id:'commercial-property' as LOBKey, Icon:Building2, label:'Commercial Property', desc:'Business premises, equipment, inventory.',            href:'#', active:false, color:'#A0AEC0', bg:'#F5F8FF' },
  { id:'workers-comp'    as LOBKey, Icon:HardHat,   label:"Workers' Compensation", desc:'Employee injury, medical, and return-to-work.',          href:'#', active:false, color:'#A0AEC0', bg:'#F5F8FF' },
]

const FAQS: Record<LOBKey, { q: string; a: string }[]> = {
  auto: [
    { q:'How long does a personal auto claim take?', a:'Most auto claims resolve in 5–10 business days. Glass-only claims can be completed same-day. Complex multi-vehicle or liability disputes may take 2–4 weeks. You can track every milestone in real time through your claims dashboard.' },
    { q:'Will filing a claim raise my premium?', a:'Not necessarily. Comprehensive claims (weather, theft, glass) rarely affect premiums. At-fault collision claims may impact rates at renewal. Our team will explain any potential rate impact before finalizing your claim.' },
    { q:'What is a deductible and when do I pay it?', a:'Your deductible is your out-of-pocket portion before insurance pays. You typically pay it directly to the repair shop and we pay the remainder. If the other driver was at fault, we actively pursue subrogation to recover your deductible on your behalf.' },
    { q:'Do I need a police report to file a claim?', a:'A police report is strongly recommended for collisions, theft, and hit-and-run incidents. It validates your claim and speeds up adjuster review. If a report was not filed, contact us and our team can advise on next steps.' },
    { q:'What happens if the other driver is uninsured?', a:'If you carry Uninsured Motorist (UM) coverage, your own policy covers your damages and medical expenses. We will pursue the uninsured driver for recovery. Without UM coverage, your options are limited to a civil lawsuit against the at-fault driver.' },
    { q:'Can I choose my own repair shop?', a:'Yes. You may choose any licensed repair facility. We also maintain a network of certified Partner Shops offering lifetime warranties, direct billing, and priority scheduling typically available within 24-48 hours.' },
  ],
  home: [
    { q:'What does a standard homeowners policy (HO-3) cover?', a:'HO-3 covers your dwelling structure, other structures (garage, fence), personal property, additional living expenses (ALE), and personal liability. It covers all perils except those specifically excluded — most commonly flood and earthquake.' },
    { q:'How long does a home claim take?', a:'Simple claims (broken window, minor water damage) can resolve in 1-2 weeks. Storm or fire damage to the structure typically takes 4-12 weeks depending on contractor availability. ALE housing can be authorized within 2 hours of filing.' },
    { q:'What is my wind/hail deductible vs. all-other-perils?', a:'Most Texas HO-3 policies carry a separate wind/hail deductible expressed as a percentage of your dwelling coverage (typically 1-2%). Your all-other-perils deductible is a flat dollar amount. Your declarations page specifies both.' },
    { q:'Does homeowners insurance cover flooding?', a:'Standard HO-3 does not cover ground flooding or storm surge. Flood coverage requires a separate policy through the NFIP or a private flood insurer. We can help you determine what triggered your loss.' },
    { q:'What is Additional Living Expense (ALE) coverage?', a:'ALE covers reasonable costs to live elsewhere while your home is being repaired — hotel, meals above your normal budget, laundry, and pet boarding. Coverage is capped at your policy limit (typically 20-30% of dwelling) over a set time period.' },
    { q:'Can I make temporary repairs before the adjuster arrives?', a:'Yes — you are obligated to prevent further damage. Document everything with photos and keep all receipts. Temporary repair costs (tarps, board-ups) are typically reimbursable. Never make permanent repairs before adjuster approval.' },
  ],
  'commercial-property': [
    { q:'What is covered under a commercial property policy?', a:'Commercial property insurance covers your building, business personal property (equipment, inventory, furniture), and business income loss. Coverage can be extended to include equipment breakdown, inland marine, and spoilage depending on your policy form.' },
    { q:'How is business interruption (BI) calculated?', a:'BI pays for lost net income plus continuing expenses (rent, payroll) during the restoration period. It requires proof of historical revenue, fixed expenses, and projected income. The restoration period begins at the date of loss and ends when operations can reasonably resume.' },
    { q:'What is coinsurance and how does it affect my claim?', a:'A coinsurance clause requires you to insure your property to a minimum percentage of its replacement value (commonly 80-90%). Underinsuring triggers a coinsurance penalty — your claim payment is reduced proportionally to the amount you were underinsured.' },
    { q:'How long do commercial property claims take?', a:'Simple claims resolve in 1-2 weeks. Significant structural damage or business income losses may take 3-6 months. Complex multi-location or high-value losses often involve appraisal or engineering consultants.' },
    { q:'What documentation is needed to file?', a:'You will need your policy declarations, proof of ownership for damaged property, photos and videos of all damage, contractor estimates, financial records for BI claims, and an inventory of damaged business personal property with purchase receipts or values.' },
  ],
  'commercial-auto': [
    { q:'How do commercial auto claims differ from personal auto?', a:'Commercial auto claims involve fleet vehicles, cargo liability, higher coverage limits, and employees as drivers. Investigation is more thorough — driver records, hours of service logs, and vehicle maintenance records may all be reviewed.' },
    { q:'Does coverage extend to employee-owned vehicles?', a:'Only if your policy includes Hired and Non-Owned Auto (HNOA) coverage. This covers liability when employees use personal vehicles for business purposes. Without HNOA, claims arising from employee-owned vehicles may be excluded.' },
    { q:'How are multi-vehicle fleet accidents handled?', a:'Fleet accidents are triaged by severity. We assign a dedicated commercial adjuster who coordinates across all involved vehicles, drivers, and third parties simultaneously. Fleet telematics data can significantly accelerate the investigation.' },
    { q:'What is cargo liability and when does it apply?', a:'Cargo liability covers loss or damage to freight you are transporting. Coverage applies while goods are in your care, custody, or control. Exclusions commonly include improper packaging by the shipper and refrigeration breakdown.' },
    { q:'How quickly can a commercial vehicle be returned to service?', a:'Priority claims are fast-tracked for commercial operators. We work with mobile repair units and rental fleets to minimize downtime. For total losses, we aim to settle ACV within 5-7 business days from inspection completion.' },
  ],
  'workers-comp': [
    { q:'What should an employee do immediately after a workplace injury?', a:'Seek medical attention first. Notify your supervisor or HR as soon as possible — most states require reporting within 24-72 hours. Your employer must then notify the insurance carrier. Delayed reporting can jeopardize your claim.' },
    { q:'What medical treatment is covered?', a:'All reasonable and necessary medical treatment related to the work injury is covered — emergency care, surgeries, hospitalization, physical therapy, prescriptions, and travel to medical appointments. Treatment must be authorized through the designated occupational medicine provider network.' },
    { q:'How is the weekly compensation benefit calculated?', a:'Temporary Total Disability (TTD) benefits are typically 66 2/3% of the employee\'s average weekly wage, subject to state-mandated minimums and maximums. AWW is calculated from the prior 52 weeks of earnings. Benefits begin after the state-defined waiting period.' },
    { q:'What is a return-to-work (RTW) program?', a:'RTW programs allow injured employees to resume modified or light-duty work while recovering. They reduce lost time, maintain morale, and lower claim costs. Employers with RTW programs typically see 40-60% lower indemnity costs.' },
    { q:'How long can a workers comp claim stay open?', a:'Duration varies by state and injury severity. Simple soft-tissue claims may close in weeks. Permanent partial or total disability claims can remain open for years. Claims are typically closed via settlement or when maximum medical improvement (MMI) is reached.' },
  ],
  agri: [
    { q:'What types of agricultural losses are covered?', a:'Commercial agricultural policies typically cover crop damage (hail, drought, flood, frost, fire), livestock mortality, farm structures (barns, silos, equipment sheds), farm equipment and machinery, and agricultural product liability.' },
    { q:'How is a crop damage claim assessed?', a:'Adjusters conduct field inspections to measure yield loss. Damage is quantified against your established yield history or Actual Production History (APH). USDA Risk Management Agency (RMA) guidelines govern federal crop insurance assessments.' },
    { q:'What is Multi-Peril Crop Insurance (MPCI)?', a:'MPCI is a federally subsidized crop insurance product that protects against yield losses from most natural causes. It is sold through Approved Insurance Providers (AIPs) and reinsured by USDA-RMA. Coverage levels range from 50-85% of your APH yield.' },
    { q:'Does the policy cover livestock disease losses?', a:'Livestock mortality policies cover death from accident, illness, and specified diseases. Blanket policies cover entire herds; individual policies cover high-value animals. Widespread contagious disease events may be subject to government indemnity programs.' },
    { q:'How are farm equipment breakdown claims handled?', a:'Equipment breakdown coverage pays for sudden and accidental mechanical or electrical failure. Wear and tear and operator error are typically excluded. We work with certified agricultural equipment technicians for inspection and valuation.' },
    { q:'What documentation is needed for an agricultural claim?', a:'You will need your policy declarations, planting records, field maps, crop receipts or contracts, yield history (APH records), livestock records, veterinary records, equipment purchase invoices, and photos of all damaged crops, animals, or property.' },
  ],
}

export default function Home() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const { logoKey, setLogo, presets } = useLogo()
  const [activeLOB, setActiveLOB] = useState<LOBKey>('auto')
  const [openFAQ, setOpenFAQ]     = useState<number | null>(0)
  const [chatOpen, setChatOpen]   = useState(false)
  const [showBrand, setShowBrand] = useState(false)
  const [chatMsg, setChatMsg]     = useState('')
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
    <div className="min-h-screen font-body flex flex-col" style={{ background:'#F5F8FF' }}>

      {/* NAV */}
      <nav className="h-16 bg-primary-deep flex items-center justify-between px-5 md:px-8 sticky top-0 z-40"
        style={{ boxShadow:'0 2px 20px rgba(2,64,153,.3)' }}>
        <Link to="/"><VMlogo size="md" variant="full-light" /></Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBrand(v => !v)}
            className="hidden md:flex text-[11.5px] text-white/40 hover:text-white/70 transition-colors bg-transparent border-none cursor-pointer">
            Brand
          </button>
          {isAuthenticated
            ? <div className="flex items-center gap-3">
                <span className="hidden md:block text-[12px] text-white/50">Welcome, {user?.name?.split(' ')[0]}</span>
                <button onClick={() => { logout(); navigate('/') }}
                  className="text-[13px] text-white/50 hover:text-white bg-transparent border-none cursor-pointer transition-colors">
                  Log Out
                </button>
              </div>
            : <Link to="/login"
                className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                Log In
              </Link>
          }
        </div>
      </nav>

      {/* BRAND PANEL */}
      {showBrand && (
        <div className="bg-primary-deep border-b border-white/10 px-5 md:px-8 py-4 z-30">
          <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">Brand Switcher — Demo Tool</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, p]) => (
              <button key={key} onClick={() => { setLogo(key); setShowBrand(false) }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer transition-all ${logoKey===key?'bg-white text-primary-deep border-white':'bg-transparent text-white/60 border-white/20 hover:border-white/50'}`}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white" style={{ background: p.primaryColor }}>{p.initials}</div>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="bg-primary-deep px-5 md:px-[60px] py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 55% 60% at 75% 35%, rgba(250,189,0,.07) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 20% 70%, rgba(5,107,252,.1) 0%, transparent 60%)' }} />
        <div className="max-w-[560px] relative z-10">
          <div className="inline-flex items-center gap-2 border border-white/12 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white/70 mb-6"
            style={{ background:'rgba(250,189,0,.08)', borderColor:'rgba(250,189,0,.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Claims team available 24/7
          </div>
          <h1 className="font-display font-extrabold text-[34px] md:text-[46px] text-white leading-[1.1] mb-4 tracking-tight">
            Welcome to our<br />
            <span style={{ color:'#FABD00' }}>easy claims center</span>
          </h1>
          <p className="text-[14px] text-white/60 leading-relaxed mb-8 max-w-[440px]">
            File a new claim or track an existing one. Most claims resolved in under 7 days.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => navigate('/file-claim')}
              className="font-bold text-[15px] px-7 py-3.5 rounded-full border-none cursor-pointer transition-all text-primary-deep"
              style={{ background:'#FABD00', boxShadow:'0 4px 20px rgba(250,189,0,.3)' }}>
              File a Claim
            </button>
            <Link to="/track"
              className="font-bold text-[15px] px-7 py-3.5 rounded-full text-white transition-all"
              style={{ border:'2px solid rgba(255,255,255,.35)' }}>
              Track a Claim
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <button onClick={() => navigate('/claims/third-party/new')}
              className="text-[12.5px] text-white/45 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
              Claims for non-customers
            </button>
            <button onClick={() => alert('Call 1-800-VM-CLAIMS and press 3 for roadside assistance.')}
              className="text-[12.5px] text-white/45 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
              Get roadside assistance
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-white border-b border-ui-border">
        {[
          { Icon:Clock,        val:'< 2 hrs', label:'Adjuster assigned'      },
          { Icon:Car,          val:'7 Days',  label:'Avg. auto resolution'   },
          { Icon:ThumbsUp,     val:'98.4%',   label:'Customer satisfaction'  },
          { Icon:HeadphonesIcon, val:'24/7',  label:'Claims team available'  },
        ].map(({ Icon, val, label }) => (
          <div key={label} className="text-center py-8 px-4 border-r border-ui-border last:border-r-0">
            <div className="flex justify-center mb-2">
              <Icon size={18} color="#0254CC" />
            </div>
            <div className="font-display font-extrabold text-[26px] md:text-[30px] text-primary-deep">{val}</div>
            <div className="text-[12.5px] text-text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* LOB GRID */}
      <div className="px-5 md:px-[60px] py-12 bg-white border-b border-ui-border">
        <h2 className="font-display font-extrabold text-[22px] md:text-[28px] text-text mb-2">What can we help you with?</h2>
        <p className="text-[14px] text-text-muted mb-8">Select the type of claim to get started.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {LOBS.map((lob, i) => (
            <div key={i}
              onClick={() => lob.active && navigate(lob.href)}
              className={`border border-ui-border rounded-2xl p-6 bg-white transition-all relative ${lob.active ? 'cursor-pointer hover:border-primary hover:bg-primary-pale hover:-translate-y-0.5 shadow-card' : 'opacity-50 cursor-not-allowed'}`}>
              {!lob.active && <span className="absolute top-3 right-3 text-[10px] bg-ui-bg border border-ui-border text-text-faint px-2 py-px rounded-full font-bold">Coming Soon</span>}
              {lob.tag && <span className="absolute top-3 right-3 text-[10px] px-2 py-px rounded-full font-bold" style={{ background:'#EDFAEB', color:'#2EB124', border:'1px solid #A8E4A2' }}>{lob.tag}</span>}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0" style={{ background:lob.bg }}>
                <lob.Icon size={20} color={lob.color} strokeWidth={1.75} />
              </div>
              <div className="text-[15px] font-bold text-text mb-1">{lob.label}</div>
              <div className="text-[12.5px] text-text-muted leading-relaxed">{lob.desc}</div>
              {lob.active && (
                <div className="mt-3 text-[13px] font-bold" style={{ color:'#0254CC' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="px-5 md:px-[60px] py-14 flex-1" style={{ background:'#F5F8FF' }}>
        <div className="text-[11.5px] font-bold text-text-muted uppercase tracking-widest mb-2">Frequently Asked Questions</div>
        <h2 className="font-display font-extrabold text-[24px] md:text-[30px] text-text mb-8">What can we help you with?</h2>

        {/* LOB tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {LOB_TABS.map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveLOB(tab.id); setOpenFAQ(0) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold border cursor-pointer transition-all ${
                activeLOB === tab.id
                  ? 'text-white border-primary-deep bg-primary-deep'
                  : 'bg-white text-text-secondary border-ui-border hover:border-primary hover:text-primary'
              }`}>
              <tab.Icon size={14} strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        <div className="max-w-[760px]">
          {FAQS[activeLOB].map((item, i) => (
            <div key={i} className="border-t border-ui-border last:border-b">
              <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left bg-transparent border-none cursor-pointer group">
                <span className={`text-[14.5px] font-semibold pr-6 leading-snug transition-colors ${openFAQ===i?'text-primary-deep':'text-text-secondary group-hover:text-text'}`}>
                  {item.q}
                </span>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${openFAQ===i?'border-primary-deep text-primary-deep':'border-ui-border text-text-muted group-hover:border-primary group-hover:text-primary'}`}>
                  {openFAQ===i ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>
              {openFAQ === i && (
                <div className="pb-5 pr-10">
                  <p className="text-[13.5px] text-text-secondary leading-[1.75]">{item.a}</p>
                  <button onClick={() => navigate('/file-claim')}
                    className="mt-4 text-[12.5px] font-bold text-primary hover:underline bg-transparent border-none cursor-pointer">
                    File a {LOB_TABS.find(t => t.id === activeLOB)?.label} claim →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-8 max-w-[760px] pt-6 border-t border-ui-border">
          <button onClick={() => setChatOpen(true)}
            className="btn btn-primary flex items-center gap-2 text-[13px]">
            <MessageSquare size={14} />Chat with us
          </button>
          <a href="tel:18008262534" className="btn btn-ghost flex items-center gap-2 text-[13px]">
            <Phone size={14} />1-800-VM-CLAIMS
          </a>
          <a href="mailto:claims@valuemomentum.com" className="btn btn-ghost flex items-center gap-2 text-[13px]">
            <Mail size={14} />Email us
          </a>
        </div>
      </div>

      <Footer />

      {/* CHAT */}
      <button onClick={() => setChatOpen(v => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-primary-deep border-none cursor-pointer transition-all z-50"
        style={{ background:'#FABD00', boxShadow:'0 4px 20px rgba(250,189,0,.4)' }}>
        {chatOpen ? <ChevronDown size={22} color="#024099" /> : <MessageSquare size={22} color="#024099" />}
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-[320px] bg-white rounded-2xl z-50 flex flex-col overflow-hidden border border-ui-border"
          style={{ boxShadow:'0 8px 40px rgba(2,64,153,.18)' }}>
          <div className="bg-primary-deep px-4 py-3 flex items-center gap-3">
            <VMlogo size="sm" />
            <div>
              <div className="text-[13px] font-bold text-white">Claims Assistant</div>
              <div className="flex items-center gap-1.5 text-[11px] text-success-bright">
                <span className="w-1.5 h-1.5 rounded-full bg-success-bright animate-pulse" />Online
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="ml-auto text-white/40 hover:text-white bg-transparent border-none cursor-pointer text-[18px]">×</button>
          </div>
          <div className="flex flex-col gap-3 p-3.5 max-h-[220px] overflow-y-auto" style={{ background:'#F5F8FF' }}>
            {chatHistory.map((m,i) => (
              <div key={i} className={`max-w-[85%] ${m.from==='user'?'self-end':'self-start'}`}>
                <div className={`px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed ${m.from==='agent'?'bg-white border border-ui-border text-text':'bg-primary-deep text-white/90'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-ui-border">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key==='Enter' && sendChat()}
              placeholder="Type a message…"
              className="flex-1 text-[12.5px] border border-ui-border rounded-lg px-3 py-2 outline-none font-body text-text"
              style={{ background:'#F5F8FF' }} />
            <button onClick={sendChat}
              className="text-primary-deep border-none rounded-lg px-3 py-2 cursor-pointer text-[12px] font-bold"
              style={{ background:'#FABD00' }}>Send</button>
          </div>
        </div>
      )}
    </div>
  )
}
