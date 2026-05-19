import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Phone, MessageSquare, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import VMlogo from '@/components/ui/VMlogo'
import { useAuth } from '@/lib/authContext'

/* ─────────────────────────────────────────────────────────────
   Brand tokens
   ───────────────────────────────────────────────────────────── */
const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB', greenBorder:'#A8E4A2',
  gold:'#FABD00', goldLight:'#FFF8E1',
  agero:'#E8410A', ageroLight:'#FEF0EC',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
}

/* ─────────────────────────────────────────────────────────────
   Mock linked claims (auto only)
   🔌 Replace with GW: GET /api/v1/policies/{id}/claims?lob=auto&status=Open
   ───────────────────────────────────────────────────────────── */
const LINKED_CLAIMS = [
  { claimNumber:'000-00-000480', name:'Rosario Marinello', vehicle:'2022 Honda CR-V EX-L',     policy:'7407354463' },
  { claimNumber:'000-00-000521', name:'Marcus T. Williams', vehicle:'2021 Ford F-150 XLT 4WD', policy:'8812047291' },
  { claimNumber:'000-00-006000', name:'David Chen',         vehicle:'2023 Tesla Model 3 LR',   policy:'9901234567' },
]

/* ─────────────────────────────────────────────────────────────
   Service types
   ───────────────────────────────────────────────────────────── */
const SERVICES = [
  { id:'tow',   icon:'🚛', label:'Towing',        eta:'~45 min', desc:'Tow to nearest certified repair shop' },
  { id:'flat',  icon:'🔧', label:'Flat Tire',      eta:'~25 min', desc:'Tire change or inflation'            },
  { id:'jump',  icon:'🔋', label:'Jump Start',     eta:'~20 min', desc:'Battery jump start service'          },
  { id:'lock',  icon:'🔑', label:'Lockout',        eta:'~30 min', desc:'Vehicle lockout assistance'          },
  { id:'fuel',  icon:'⛽', label:'Fuel Delivery',  eta:'~35 min', desc:'Up to 3 gallons delivered'           },
]

/* ─────────────────────────────────────────────────────────────
   Mock Agero providers
   🔌 Replace with Agero API: POST /dispatch + GET /job/{id}/providers
   ───────────────────────────────────────────────────────────── */
const PROVIDERS = [
  { id:'p1', initial:'M', name:'Marcus D.',   rating:4.9, jobs:847, vehicle:'2022 Ram 3500 · White',      plate:'TX 8X4-K21', eta:8,  dist:'1.2 mi', badge:'⚡ Nearest · Recommended' },
  { id:'p2', initial:'R', name:'Ricardo S.',  rating:4.8, jobs:612, vehicle:'2021 Ford F-450 · Yellow',   plate:'TX 3J2-M88', eta:14, dist:'2.1 mi', badge:'' },
  { id:'p3', initial:'T', name:'Tyler K.',    rating:4.7, jobs:391, vehicle:'2020 Chevy 3500 · Orange',   plate:'TX 7P1-Q44', eta:22, dist:'3.4 mi', badge:'' },
]

/* ─────────────────────────────────────────────────────────────
   Dallas demo coordinates
   Customer: Mockingbird Ln Dallas (32.8168, -96.8026)
   Provider starts 1.2 mi NW: (32.8298, -96.8201)
   ───────────────────────────────────────────────────────────── */
const CUSTOMER_LAT = 32.8168
const CUSTOMER_LNG = -96.8026
const PROVIDER_START_LAT = 32.8298
const PROVIDER_START_LNG = -96.8201
const CUSTOMER_ADDR = '4821 Mockingbird Ln, Dallas TX 75209'

/* ─────────────────────────────────────────────────────────────
   AGERO BADGE
   ───────────────────────────────────────────────────────────── */
