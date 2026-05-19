import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Car, Home as HomeIcon, Building2, Truck, HardHat, Sprout,
  AppWindow, MessageSquare, Phone, Mail, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useLogo } from '@/lib/logoConfig'
import { useAuth } from '@/lib/authContext'
import Footer from '@/components/layout/Footer'
import VMlogo from '@/components/ui/VMlogo'
import ClaimsAssistant from '@/components/ClaimsAssistant'

/* ── Brand constants — no Tailwind dependency ───────────── */
const VM = {
  navy:        '#024099',
  blue:        '#0254CC',
  blueBright:  '#056BFC',
  bluePale:    '#EBF3FF',
  gold:        '#FABD00',
  goldLight:   '#FFF8E1',
  green:       '#2EB124',
  greenLight:  '#EDFAEB',
  border:      '#E2E8F2',
  bg:          '#F5F8FF',
  textDark:    '#1A2744',
  textMid:     '#4A5568',
  textLight:   '#718096',
  white:       '#FFFFFF',
}

type LOBKey = 'auto' | 'home' | 'commercial-property' | 'commercial-auto' | 'workers-comp' | 'agri'

const LOB_TABS = [
  { id:'auto'                as LOBKey, label:'Personal Auto',       Icon:Car       },
  { id:'home'                as LOBKey, label:'Personal Home',       Icon:HomeIcon  },
  { id:'commercial-property' as LOBKey, label:'Commercial Property', Icon:Building2 },
  { id:'commercial-auto'     as LOBKey, label:'Commercial Auto',     Icon:Truck     },
  { id:'workers-comp'        as LOBKey, label:"Workers' Comp",       Icon:HardHat   },
  { id:'agri'                as LOBKey, label:'Commercial Agri',     Icon:Sprout    },
]

const LOBS = [
  { Icon:Car,       label:'Personal Auto',          desc:'Collision, theft, weather, and glass damage.',          href:'/claims/auto/new',             active:true,  color:VM.blue,  bg:VM.bluePale,  tag:''           },
  { Icon:HomeIcon,  label:'Personal Home',          desc:'Wind/hail, fire, water damage, and theft.',             href:'/claims/home/new',             active:true,  color:VM.blue,  bg:VM.bluePale,  tag:''           },
  { Icon:AppWindow, label:'Glass / Windshield',     desc:'Chip repair or full replacement — same-day available.', href:'/claims/glass/new',            active:true,  color:VM.gold,  bg:VM.goldLight, tag:'Fast track' },
  { Icon:Truck,     label:'Commercial Auto',        desc:'Fleet vehicles, cargo, DOT incidents.',                 href:'/claims/commercial-auto/new',  active:true,  color:VM.blue,  bg:VM.bluePale,  tag:''           },
  { Icon:Building2, label:'Commercial Property',    desc:'Business premises, equipment, inventory.',              href:'#',                            active:false, color:'#A0AEC0', bg:VM.bg,        tag:''           },
  { Icon:HardHat,   label:"Workers' Compensation",  desc:'Employee injury, medical, and return-to-work.',         href:'#',                            active:false, color:'#A0AEC0', bg:VM.bg,        tag:''           },
]

