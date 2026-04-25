import { useNavigate } from 'react-router-dom'

const LOBS = [
  { icon:'🚗', name:'Personal Auto',      desc:'Collision, theft, weather, glass. Most claims resolved in 7 days.',            href:'/claims/auto/new', active:true  },
  { icon:'🏠', name:'Personal Property',  desc:'Homeowners, wind/hail, fire, water. Property adjuster within 2 hours.',        href:'/claims/home/new', active:true  },
  { icon:'🏢', name:'Commercial Property',desc:'Business premises, equipment, inventory. Dedicated commercial adjusters.',     href:'#',                active:false },
  { icon:'🚚', name:'Commercial Auto',    desc:'Fleet vehicles, cargo, liability. Multi-vehicle claims on one dashboard.',      href:'#',                active:false },
  { icon:'👷', name:"Workers' Comp",      desc:'Employee injuries, medical coordination, return-to-work support.',             href:'#',                active:false },
  { icon:'🪟', name:'Glass / Windshield', desc:'Chip repair or full replacement. Same-day mobile technicians.',                href:'#',                active:false },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg font-body">
      {/* NAV */}
      <nav className="h-16 bg-navy flex items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] rounded-lg bg-red flex items-center justify-center font-display font-black text-[15px] text-white">VM</div>
          <span className="font-display font-bold text-[15px] text-white">ValueMomentum <span className="text-[#FF8099]">Claims</span></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#lobs" className="hidden md:block text-[13px] text-white/55 hover:text-white transition-colors">Coverage Types</a>
          <button onClick={() => navigate('/claims/auto/new')} className="btn btn-primary text-[13px] px-4 py-2">File a Claim</button>
        </div>
      </nav>

      {/* HERO */}
      <div className="bg-gradient-to-br from-navy via-navy-mid to-[#1A3050] min-h-[420px] md:min-h-[460px] flex items-center px-5 md:px-[60px] py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 60% 50% at 70% 40%,rgba(200,16,46,.12) 0%,transparent 70%)' }} />
        <div className="max-w-[520px] relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/12 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold text-white/70 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Claims team available 24/7
          </div>
          <h1 className="font-display font-black text-[34px] md:text-[46px] text-white leading-[1.1] mb-4">
            File a Claim.<br /><em className="not-italic text-[#FF8099]">Get Back</em> to Normal.
          </h1>
          <p className="text-[14px] md:text-[15px] text-white/60 leading-relaxed mb-8 max-w-[440px]">
            Auto claims resolve in under 7 days. Property adjusters assigned in 2 hours. We handle everything — towing to settlement.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/claims/auto/new')} className="btn btn-primary text-[14px] px-6 py-3">🚗 Auto Claim →</button>
            <button onClick={() => navigate('/claims/home/new')} className="btn text-[14px] px-5 py-3 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all">🏠 Home Claim →</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-5 md:px-[60px] py-10 bg-white">
        {[['< 2 hrs','Adjuster assigned after filing'],['7 Days','Avg. auto claim resolution'],['98.4%','Customer satisfaction'],['50 States','Coverage nationwide']].map(([v,l]) => (
          <div key={l} className="text-center">
            <div className="font-display font-black text-[26px] md:text-[32px] text-navy">{v}</div>
            <div className="text-[12.5px] text-muted mt-1">{l}</div>
          </div>
        ))}
      </div>

      {/* LOBS */}
      <div className="px-5 md:px-[60px] py-12 md:py-16 bg-bg" id="lobs">
        <h2 className="font-display font-black text-[22px] md:text-[28px] text-navy mb-2">What can we help you with?</h2>
        <p className="text-[14px] text-muted mb-8">Select the type of claim to get started.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {LOBS.map(lob => (
            <div key={lob.name}
              onClick={() => lob.active && navigate(lob.href)}
              className={`border border-border rounded-2xl p-6 transition-all bg-white ${lob.active ? 'cursor-pointer hover:border-red hover:bg-red-light hover:-translate-y-0.5 hover:shadow-card' : 'opacity-55 cursor-not-allowed'}`}>
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

      {/* TRUST BAR */}
      <div className="bg-navy px-5 md:px-[60px] py-5 flex flex-wrap gap-4 md:justify-between items-center">
        {['🔒 SOC 2 Type II','⚡ 2-Hour Adjuster','📱 File from Any Device','🏠 Auto + Home','⭐ 98.4% CSAT'].map(t => (
          <div key={t} className="text-[12px] text-white/55">{t}</div>
        ))}
      </div>
    </div>
  )
}