function AgeroBadge({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const big = size === 'lg'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:big?10:6,
      background:C.white, border:`1px solid ${C.border}`, borderRadius:20,
      padding: big ? '8px 16px' : '5px 12px',
      boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
      <div style={{ width:big?28:20, height:big?28:20, background:C.agero, borderRadius:5,
        display:'flex', alignItems:'center', justifyContent:'center',
        color:C.white, fontWeight:900, fontSize:big?13:9 }}>A</div>
      <div>
        <div style={{ fontSize:big?13:11.5, fontWeight:700, color:C.text }}>Powered by Agero</div>
        {big && <div style={{ fontSize:11, color:C.muted }}>Licensed & insured roadside network · 24/7</div>}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SCREEN 1 — SERVICE SELECTION
   ───────────────────────────────────────────────────────────── */
function ServiceSelection({ onNext }: { onNext:(svc:string, claim:string)=>void }) {
  const [selected, setSelected] = useState('tow')
  const [claimLink, setClaimLink] = useState('')

  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:20 }}>
        <AgeroBadge size="lg" />
        <h1 style={{ fontSize:24, fontWeight:800, color:C.text, marginTop:16, marginBottom:4 }}>
          Roadside Assistance
        </h1>
        <p style={{ fontSize:13.5, color:C.muted }}>
          Select the service you need — a provider will be dispatched immediately
        </p>
      </div>

      {/* Claim linker */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10,
        padding:'14px 16px', marginBottom:16 }}>
        <label style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase',
          letterSpacing:'.06em', display:'block', marginBottom:8 }}>
          Link to an open claim (optional)
        </label>
        <select value={claimLink} onChange={e=>setClaimLink(e.target.value)}
          style={{ width:'100%', fontSize:13, border:`1px solid ${C.border}`, borderRadius:7,
            padding:'9px 10px', color:C.text, background:C.bg, cursor:'pointer' }}>
          <option value="">— No claim link —</option>
          {LINKED_CLAIMS.map(c=>(
            <option key={c.claimNumber} value={c.claimNumber}>
              Claim #{c.claimNumber} · {c.name} · {c.vehicle}
            </option>
          ))}
        </select>
        {claimLink && (
          <div style={{ marginTop:8, fontSize:11.5, color:C.blue, display:'flex', alignItems:'center', gap:4 }}>
            🔗 Roadside request will be logged to Claim #{claimLink}
          </div>
        )}
      </div>

      {/* Service cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {SERVICES.map(s=>(
          <div key={s.id} onClick={()=>setSelected(s.id)}
            style={{ background: selected===s.id ? C.bluePale : C.white,
              border:`2px solid ${selected===s.id?C.navy:C.border}`,
              borderRadius:12, padding:'16px 8px', textAlign:'center', cursor:'pointer',
              transform: selected===s.id ? 'translateY(-2px)' : 'none',
              transition:'all .2s', boxShadow: selected===s.id ? '0 4px 12px rgba(2,64,153,.15)' : 'none' }}>
            <div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:12, fontWeight:700, color: selected===s.id?C.navy:C.text }}>{s.label}</div>
            <div style={{ fontSize:10, color:C.faint, marginTop:3 }}>{s.eta}</div>
          </div>
        ))}
      </div>

      {/* Selected service detail */}
      {(() => {
        const svc = SERVICES.find(s=>s.id===selected)!
        return (
          <div style={{ background:C.bluePale, border:`1px solid ${C.blueBorder}`, borderRadius:10,
            padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>{svc.icon}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.navy }}>{svc.label}</div>
              <div style={{ fontSize:12, color:C.blue }}>{svc.desc} · Covered under your policy · No out-of-pocket cost</div>
            </div>
          </div>
        )
      })()}

      {/* Location */}
      <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:10,
        padding:'14px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:12, height:12, borderRadius:'50%', background:C.navy, flexShrink:0,
          boxShadow:`0 0 0 4px rgba(2,64,153,.15)` }}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:C.text }}>{CUSTOMER_ADDR}</div>
          <div style={{ fontSize:11.5, color:C.muted, marginTop:2 }}>📍 Your confirmed location · GPS accurate to 15 meters</div>
        </div>
        <button style={{ fontSize:12, fontWeight:600, color:C.blue, background:'transparent', border:'none', cursor:'pointer' }}>
          Change
        </button>
      </div>

      <button onClick={()=>onNext(selected, claimLink)}
        style={{ width:'100%', background:C.navy, color:C.white, fontSize:14.5, fontWeight:700,
          padding:14, borderRadius:10, border:'none', cursor:'pointer' }}>
        Request Roadside Assistance →
      </button>
      <p style={{ textAlign:'center', fontSize:11, color:C.faint, marginTop:10 }}>
        Agero · Licensed & Insured · Job # will be issued upon dispatch · Response typically in 3–5 minutes
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SCREEN 2 — PROVIDER SELECTION
   ───────────────────────────────────────────────────────────── */