const FAQS: Record<LOBKey, { q: string; a: string }[]> = {
  auto: [
    { q:'How long does a personal auto claim take?',       a:'Most auto claims resolve in 5–10 business days. Glass-only claims can be completed same-day. Complex multi-vehicle or liability disputes may take 2–4 weeks. Track every milestone in real time through your claims dashboard.' },
    { q:'Will filing a claim raise my premium?',           a:'Not necessarily. Comprehensive claims (weather, theft, glass) rarely affect premiums. At-fault collision claims may impact rates at renewal. Our team will explain any potential rate impact before finalizing your claim.' },
    { q:'What is a deductible and when do I pay it?',      a:'Your deductible is your out-of-pocket portion before insurance pays. You typically pay it directly to the repair shop and we pay the remainder. If the other driver was at fault, we actively pursue subrogation to recover your deductible.' },
    { q:'Do I need a police report to file a claim?',      a:'A police report is strongly recommended for collisions, theft, and hit-and-run incidents. It validates your claim and speeds up adjuster review. If a report was not filed, contact us and our team can advise on next steps.' },
    { q:'What happens if the other driver is uninsured?',  a:'If you carry Uninsured Motorist (UM) coverage, your own policy covers your damages and medical expenses. We will pursue the uninsured driver for recovery. Without UM coverage, your options are limited to a civil lawsuit against the at-fault driver.' },
    { q:'Can I choose my own repair shop?',                a:'Yes. You may choose any licensed repair facility. We also maintain a network of certified Partner Shops offering lifetime warranties, direct billing, and priority scheduling typically available within 24–48 hours.' },
  ],
  home: [
    { q:'What does a standard homeowners policy (HO-3) cover?',         a:'HO-3 covers your dwelling structure, other structures, personal property, additional living expenses (ALE), and personal liability. It covers all perils except those specifically excluded — most commonly flood and earthquake.' },
    { q:'How long does a home claim take?',                             a:'Simple claims can resolve in 1–2 weeks. Storm or fire damage typically takes 4–12 weeks depending on contractor availability. ALE housing can be authorized within 2 hours of filing.' },
    { q:'What is my wind/hail deductible vs. all-other-perils?',       a:'Most Texas HO-3 policies carry a separate wind/hail deductible expressed as a percentage of your dwelling coverage (typically 1–2%). Your all-other-perils deductible is a flat dollar amount.' },
    { q:'Does homeowners insurance cover flooding?',                    a:'Standard HO-3 does not cover ground flooding or storm surge. Flood coverage requires a separate policy through the NFIP or a private flood insurer.' },
    { q:'What is Additional Living Expense (ALE) coverage?',           a:'ALE covers reasonable costs to live elsewhere while your home is being repaired — hotel, meals, laundry, and pet boarding. Coverage is capped at your policy limit (typically 20–30% of dwelling).' },
    { q:'Can I make temporary repairs before the adjuster arrives?',   a:'Yes — you are obligated to prevent further damage. Document everything with photos and keep all receipts. Temporary repair costs are typically reimbursable. Never make permanent repairs before adjuster approval.' },
  ],
  'commercial-property': [
    { q:'What is covered under a commercial property policy?',   a:'Commercial property insurance covers your building, business personal property, and business income loss. Coverage can be extended to include equipment breakdown and inland marine depending on your policy form.' },
    { q:'How is business interruption (BI) calculated?',        a:'BI pays for lost net income plus continuing expenses during the restoration period. It requires proof of historical revenue, fixed expenses, and projected income.' },
    { q:'What is coinsurance and how does it affect my claim?', a:'A coinsurance clause requires you to insure your property to a minimum percentage of its replacement value (commonly 80–90%). Underinsuring triggers a penalty — your claim payment is reduced proportionally.' },
    { q:'How long do commercial property claims take?',         a:'Simple claims resolve in 1–2 weeks. Significant structural damage or business income losses may take 3–6 months.' },
    { q:'What documentation is needed to file?',               a:'Policy declarations, proof of ownership, photos of damage, contractor estimates, financial records for BI claims, and inventory of damaged property with purchase receipts.' },
  ],
  'commercial-auto': [
    { q:'How do commercial auto claims differ from personal auto?',      a:'Commercial auto claims involve fleet vehicles, cargo liability, higher coverage limits, and employees as drivers. Driver records, hours of service logs, and vehicle maintenance records may all be reviewed.' },
    { q:'Does coverage extend to employee-owned vehicles?',             a:'Only if your policy includes Hired and Non-Owned Auto (HNOA) coverage. Without HNOA, claims arising from employee-owned vehicles may be excluded.' },
    { q:'How are multi-vehicle fleet accidents handled?',               a:'Fleet accidents are triaged by severity. We assign a dedicated commercial adjuster who coordinates across all involved vehicles, drivers, and third parties simultaneously.' },
    { q:'What is cargo liability and when does it apply?',              a:'Cargo liability covers loss or damage to freight you are transporting. Coverage applies while goods are in your care, custody, or control.' },
    { q:'How quickly can a commercial vehicle be returned to service?', a:'Priority claims are fast-tracked for commercial operators. We work with mobile repair units and rental fleets to minimize downtime.' },
  ],
  'workers-comp': [
    { q:'What should an employee do immediately after a workplace injury?', a:'Seek medical attention first. Notify your supervisor or HR as soon as possible — most states require reporting within 24–72 hours.' },
    { q:'What medical treatment is covered?',                             a:'All reasonable and necessary medical treatment related to the work injury — emergency care, surgeries, hospitalization, physical therapy, and prescriptions.' },
    { q:'How is the weekly compensation benefit calculated?',             a:'TTD benefits are typically 66⅔% of the employee\'s average weekly wage, subject to state-mandated minimums and maximums.' },
    { q:'What is a return-to-work (RTW) program?',                       a:'RTW programs allow injured employees to resume modified or light-duty work while recovering. Employers with RTW programs typically see 40–60% lower indemnity costs.' },
    { q:'How long can a workers comp claim stay open?',                   a:'Duration varies by state and injury severity. Claims are typically closed via settlement or when maximum medical improvement (MMI) is reached.' },
  ],
  agri: [
    { q:'What types of agricultural losses are covered?',        a:'Crop damage (hail, drought, flood, frost, fire), livestock mortality, farm structures, farm equipment, and agricultural product liability.' },
    { q:'How is a crop damage claim assessed?',                  a:'Adjusters conduct field inspections to measure yield loss against your Actual Production History (APH). USDA RMA guidelines govern federal crop insurance assessments.' },
    { q:'What is Multi-Peril Crop Insurance (MPCI)?',           a:'MPCI is a federally subsidized crop insurance product protecting against yield losses from most natural causes. Coverage levels range from 50–85% of your APH yield.' },
    { q:'Does the policy cover livestock disease losses?',       a:'Livestock mortality policies cover death from accident, illness, and specified diseases. Widespread disease events may be subject to government indemnity programs.' },
    { q:'What documentation is needed for an agricultural claim?', a:'Policy declarations, planting records, field maps, crop receipts, yield history, livestock records, veterinary records, equipment invoices, and photos of all damaged property.' },
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
    setTimeout(() => setChatHistory(h => [...h, {
      from:'agent', text:'Thank you. A claims specialist will follow up shortly.'
    }]), 1000)
  }

  /* ── Shared inline style helpers ───────────────────────── */
  const s = {
    nav:         { background: VM.navy, boxShadow: '0 2px 20px rgba(2,64,153,.35)' } as React.CSSProperties,
    hero:        { background: `linear-gradient(135deg, ${VM.navy} 0%, #02306B 55%, #013080 100%)` } as React.CSSProperties,
    brandPanel:  { background: VM.navy, borderBottom: `1px solid rgba(255,255,255,.1)` } as React.CSSProperties,
    goldBtn:     { background: VM.gold, color: VM.navy, boxShadow: '0 4px 20px rgba(250,189,0,.3)' } as React.CSSProperties,
    outlineBtn:  { background: 'transparent', color: VM.white, border: '2px solid rgba(255,255,255,.4)' } as React.CSSProperties,
    goldBadge:   { background: 'rgba(250,189,0,.1)', border: '1px solid rgba(250,189,0,.25)' } as React.CSSProperties,
    card:        { background: VM.white, border: `1px solid ${VM.border}`, borderRadius: 16, padding: '24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(2,64,153,.06),0 4px 16px rgba(2,64,153,.08)' } as React.CSSProperties,
    chatBtn:     { background: VM.gold, boxShadow: '0 4px 20px rgba(250,189,0,.4)' } as React.CSSProperties,
    chatHeader:  { background: VM.navy } as React.CSSProperties,
    chatBg:      { background: VM.bg } as React.CSSProperties,
    sendBtn:     { background: VM.gold, color: VM.navy } as React.CSSProperties,
  }

  return (
    <div style={{ minHeight:'100vh', background:VM.bg, fontFamily:'"DM Sans",system-ui,sans-serif', display:'flex', flexDirection:'column' }}>

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav style={{ ...s.nav, height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, zIndex:50 }}>
        <Link to="/" style={{ textDecoration:'none' }}>
          <VMlogo size="md" variant="full-light" />
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setShowBrand(v => !v)}
            style={{ fontSize:12, color:'rgba(255,255,255,.4)', background:'transparent', border:'none', cursor:'pointer' }}>
            Brand
          </button>
          {isAuthenticated
            ? <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.5)' }}>Welcome, {user?.name?.split(' ')[0]}</span>
                <button onClick={() => { logout(); navigate('/') }}
                  style={{ fontSize:13, color:'rgba(255,255,255,.5)', background:'transparent', border:'none', cursor:'pointer' }}>
                  Log Out
                </button>
              </div>
            : <Link to="/login"
                style={{ fontSize:13, fontWeight:600, color:VM.white, border:'1px solid rgba(255,255,255,.3)', padding:'6px 16px', borderRadius:8, textDecoration:'none' }}>
                Log In
              </Link>
          }
        </div>
      </nav>

      {/* ── BRAND PANEL ──────────────────────────────────── */}
      {showBrand && (
        <div style={{ ...s.brandPanel, padding:'16px 32px' }}>
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10 }}>Brand Switcher</div>
          <div style={{ display:'flex', flexWrap:'wrap' as const, gap:8 }}>
            {Object.entries(presets).map(([key, p]) => (
              <button key={key} onClick={() => { setLogo(key); setShowBrand(false) }}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', border: logoKey===key ? 'none' : '1px solid rgba(255,255,255,.2)', background: logoKey===key ? VM.white : 'transparent', color: logoKey===key ? VM.navy : 'rgba(255,255,255,.6)' }}>
                <div style={{ width:18, height:18, borderRadius:4, background:p.primaryColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:VM.white }}>{p.initials}</div>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────── */}
      <div style={{ ...s.hero, padding:'64px 60px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 55% 60% at 75% 35%, rgba(250,189,0,.07) 0%, transparent 65%), radial-gradient(ellipse 40% 40% at 20% 70%, rgba(5,107,252,.1) 0%, transparent 60%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:560, position:'relative', zIndex:1 }}>
          <div style={{ ...s.goldBadge, display:'inline-flex', alignItems:'center', gap:8, borderRadius:20, padding:'4px 14px', fontSize:11.5, fontWeight:600, color:VM.gold, marginBottom:20 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:VM.gold, display:'inline-block' }} />
            Claims team available 24/7
          </div>
          <h1 style={{ fontSize:42, fontWeight:800, color:VM.white, lineHeight:1.1, marginBottom:16, letterSpacing:'-.02em' }}>
            Welcome to our<br />
            <span style={{ color:VM.gold }}>easy claims center</span>
          </h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.6)', lineHeight:1.7, marginBottom:28, maxWidth:420 }}>
            File a new claim or track an existing one. Most claims resolved in under 7 days.
          </p>
          <div style={{ display:'flex', flexWrap:'wrap' as const, gap:12, marginBottom:24 }}>
            <button onClick={() => navigate('/file-claim')}
              style={{ ...s.goldBtn, fontSize:15, fontWeight:700, padding:'12px 28px', borderRadius:28, border:'none', cursor:'pointer' }}>
              File a Claim
            </button>
            <Link to="/track"
              style={{ ...s.outlineBtn, fontSize:15, fontWeight:700, padding:'12px 28px', borderRadius:28, textDecoration:'none', display:'inline-block' }}>
              Track a Claim
            </Link>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap' as const, gap:10 }}>
            <button onClick={() => navigate('/claims/third-party/new')}
              style={{ fontSize:12.5, fontWeight:600, color:'rgba(255,255,255,.85)',
                background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.25)',
                borderRadius:8, padding:'7px 16px', cursor:'pointer',
                backdropFilter:'blur(4px)', letterSpacing:'.01em' }}>
              👤 Claims for non-customers
            </button>
            <button onClick={() => navigate('/roadside')}
              style={{ fontSize:12.5, fontWeight:600, color:'#FABD00',
                background:'rgba(250,189,0,.1)', border:'1px solid rgba(250,189,0,.3)',
                borderRadius:8, padding:'7px 16px', cursor:'pointer',
                backdropFilter:'blur(4px)' }}>
              🚛 Get roadside assistance
            </button>
          </div>
        </div>
      </div>

      {/* ── LOB CARDS ────────────────────────────────────── */}
      <div style={{ background:VM.white, padding:'48px 60px', borderBottom:`1px solid ${VM.border}` }}>
        <h2 style={{ fontSize:26, fontWeight:800, color:VM.textDark, marginBottom:8 }}>What can we help you with?</h2>
        <p style={{ fontSize:14, color:VM.textLight, marginBottom:28 }}>Select the type of claim to get started.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
          {LOBS.map((lob, i) => (
            <div key={i}
              onClick={() => lob.active && navigate(lob.href)}
              style={{ border:`1.5px solid ${VM.border}`, borderRadius:16, padding:24, background:VM.white, cursor: lob.active ? 'pointer' : 'not-allowed', opacity: lob.active ? 1 : 0.5, position:'relative', transition:'all .2s' }}
              onMouseEnter={e => { if (lob.active) { (e.currentTarget as HTMLDivElement).style.borderColor = VM.blue; (e.currentTarget as HTMLDivElement).style.background = VM.bluePale; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' } }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = VM.border; (e.currentTarget as HTMLDivElement).style.background = VM.white; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}>
              {!lob.active && <span style={{ position:'absolute', top:10, right:10, fontSize:10, background:VM.bg, border:`1px solid ${VM.border}`, color:'#A0AEC0', padding:'2px 8px', borderRadius:20, fontWeight:700 }}>Coming Soon</span>}
              {lob.tag && <span style={{ position:'absolute', top:10, right:10, fontSize:10, background:VM.greenLight, color:VM.green, border:`1px solid #A8E4A2`, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>{lob.tag}</span>}
              <div style={{ width:44, height:44, borderRadius:12, background:lob.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <lob.Icon size={20} color={lob.color} strokeWidth={1.75} />
              </div>
              <div style={{ fontSize:15, fontWeight:700, color:VM.textDark, marginBottom:4 }}>{lob.label}</div>
              <div style={{ fontSize:12.5, color:VM.textLight, lineHeight:1.5 }}>{lob.desc}</div>
              {lob.active && <div style={{ marginTop:10, fontSize:13, fontWeight:700, color:VM.blue }}>→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <div style={{ background:VM.bg, padding:'48px 60px', flex:1 }}>
        <div style={{ fontSize:11, fontWeight:700, color:VM.textLight, textTransform:'uppercase' as const, letterSpacing:'.08em', marginBottom:8 }}>Frequently Asked Questions</div>
        <h2 style={{ fontSize:28, fontWeight:800, color:VM.textDark, marginBottom:28 }}>What can we help you with?</h2>

        {/* LOB tabs */}
        <div style={{ display:'flex', flexWrap:'wrap' as const, gap:8, marginBottom:24 }}>
          {LOB_TABS.map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveLOB(tab.id); setOpenFAQ(0) }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', border: activeLOB===tab.id ? 'none' : `1.5px solid ${VM.border}`, background: activeLOB===tab.id ? VM.navy : VM.white, color: activeLOB===tab.id ? VM.white : VM.textMid }}>
              <tab.Icon size={13} strokeWidth={2} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div style={{ maxWidth:760 }}>
          {FAQS[activeLOB].map((item, i) => (
            <div key={i} style={{ borderTop:`1px solid ${VM.border}` }}>
              <button
                onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 0', textAlign:'left', background:'transparent', border:'none', cursor:'pointer' }}>
                <span style={{ fontSize:14.5, fontWeight:600, color: openFAQ===i ? VM.navy : VM.textMid, paddingRight:24, lineHeight:1.35 }}>{item.q}</span>
                <span style={{ flexShrink:0, width:24, height:24, borderRadius:'50%', border:`1px solid ${openFAQ===i ? VM.navy : VM.border}`, display:'flex', alignItems:'center', justifyContent:'center', color: openFAQ===i ? VM.navy : VM.textLight }}>
                  {openFAQ===i ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>
              {openFAQ === i && (
                <div style={{ paddingBottom:20, paddingRight:40 }}>
                  <p style={{ fontSize:13.5, color:VM.textMid, lineHeight:1.75 }}>{item.a}</p>
                  <button onClick={() => navigate('/file-claim')}
                    style={{ marginTop:12, fontSize:12.5, fontWeight:700, color:VM.blue, background:'transparent', border:'none', cursor:'pointer' }}>
                    File a {LOB_TABS.find(t => t.id === activeLOB)?.label} claim →
                  </button>
                </div>
              )}
            </div>
          ))}
          <div style={{ borderTop:`1px solid ${VM.border}` }} />
        </div>

        <div style={{ display:'flex', flexWrap:'wrap' as const, gap:12, marginTop:32, paddingTop:24, borderTop:`1px solid ${VM.border}`, maxWidth:760 }}>
          <button onClick={() => setChatOpen(true)}
            style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, padding:'10px 20px', borderRadius:10, background:VM.blue, color:VM.white, border:'none', cursor:'pointer' }}>
            <MessageSquare size={14} />Chat with us
          </button>
          <a href="tel:18008262534"
            style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, padding:'10px 20px', borderRadius:10, background:VM.white, color:VM.textMid, border:`1.5px solid ${VM.border}`, textDecoration:'none' }}>
            <Phone size={14} />1-800-VM-CLAIMS
          </a>
          <a href="mailto:claims@valuemomentum.com"
            style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, padding:'10px 20px', borderRadius:10, background:VM.white, color:VM.textMid, border:`1.5px solid ${VM.border}`, textDecoration:'none' }}>
            <Mail size={14} />Email us
          </a>
        </div>
      </div>

      <Footer />

      {/* ── CHAT BUTTON ──────────────────────────────────── */}
      <button onClick={() => setChatOpen(v => !v)}
        style={{ ...s.chatBtn, position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer', zIndex:50 }}>
        {chatOpen ? <ChevronDown size={22} color={VM.navy} /> : <MessageSquare size={22} color={VM.navy} />}
      </button>

      {/* ── CHAT WINDOW ──────────────────────────────────── */}
      {chatOpen && (
        <div style={{ position:'fixed', bottom:96, right:24, width:320, background:VM.white, borderRadius:16, zIndex:50, display:'flex', flexDirection:'column' as const, overflow:'hidden', border:`1px solid ${VM.border}`, boxShadow:'0 8px 40px rgba(2,64,153,.18)' }}>
          <div style={{ ...s.chatHeader, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
            <VMlogo size="sm" />
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:VM.white }}>Claims Assistant</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#4AE040' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4AE040', display:'inline-block' }} />Online
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ marginLeft:'auto', color:'rgba(255,255,255,.4)', background:'transparent', border:'none', cursor:'pointer', fontSize:18 }}>×</button>
          </div>
          <div style={{ ...s.chatBg, display:'flex', flexDirection:'column' as const, gap:12, padding:14, maxHeight:220, overflowY:'auto' as const }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ maxWidth:'85%', alignSelf: m.from==='user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ padding:'10px 14px', borderRadius:12, fontSize:12.5, lineHeight:1.5, background: m.from==='agent' ? VM.white : VM.navy, color: m.from==='agent' ? VM.textDark : 'rgba(255,255,255,.9)', border: m.from==='agent' ? `1px solid ${VM.border}` : 'none' }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, padding:12, borderTop:`1px solid ${VM.border}` }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key==='Enter' && sendChat()}
              placeholder="Type a message…"
              style={{ flex:1, fontSize:12.5, border:`1px solid ${VM.border}`, borderRadius:8, padding:'8px 12px', outline:'none', background:VM.bg, color:VM.textDark, fontFamily:'inherit' }} />
            <button onClick={sendChat}
              style={{ ...s.sendBtn, border:'none', borderRadius:8, padding:'8px 14px', cursor:'pointer', fontSize:12, fontWeight:700 }}>Send</button>
          </div>
        </div>
      )}
      <ClaimsAssistant mode="full"/>
    </div>
  )
}
