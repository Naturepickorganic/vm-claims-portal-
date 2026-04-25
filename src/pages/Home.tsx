import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LOBS = [
  { icon:'🚗', name:'Personal Auto',       desc:'Collision, theft, weather, glass. Most claims resolved in 7 days.',         href:'/claims/auto/new', active:true  },
  { icon:'🏠', name:'Personal Property',   desc:'Homeowners, wind/hail, fire, water. Property adjuster within 2 hours.',     href:'/claims/home/new', active:true  },
  { icon:'🏢', name:'Commercial Property', desc:'Business premises, equipment, inventory. Dedicated commercial adjusters.',   href:'#',                active:false },
  { icon:'🚚', name:'Commercial Auto',     desc:'Fleet vehicles, cargo, liability. Multi-vehicle claims on one dashboard.',    href:'#',                active:false },
  { icon:'👷', name:"Workers' Comp",       desc:'Employee injuries, medical coordination, return-to-work support.',           href:'#',                active:false },
  { icon:'🪟', name:'Glass / Windshield',  desc:'Chip repair or full replacement. Same-day mobile technicians.',              href:'#',                active:false },
]

export default function Home() {
  const navigate = useNavigate()
  const [trackId, setTrackId] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { from: 'agent', text: 'Hi! I\'m your virtual claims assistant. How can I help you today?' }
  ])

  const handleTrack = () => {
    if (trackId.trim()) navigate(`/claims/auto/${trackId.trim()}/status`)
  }

  const sendChat = () => {
    if (!chatMsg.trim()) return
    const userMsg = { from: 'user', text: chatMsg }
    setChatHistory(h => [...h, userMsg])
    setChatMsg('')
    setTimeout(() => {
      setChatHistory(h => [...h, { from: 'agent', text: 'Thank you! Let me connect you with a claims specialist. In the meantime, you can file a claim or track an existing one above.' }])
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-bg font-body">

      {/* NAV */}
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">VM</div>
          <span className="font-display font-bold text-[15px] text-white">ValueMomentum <span className="text-[#FF8099]">Claims</span></span>
        </div>
        <div className="flex items-center gap-3 md:gap-5">
          <a href="#lobs"  className="hidden md:block text-[13px] text-white/55 hover:text-white transition-colors">Coverage</a>
          <a href="#track" className="hidden md:block text-[13px] text-white/55 hover:text-white transition-colors">Track a Claim</a>
          <button onClick={() => alert('Login coming soon — Auth (Okta/Auth0) is in the next sprint.')}
            className="text-[13px] font-semibold text-white border border-white/30 px-4 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
            Log In
          </button>
          <button onClick={() => navigate('/claims/auto/new')} className="btn btn-primary text-[13px] px-4 py-2">File a Claim</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#1A3050] px-5 md:px-[60px] py-14 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 60% 50% at 70% 40%,rgba(200,16,46,.12) 0%,transparent 70%)' }} />
        <div className="max-w-[560px] relative z-10">
          <h1 className="font-display font-black text-[32px] md:text-[44px] text-white leading-[1.1] mb-3">
            Welcome to our<br /><em className="not-italic text-[#FF8099]">easy claims center</em>
          </h1>
          <p className="text-[14px] text-white/60 leading-relaxed mb-8 max-w-[440px]">
            File a new claim or track an existing one. Our team is available 24/7.
          </p>
          {/* Primary CTAs — like State Farm */}
          <div className="flex flex-wrap gap-3 mb-10">
            <button onClick={() => navigate('/claims/auto/new')}
              className="flex items-center gap-2 bg-red text-white font-bold text-[15px] px-7 py-3.5 rounded-full hover:bg-red-dark transition-all shadow-red">
              File a Claim
            </button>
            <button onClick={() => document.getElementById('track')?.scrollIntoView({ behavior:'smooth' })}
              className="flex items-center gap-2 bg-transparent text-white font-bold text-[15px] px-7 py-3.5 rounded-full border-2 border-white/40 hover:border-white hover:bg-white/10 transition-all">
              Track a Claim
            </button>
          </div>
          {/* Quick links — like State Farm's bottom row */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              { icon:'📋', label:'Claims for non-customers', note:'(third-party claims)' },
              { icon:'🛣️', label:'Get roadside assistance'  },
            ].map(l => (
              <button key={l.label} onClick={() => alert('Coming soon in next sprint.')}
                className="flex items-center gap-2 text-[12.5px] text-white/50 hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer">
                <span>{l.icon}</span>{l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TRACK A CLAIM */}
      <div className="bg-white px-5 md:px-[60px] py-10 border-b border-border" id="track">
        <h2 className="font-display font-black text-[20px] md:text-[24px] text-navy mb-2">Track Your Claim</h2>
        <p className="text-[13.5px] text-muted mb-5">Enter your claim number to see the latest status, adjuster notes, and repair updates.</p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-[480px]">
          <input
            value={trackId}
            onChange={e => setTrackId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTrack()}
            placeholder="e.g. CLM-2025-AUTO-04821"
            className="flex-1 border border-border rounded-xl px-4 py-3 text-[13.5px] text-navy outline-none focus:border-red focus:ring-2 focus:ring-red/10 font-body"
          />
          <button onClick={handleTrack} className="btn btn-primary px-6 py-3 whitespace-nowrap">Track Status →</button>
        </div>
        <p className="text-[11.5px] text-faint mt-3">
          💡 Demo: try <button onClick={() => { setTrackId('CLM-2025-AUTO-04821'); setTimeout(handleTrack, 100) }}
            className="text-red underline bg-transparent border-none cursor-pointer font-body text-[11.5px]">CLM-2025-AUTO-04821</button> to see a live claim status
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-5 md:px-[60px] py-10 bg-bg">
        {[['< 2 hrs','Adjuster assigned'],['7 Days','Avg. auto resolution'],['98.4%','Customer satisfaction'],['24/7','Claims team available']].map(([v,l]) => (
          <div key={l} className="text-center">
            <div className="font-display font-black text-[26px] md:text-[32px] text-navy">{v}</div>
            <div className="text-[12.5px] text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* WHAT CAN WE HELP WITH */}
      <div className="px-5 md:px-[60px] py-12 md:py-16 bg-white" id="lobs">
        <h2 className="font-display font-black text-[22px] md:text-[28px] text-navy mb-2">What can we help you with?</h2>
        <p className="text-[14px] text-muted mb-8">Select the type of claim to get started.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {LOBS.map(lob => (
            <div key={lob.name}
              onClick={() => lob.active && navigate(lob.href)}
              className={`border border-border rounded-2xl p-6 transition-all bg-white ${lob.active ? 'cursor-pointer hover:border-red hover:bg-red-light hover:-translate-y-0.5 hover:shadow-card' : 'opacity-50 cursor-not-allowed'}`}>
              <div className="text-[30px] mb-3">{lob.icon}</div>
              <div className="text-[15px] font-bold text-navy mb-1 flex items-center gap-2">
                {lob.name}
                {!lob.active && <span className="text-[10px] bg-bg border border-border text-faint px-2 py-px rounded-full font-bold">Coming Soon</span>}
              </div>
              <div className="text-[12.5px] text-muted leading-relaxed">{lob.desc}</div>
              {lob.active && <div className="text-[18px] text-red mt-3">→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* LEARN ABOUT THE PROCESS */}
      <div className="px-5 md:px-[60px] py-12 bg-bg border-t border-border">
        <div className="max-w-[700px]">
          <div className="text-[13px] text-muted uppercase tracking-widest font-bold mb-2">Learn about the claims process</div>
          <h2 className="font-display font-black text-[24px] md:text-[32px] text-navy mb-8">First, tell us what happened.</h2>
          <div className="flex flex-col gap-0">
            {[
              { title:'Car Accident',        desc:'Filing is fast and easy online. Check status, find a shop, set up direct deposit, and more.',  steps:['Tell us what happened','We\'ll check it out','Get an estimate and repairs','We\'ll arrange payment less your deductible','Back on the road!'] },
              { title:'Wind or Hail Damage', desc:'Storm damage to your home or vehicle. We verify with NOAA data and assign an adjuster within 2 hours.', steps:null },
              { title:'Water Damage',        desc:'Burst pipe, flood, or leak. Emergency mitigation covered — we handle contractors directly.', steps:null },
              { title:'Theft or Vandalism',  desc:'File a police report first, then file your claim online. We process most theft claims within 5 days.', steps:null },
            ].map((item, i) => (
              <details key={item.title} className="border-t border-border py-4 group">
                <summary className="flex items-center justify-between cursor-pointer list-none text-[16px] font-semibold text-navy">
                  {item.title}
                  <span className="text-muted group-open:rotate-180 transition-transform">∨</span>
                </summary>
                <div className="mt-3 text-[13.5px] text-muted leading-relaxed">
                  {item.desc}
                  {item.steps && (
                    <ol className="mt-3 flex flex-col gap-1.5">
                      {item.steps.map((s, j) => <li key={j} className="flex gap-2"><span className="text-red font-bold">{j+1}.</span>{s}</li>)}
                    </ol>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* TRUST BAR */}
      <div className="bg-navy px-5 md:px-[60px] py-5 flex flex-wrap gap-4 md:justify-between items-center">
        {['🔒 SOC 2 Type II','⚡ 2-Hour Adjuster','📱 File from Any Device','🏠 Auto + Home','⭐ 98.4% CSAT'].map(t => (
          <div key={t} className="text-[12px] text-white/55">{t}</div>
        ))}
      </div>

      {/* FLOATING CHAT BUTTON */}
      <button
        onClick={() => setChatOpen(v => !v)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red rounded-full flex items-center justify-center text-white text-[24px] shadow-[0_4px_20px_rgba(200,16,46,.4)] hover:bg-red-dark transition-all z-50 border-none cursor-pointer">
        {chatOpen ? '✕' : '💬'}
      </button>

      {/* CHAT WIDGET */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-[320px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,.18)] z-50 flex flex-col overflow-hidden border border-border">
          <div className="bg-navy px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center text-white text-[13px] font-bold">VM</div>
            <div>
              <div className="text-[13px] font-bold text-white">Claims Assistant</div>
              <div className="flex items-center gap-1.5 text-[11px] text-green-300">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-3.5 max-h-[260px] overflow-y-auto bg-bg">
            {chatHistory.map((m, i) => (
              <div key={i} className={`max-w-[85%] ${m.from === 'user' ? 'self-end' : 'self-start'}`}>
                <div className={`px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed ${m.from === 'agent' ? 'bg-white border border-border text-navy rounded-bl-sm' : 'bg-navy text-white/90 rounded-br-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-border bg-white">
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Type a message…"
              className="flex-1 text-[12.5px] text-navy border border-border rounded-lg px-3 py-2 outline-none focus:border-red font-body" />
            <button onClick={sendChat} className="bg-red text-white border-none rounded-lg px-3 py-2 cursor-pointer text-[12px] font-bold hover:bg-red-dark transition-colors">Send</button>
          </div>
          <div className="px-3 pb-2.5 text-center">
            <button onClick={() => navigate('/claims/auto/new')} className="text-[11.5px] text-red font-semibold hover:underline bg-transparent border-none cursor-pointer">File a Claim →</button>
            <span className="text-faint mx-2 text-[11px]">|</span>
            <button onClick={() => document.getElementById('track')?.scrollIntoView({ behavior:'smooth' })} className="text-[11.5px] text-red font-semibold hover:underline bg-transparent border-none cursor-pointer">Track a Claim →</button>
          </div>
        </div>
      )}
    </div>
  )
}