function ProviderSelection({ onNext }: { onNext:(provider:typeof PROVIDERS[0])=>void }) {
  return (
    <div style={{ maxWidth:520, margin:'0 auto', padding:'24px 16px' }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase',
          letterSpacing:'.06em', marginBottom:4 }}>
          Agero Network · 3 providers nearby
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:C.text }}>Select Your Provider</div>
        <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>All providers are licensed, insured, and Agero-certified</div>
      </div>

      {PROVIDERS.map((p, i) => (
        <div key={p.id} onClick={()=>onNext(p)}
          style={{ background: i===0 ? C.bluePale : C.white,
            border:`2px solid ${i===0?C.navy:C.border}`,
            borderRadius:12, padding:16, marginBottom:12, cursor:'pointer',
            display:'flex', gap:14, alignItems:'center',
            transition:'all .2s',
            boxShadow: i===0 ? '0 4px 16px rgba(2,64,153,.12)' : 'none' }}
          onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=C.navy}
          onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=i===0?C.navy:C.border}>
          {/* Avatar */}
          <div style={{ width:52, height:52, borderRadius:'50%', flexShrink:0,
            background:`linear-gradient(135deg,${C.navy},${C.blue})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:C.white, fontSize:20, fontWeight:800 }}>{p.initial}</div>
          {/* Info */}
          <div style={{ flex:1 }}>
            {p.badge && (
              <div style={{ fontSize:10, fontWeight:700, background:C.navy, color:C.white,
                padding:'2px 8px', borderRadius:10, display:'inline-block', marginBottom:4 }}>
                {p.badge}
              </div>
            )}
            <div style={{ fontSize:14.5, fontWeight:700, color:C.text }}>{p.name}</div>
            <div style={{ fontSize:12, color:C.muted }}>🚛 {p.vehicle}</div>
            <div style={{ fontSize:12, color:'#FABD00' }}>{'★'.repeat(Math.floor(p.rating))}{'☆'.repeat(5-Math.floor(p.rating))}
              <span style={{ color:C.muted, marginLeft:4 }}>{p.rating} · {p.jobs.toLocaleString()} jobs</span>
            </div>
          </div>
          {/* ETA */}
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontSize:30, fontWeight:900, color:C.navy, lineHeight:1 }}>{p.eta}</div>
            <div style={{ fontSize:11, color:C.muted }}>min away</div>
            <div style={{ fontSize:11, color:C.faint, marginTop:2 }}>{p.dist}</div>
          </div>
        </div>
      ))}

      <div style={{ textAlign:'center', marginTop:8 }}>
        <button onClick={()=>onNext(PROVIDERS[0])}
          style={{ background:'transparent', border:'none', color:C.blue,
            fontSize:13, fontWeight:600, cursor:'pointer' }}>
          Auto-assign nearest provider
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   LEAFLET MAP COMPONENT
   ───────────────────────────────────────────────────────────── */
function LiveMap({ etaMins, onEtaUpdate }: { etaMins:number; onEtaUpdate:(m:number)=>void }) {
  const mapRef   = useRef<HTMLDivElement>(null)
  const mapObj   = useRef<any>(null)
  const provMark = useRef<any>(null)
  const stepRef  = useRef(0)

  useEffect(()=>{
    if(mapObj.current || !mapRef.current) return

    // Dynamically load Leaflet
    const link = document.createElement('link')
    link.rel  = 'stylesheet'
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
    script.onload = () => {
      const L = (window as any).L

      const map = L.map(mapRef.current!, { zoomControl:true, attributionControl:true })
        .setView([(CUSTOMER_LAT+PROVIDER_START_LAT)/2, (CUSTOMER_LNG+PROVIDER_START_LNG)/2], 14)
      mapObj.current = map

      // CartoDB light tiles — clean Google Maps look, no API key
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom:19
      }).addTo(map)

      // Customer marker — pulsing blue dot
      const custIcon = L.divIcon({
        html:`<div style="position:relative;width:20px;height:20px">
          <div style="width:20px;height:20px;border-radius:50%;background:#024099;border:3px solid #fff;box-shadow:0 2px 8px rgba(2,64,153,.5);position:relative;z-index:2"></div>
          <div style="position:absolute;top:-6px;left:-6px;width:32px;height:32px;border-radius:50%;border:2px solid rgba(2,64,153,.4);animation:custPulse 1.8s ease-in-out infinite"></div>
        </div>
        <style>@keyframes custPulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.4);opacity:.2}}</style>`,
        iconSize:[20,20], iconAnchor:[10,10], className:''
      })
      const custMarker = L.marker([CUSTOMER_LAT, CUSTOMER_LNG], {icon:custIcon, zIndexOffset:1000}).addTo(map)
      custMarker.bindPopup(
        `<div style="font-family:system-ui;font-size:12px"><b>📍 Your Location</b><br>${CUSTOMER_ADDR}</div>`,
        {closeButton:false}
      ).openPopup()

      // Accuracy circle
      L.circle([CUSTOMER_LAT, CUSTOMER_LNG], {
        radius:80, color:'#024099', fillColor:'#024099', fillOpacity:.08, weight:1.5
      }).addTo(map)

      // Dashed route line
      L.polyline([[PROVIDER_START_LAT, PROVIDER_START_LNG],[CUSTOMER_LAT, CUSTOMER_LNG]], {
        color:'#E8410A', weight:3, opacity:.45, dashArray:'10,8'
      }).addTo(map)

      // Provider truck marker
      const truckIcon = L.divIcon({
        html:`<div style="background:#E8410A;border-radius:10px;padding:7px 9px;box-shadow:0 4px 12px rgba(232,65,10,.45);border:2.5px solid #fff;display:flex;align-items:center;justify-content:center">
          <span style="font-size:18px">🚛</span>
        </div>`,
        iconSize:[40,38], iconAnchor:[20,19], className:''
      })
      provMark.current = L.marker([PROVIDER_START_LAT, PROVIDER_START_LNG], {icon:truckIcon, zIndexOffset:500}).addTo(map)
      provMark.current.bindPopup(
        `<div style="font-family:system-ui;font-size:12px"><b>Marcus D. · Agero Pro</b><br>2022 Ram 3500 · En route to you</div>`,
        {closeButton:false}
      )

      // Animate truck toward customer
      const totalSteps = 120
      const animate = () => {
        stepRef.current++
        if(stepRef.current > totalSteps) return
        const t = stepRef.current / totalSteps
        const lat = PROVIDER_START_LAT + (CUSTOMER_LAT - PROVIDER_START_LAT) * t
        const lng = PROVIDER_START_LNG + (CUSTOMER_LNG - PROVIDER_START_LNG) * t
        provMark.current?.setLatLng([lat, lng])
        const remaining = Math.max(0, Math.round(8 * (1 - t)))
        onEtaUpdate(remaining)
        setTimeout(animate, 400)
      }
      setTimeout(animate, 800)
    }
    document.head.appendChild(script)

    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, [])

  return <div ref={mapRef} style={{ width:'100%', height:'100%' }}/>
}

/* ─────────────────────────────────────────────────────────────
   SCREEN 3 — LIVE TRACKER
   ───────────────────────────────────────────────────────────── */
function LiveTracker({
  provider, service, claimLink, onCancel
}: {
  provider: typeof PROVIDERS[0]
  service:  string
  claimLink:string
  onCancel: ()=>void
}) {
  const [etaMins, setEtaMins] = useState(8)
  const svcObj = SERVICES.find(s=>s.id===service)!
  const claim  = LINKED_CLAIMS.find(c=>c.claimNumber===claimLink)

  const isArriving = etaMins <= 1
  const isArrived  = etaMins === 0

  const timelineSteps = [
    { label:'Request Received',     sub:'Coverage verified · No out-of-pocket cost',              status:'done',   time:'Now'     },
    { label:'Agero Network Notified',sub:`Job #AGR-2025-84221 created · ${svcObj.label} service`, status:'done',   time:'+1 min'  },
    { label:`${provider.name} Accepted`, sub:`${provider.vehicle} · ${provider.dist} away`,       status:'done',   time:'+2 min'  },
    { label:isArrived?'Provider Arrived!':isArriving?'Provider Arriving — 1 min away!':'En Route to Your Location',
      sub:isArrived?'Your provider is on site':'Live tracking active · ETA updating in real time',
      status:isArrived?'done':'active', time:'Now' },
    { label:'Service In Progress',  sub:`${provider.name} will begin ${svcObj.label.toLowerCase()}`, status:'upcoming', time:`~${8+15} min` },
    { label:'Service Complete',     sub: claimLink ? `Summary sent · Claim #${claimLink} updated` : 'Service summary sent by SMS', status:'upcoming', time:'Pending' },
  ]

  const dotColor = (s:string) => s==='done'?C.green:s==='active'?C.navy:'transparent'
  const dotBorder= (s:string) => s==='upcoming'?`2px solid ${C.border}`:'none'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', height:'calc(100vh - 56px)' }}>

      {/* ── MAP PANE ── */}
      <div style={{ position:'relative', overflow:'hidden' }}>
        {/* Status ribbon */}
        <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', zIndex:1000,
          background:C.white, border:`1px solid ${C.border}`, borderRadius:24, padding:'8px 20px',
          boxShadow:'0 4px 20px rgba(0,0,0,.12)', display:'flex', alignItems:'center', gap:8,
          whiteSpace:'nowrap', minWidth:200 }}>
          <div style={{ width:8, height:8, borderRadius:'50%',
            background: isArrived?C.green:isArriving?'#F59E0B':C.agero,
            animation: isArrived?'none':'pulse 1.5s ease-in-out infinite' }}/>
          <span style={{ fontSize:13, fontWeight:700, color:isArrived?C.green:C.navy }}>
            {isArrived ? '✓ Provider has arrived!' : isArriving ? `${provider.name} is arriving!` : `${provider.name} is en route`}
          </span>
          {!isArrived && <span style={{ fontSize:12, color:C.muted }}>· {etaMins} min</span>}
        </div>
        <style>{`
          @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}
        `}</style>
        <LiveMap etaMins={etaMins} onEtaUpdate={setEtaMins}/>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ background:C.white, borderLeft:`1px solid ${C.border}`,
        display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Panel header */}
        <div style={{ background:C.navy, padding:'14px 16px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:20, height:20, background:C.agero, borderRadius:4,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:C.white, fontWeight:900, fontSize:9 }}>A</div>
            <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.7)' }}>
              Agero Job #AGR-2025-84221
            </span>
          </div>
          <div style={{ fontSize:15, fontWeight:800, color:C.white, marginBottom:2 }}>
            {svcObj.icon} {svcObj.label} · Roadside Assistance
          </div>
          <div style={{ fontSize:11.5, color:'rgba(255,255,255,.6)' }}>{CUSTOMER_ADDR}</div>
        </div>

        {/* ETA card */}
        <div style={{ margin:'12px 12px 0',
          background: isArrived ? `linear-gradient(135deg,${C.green},#1B8A4B)`
                    : `linear-gradient(135deg,${C.navy},${C.blue})`,
          borderRadius:12, padding:'16px', color:C.white, textAlign:'center',
          flexShrink:0, transition:'background .5s' }}>
          <div style={{ fontSize:52, fontWeight:900, lineHeight:1 }}>
            {isArrived ? '✓' : etaMins < 1 ? '<1' : etaMins}
          </div>
          <div style={{ fontSize:12, opacity:.8, marginTop:4 }}>
            {isArrived ? 'Provider on site' : 'minutes away'}
          </div>
          <div style={{ fontSize:11, opacity:.55, marginTop:6 }}>
            {isArrived ? `${provider.name} is at your location` : `Arriving at ${CUSTOMER_ADDR}`}
          </div>
        </div>

        {/* Claim badge */}
        {claim && (
          <div style={{ margin:'10px 12px 0', background:C.bluePale, border:`1px solid ${C.blueBorder}`,
            borderRadius:8, padding:'7px 10px', fontSize:11.5, color:C.navy, fontWeight:600,
            display:'flex', alignItems:'center', gap:6 }}>
            🔗 Claim #{claim.claimNumber} · {claim.vehicle}
          </div>
        )}

        {/* Provider card */}
        <div style={{ margin:'10px 12px 0', background:C.bg, border:`1px solid ${C.border}`,
          borderRadius:10, padding:'12px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0,
              background:`linear-gradient(135deg,${C.navy},${C.blue})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              color:C.white, fontSize:19, fontWeight:800 }}>{provider.initial}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>{provider.name}</div>
              <div style={{ fontSize:11, color:C.muted }}>🚛 {provider.vehicle}</div>
              <div style={{ fontSize:11, color:C.muted }}>🪪 {provider.plate}</div>
              <div style={{ fontSize:11, color:'#FABD00' }}>
                {'★'.repeat(Math.floor(provider.rating))}
                <span style={{ color:C.faint, marginLeft:3 }}>{provider.rating} · {provider.jobs.toLocaleString()} jobs</span>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              padding:'8px', borderRadius:8, fontSize:12, fontWeight:600, border:'none', cursor:'pointer',
              background:C.navy, color:C.white }}>
              <Phone size={13}/> Call {provider.name.split(' ')[0]}
            </button>
            <button style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              padding:'8px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer',
              background:C.greenLight, color:'#1B5E20', border:`1px solid ${C.greenBorder}` }}>
              <MessageSquare size={13}/> SMS Update
            </button>
          </div>
        </div>

        {/* Agero tag */}
        <div style={{ margin:'8px 12px 0', background:C.ageroLight, border:`1px solid rgba(232,65,10,.2)`,
          borderRadius:7, padding:'6px 10px', fontSize:11, fontWeight:600, color:C.agero,
          display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ width:14, height:14, background:C.agero, borderRadius:3,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:C.white, fontWeight:900, fontSize:7 }}>A</div>
          Powered by Agero · Licensed & Insured · Job #AGR-2025-84221
        </div>

        {/* Timeline */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase',
            letterSpacing:'.07em', color:C.faint, marginBottom:8 }}>Status Updates</div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {timelineSteps.map((step,i)=>(
              <div key={i} style={{ display:'flex', gap:8, padding:'8px 0',
                borderBottom: i<timelineSteps.length-1?`1px solid ${C.bg}`:'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:14, flexShrink:0 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', marginTop:3,
                    background: dotColor(step.status), border: dotBorder(step.status), flexShrink:0,
                    boxShadow: step.status==='active'?`0 0 0 3px rgba(2,64,153,.2)`:'none' }}/>
                  {i<timelineSteps.length-1&&<div style={{ width:1.5, flex:1, marginTop:3,
                    background: step.status==='done'?C.green:C.border }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight: step.status==='upcoming'?500:600,
                    color: step.status==='active'?C.navy:step.status==='upcoming'?C.faint:C.text,
                    lineHeight:1.3 }}>{step.label}</div>
                  <div style={{ fontSize:10.5, color: step.status==='upcoming'?C.border:C.muted, marginTop:1 }}>
                    {step.sub}
                  </div>
                </div>
                <div style={{ fontSize:10, color:C.faint, flexShrink:0, paddingTop:3 }}>{step.time}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onCancel}
          style={{ margin:'8px 12px 12px', padding:9, borderRadius:8,
            border:`1px solid ${C.border}`, background:C.white, color:C.muted,
            fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
          Cancel Request
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */
export default function RoadsideAssistance() {
  const navigate   = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [params]   = useSearchParams()
  const [screen, setScreen]     = useState<1|2|3>(1)
  const [service, setService]   = useState('')
  const [claimLink, setClaimLink] = useState(params.get('claim') || '')
  const [provider, setProvider] = useState<typeof PROVIDERS[0]|null>(null)

  const handleServiceNext = (svc:string, claim:string) => {
    setService(svc); setClaimLink(claim); setScreen(2)
  }
  const handleProviderNext = (p:typeof PROVIDERS[0]) => {
    setProvider(p); setScreen(3)
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif' }}>

      {/* NAV */}
      <nav style={{ background:C.navy, height:56, display:'flex', alignItems:'center',
        justifyContent:'space-between', padding:'0 24px',
        boxShadow:'0 2px 10px rgba(2,64,153,.3)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {screen > 1 && (
            <button onClick={()=>setScreen(s=>(s-1) as 1|2|3)}
              style={{ display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,.7)',
                background:'transparent', border:'none', cursor:'pointer', fontSize:12, fontWeight:600 }}>
              <ChevronLeft size={14}/> Back
            </button>
          )}
          <Link to="/" style={{ textDecoration:'none' }}>
            <VMlogo size="md" variant="full-light"/>
          </Link>
        </div>
        {/* Step indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {[['1','Service'],['2','Provider'],['3','Track']].map(([n,lbl],i)=>(
            <div key={n} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:14,
                background: screen === i+1 ? C.gold : screen > i+1 ? C.green : 'rgba(255,255,255,.1)',
                color: screen >= i+1 ? '#1A2744' : 'rgba(255,255,255,.5)',
                fontSize:11, fontWeight:700 }}>
                {screen > i+1 ? '✓' : n} {lbl}
              </div>
              {i < 2 && <span style={{ color:'rgba(255,255,255,.25)', fontSize:10 }}>›</span>}
            </div>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {isAuthenticated && <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>{user?.name}</span>}
          <button onClick={()=>{logout?.();navigate('/')}}
            style={{ fontSize:12, color:'rgba(255,255,255,.45)', background:'transparent', border:'none', cursor:'pointer' }}>
            Log Out
          </button>
        </div>
      </nav>

      {/* SCREENS */}
      {screen===1 && <ServiceSelection onNext={handleServiceNext}/>}
      {screen===2 && <ProviderSelection onNext={handleProviderNext}/>}
      {screen===3 && provider && (
        <LiveTracker
          provider={provider}
          service={service}
          claimLink={claimLink}
          onCancel={()=>setScreen(1)}
        />
      )}
    </div>
  )
}
