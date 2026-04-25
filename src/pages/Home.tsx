import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogo } from '@/lib/logoConfig'

const LOBS = [
  { icon:'🚗', name:'Personal Auto',       desc:'Collision, theft, weather, glass. Most claims resolved in 7 days.',         href:'/claims/auto/new', active:true  },
  { icon:'🏠', name:'Personal Property',   desc:'Homeowners, wind/hail, fire, water. Property adjuster within 2 hours.',     href:'/claims/home/new', active:true  },
  { icon:'🏢', name:'Commercial Property', desc:'Business premises, equipment, inventory. Dedicated commercial adjusters.',   href:'#',                active:false },
  { icon:'🚚', name:'Commercial Auto',     desc:'Fleet vehicles, cargo, liability. Multi-vehicle claims on one dashboard.',   href:'#',                active:false },
  { icon:'👷', name:"Workers' Comp",       desc:'Employee injuries, medical coordination, return-to-work support.',           href:'#',                active:false },
  { icon:'🪟', name:'Glass / Windshield',  desc:'Chip repair or full replacement. Same-day mobile technicians.',              href:'#',                active:false },
]

const CLAIMS_PROCESS = [
  {
    lob: '🚗 Personal Auto',
    items: [
      { title:'Car Accident', desc:'File online in minutes. Check status, find a shop, set up direct deposit, and more.', steps:['Tell us what happened','We assign an adjuster within 2 hours','Get an estimate and repairs','We arrange payment less your deductible','Back on the road!'] },
      { title:'Wind or Hail Damage', desc:'Storm damage verified against NOAA weather data. Most vehicle claims resolved in 5 days.' },
      { title:'Theft or Vandalism', desc:'File a police report first, then file your claim. We process most theft claims within 5 business days.' },
      { title:'Damaged Windshield', desc:'Chip repair or full replacement. Same-day mobile technicians available in most areas.' },
      { title:'Animal Strike', desc:'Covered under comprehensive. File online and we guide you through the repair process.' },
    ]
  },
  {
    lob: '🏠 Personal Property',
    items: [
      { title:'Wind or Hail Damage', desc:'Storm damage to your home. We verify with NOAA data and assign a property adjuster within 2 hours.', steps:['File your claim online','Adjuster assigned within 2 hours','Inspection and damage assessment','Repair authorization and contractor','Final payment and closure'] },
      { title:'Water Damage', desc:'Burst pipe, flood, or appliance leak. Emergency mitigation covered — we handle contractors directly.' },
      { title:'Fire or Smoke', desc:'We coordinate with emergency services and begin the restoration process immediately.' },
      { title:'Theft / Burglary', desc:'File a police report, then your claim. Contents coverage applies to personal property inside your home.' },
      { title:'Additional Living Expenses', desc:'If your home is uninhabitable, we cover hotel, meals, and temporary housing up to your policy limit.' },
    ]
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { logo, logoKey, setLogo, presets } = useLogo()
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [showLogoPanel, setShowLogoPanel] = useState(false)
  const [openLob, setOpenLob] = useState<string|null>('🚗 Personal Auto')
  const [openItem, setOpenItem] = useState<string|null>('Car Accident')
  const [chatHistory, setChatHistory] = useState([
    { from:'agent', text:"Hi! I am your virtual claims assistant. How can I help you today?" }
  ])

  const sendChat = () => {
    if (!chatMsg.trim()) return
    setChatHistory(h => [...h, { from:'user', text:chatMsg }])
    setChatMsg('')
    setTimeout(() => setChatHistory(h => [...h, { from:'agent', text:'Thank you! A claims specialist will follow up shortly. You can also file or track a claim above.' }]), 1000)
  }

  return (
    <div className="min-h-screen bg-bg font-body">

      {/* NAV */}
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          {logo.type === 'image'
            ? <img src={logo.src} alt={logo.name} className="h-8 object-contain" />
            : <div className="flex items-center gap-2">
                <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">{logo.initials}</div>
                <span className="font-display font-bold text-[15px] text-white">{logo.name} <span className="text-[#FF8099]">Claims</span></span>
              </div>
          }
        </Link>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowLogoPanel(v => !v)}
            className="hidden md:flex items-center gap-1.5 text-[11.5px] text-white/40 hover:text-white/70 transition-colors bg-transparent border-none cursor-pointer">
            🎨 Brand
          </button>
          <Link to="/login" className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            Log In
          </Link>
        </div>
      </nav>

      {/* LOGO SWITCHER PANEL */}
      {showLogoPanel && (
        <div className="bg-navy border-b border-white/10 px-5 md:px-8 py-4">
          <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3">🎨 Brand Switcher</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(presets).map(([key, p]) => (
              <button key={key} onClick={() => { setLogo(key); setShowLogoPanel(false) }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer transition-all ${logoKey===key ? 'bg-white text-navy border-white' : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'}`}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white" style={{ background: p.primaryColor }}>{p.initials}</div>
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-[10.5px] text-white/25 mt-2">Brand selection persists in localStorage. In production, load from carrier config API.</p>
        </div>
      )}

      {/* HERO */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#1A3050] px-5 md:px-[60px] py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background:'radial-gradient(ellipse 60% 50% at 70% 40%,rgba(200,16,46,.12) 0%,transparent 70%)' }} />
        <div className="max-w-[560px] relative z-10">
          <h1 className="font-display font-black text-[32px] md:text-[44px] text-white leading-[1.1] mb-3">
            Welcome to our<br /><em className="not-italic text-[#FF8099]">easy claims center</em>
          </h1>
          <p className="text-[14px] text-white/60 leading-relaxed mb-8 max-w-[440px]">
            File a new claim or track an existing one. Our team is available 24/7.
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <button onClick={() => navigate('/claims/auto/new')}
              className="flex items-center gap-2 bg-red text-white font-bold text-[15px] px-7 py-3.5 rounded-full hover:bg-red-dark transition-all shadow-red border-none cursor-pointer">
              File a Claim
            </button>
            <Link to="/track"
              className="flex items-center gap-2 bg-transparent text-white font-bold text-[15px] px-7 py-3.5 rounded-full border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all">
              Track a Claim
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <button onClick={() => alert('Third-party claims coming soon.')}
              className="flex items-center gap-2 text-[12.5px] text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
              📋 Claims for non-customers
            </button>
            <button onClick={() => alert('Call 1-800-VM-CLAIMS press 3 for roadside assistance.')}
              className="flex items-center gap-2 text-[12.5px] text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
              🛣️ Get roadside assistance
            </button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-5 md:px-[60px] py-10 bg-white border-b border-border">
        {[['< 2 hrs','Adjuster assigned'],['7 Days','Avg. auto resolution'],['98.4%','Customer satisfaction'],['24/7','Claims team available']].map(([v,l]) => (
          <div key={l} className="text-center">
            <div className="font-display font-black text-[26px] md:text-[32px] text-navy">{v}</div>
            <div className="text-[12.5px] text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* WHAT CAN WE HELP WITH */}
      <div className="px-5 md:px-[60px] py-12 bg-bg" id="lobs">
        <h2 className="font-display font-black text-[22px] md:text-[28px] text-navy mb-2">What can we help you with?</h2>
        <p className="text-[14px] text-muted mb-8">Select the type of claim to get started.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {LOBS.map(lob => (
            <div key={lob.name} onClick={() => lob.active && navigate(lob.href)}
              className={`border border-border rounded-2xl p-6 transition-all bg-white ${lob.active ? 'cursor-pointer hover:border-red hover:bg-red-light hover:-translate-y-0.5 hover:shadow-card' : 'opacity-50 cursor-not-allowed'}`}>
              <div className="text-[30px] mb-3">{lob.icon}</div>
              <div className="text-[15px] font-bold text-navy mb-1 flex items-center gap-2">
                {lob.name}
                {!lob.active && <span className="text-[10px] bg-bg border border-border text-faint px-2 py-px rounded-full font-bold">Coming Soon</span>}
              </div>
              <div className="text-[12.5px] text-muted leading-relaxed">{lob.desc}</div>
              {lob.active && <div className="text-[18px] text-red mt-3">arrow</div>}
            </div>
          ))}
        </div>
      </div>

      {/* LEARN ABOUT THE CLAIMS PROCESS */}
      <div className="px-5 md:px-[60px] py-12 bg-white border-t border-border">
        <div className="max-w-[760px]">
          <div className="text-[13px] text-muted uppercase tracking-widest font-bold mb-2">Learn about the claims process</div>
          <h2 className="font-display font-black text-[24px] md:text-[32px] text-navy mb-8">First, tell us what happened.</h2>
          {CLAIMS_PROCESS.map(section => (
            <div key={section.lob} className="mb-2">
              <button onClick={() => setOpenLob(openLob === section.lob ? null : section.lob)}
                className="w-full flex items-center justify-between py-4 border-t-2 border-navy text-left bg-transparent border-l-0 border-r-0 border-b-0 cursor-pointer">
                <span className="text-[17px] font-bold text-navy">{section.lob}</span>
                <span className={`text-muted text-[20px] transition-transform duration-200 ${openLob === section.lob ? 'rotate-180' : ''}`}>v</span>
              </button>
              {openLob === section.lob && (
                <div className="flex flex-col border-b border-border mb-2">
                  {section.items.map(item => (
                    <div key={item.title}>
                      <button onClick={() => setOpenItem(openItem === item.title ? null : item.title)}
                        className="w-full flex items-center justify-between py-3 px-2 text-left bg-transparent border-none cursor-pointer hover:bg-bg transition-colors">
                        <span className="text-[14.5px] font-semibold text-navy">{item.title}</span>
                        <span className={`text-muted text-[16px] transition-transform duration-200 ${openItem === item.title ? 'rotate-180' : ''}`}>v</span>
                      </button>
                      {openItem === item.title && (
                        <div className="px-2 pb-4 text-[13px] text-slate leading-relaxed">
                          <p>{item.desc}</p>
                          {item.steps && (
                            <ol className="mt-3 flex flex-col gap-1.5">
                              {item.steps.map((s,j) => <li key={j} className="flex gap-2"><span className="text-red font-bold flex-shrink-0">{j+1}.</span>{s}</li>)}
                            </ol>
                          )}
                          <button onClick={() => navigate(section.lob.includes('Auto') ? '/claims/auto/new' : '/claims/home/new')}
                            className="mt-4 text-[12.5px] font-bold text-red hover:underline bg-transparent border-none cursor-pointer">
                            File a {item.title} claim
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TRUST BAR */}
      <div className="bg-navy px-5 md:px-[60px] py-5 flex flex-wrap gap-4 md:justify-between items-center">
        {['🔒 SOC 2 Type II','⚡ 2-Hour Adjuster','📱 File from Any Device','🏠 Auto + Home','⭐ 98.4% CSAT'].map(t => (
          <div key={t} className="text-[12px] text-white/55">{t}</div>
        ))}
      </div>

      {/* FLOATING CHAT BUTTON */}
      <button onClick={() => setChatOpen(v => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red rounded-full flex items-center justify-center text-white text-[24px] shadow-[0_4px_20px_rgba(200,16,46,.4)] hover:bg-red-dark transition-all z-50 border-none cursor-pointer">
        {chatOpen ? 'x' : '💬'}
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-[320px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,.18)] z-50 flex flex-col overflow-hidden border border-border">
          <div className="bg-navy px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center text-white text-[13px] font-bold">{logo.initials}</div>
            <div><div className="text-[13px] font-bold text-white">Claims Assistant</div><div className="flex items-center gap-1.5 text-[11px] text-green-300"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Online</div></div>
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
          <div className="px-3 pb-2.5 flex justify-center gap-4">
            <button onClick={() => navigate('/claims/auto/new')} className="text-[11.5px] text-red font-semibold bg-transparent border-none cursor-pointer">File a Claim</button>
            <Link to="/track" className="text-[11.5px] text-red font-semibold">Track a Claim</Link>
          </div>
        </div>
      )}
    </div>
  )
}
