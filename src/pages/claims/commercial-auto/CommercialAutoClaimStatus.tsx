import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import Navbar  from '@/components/layout/Navbar'
import InfoBox from '@/components/ui/InfoBox'

type TabId = 'overview' | 'documents' | 'repair' | 'messages' | 'cargo'

const TABS: { id:TabId; label:string; badge?:number }[] = [
  { id:'overview',  label:'📊 Overview'           },
  { id:'documents', label:'📄 Documents'          },
  { id:'repair',    label:'🔧 Repair'             },
  { id:'messages',  label:'💬 Messages', badge:2  },
  { id:'cargo',     label:'📦 Cargo'             },
]

const MILESTONES = [
  { order:1, status:'done',   title:'Claim Filed',                    date:'Today · Filed',          detail:'Commercial claim created. FMCSA notification initiated. Confirmation sent to fleet manager and driver.' },
  { order:2, status:'done',   title:'Commercial Adjuster Assigned',   date:'Today · Within 2 hours', detail:'Senior Commercial Adjuster assigned. ELD data and dashcam footage request sent to carrier.' },
  { order:3, status:'active', title:'Field Investigation',            date:'In Progress',            detail:'Adjuster conducting on-site inspection. Police report, ELD logs, and witness statements being collected.' },
  { order:4, status:'pending',title:'Liability Determination',        date:'Expected: 3–5 days',     detail:'Investigation findings reviewed. Liability allocation across parties established. Legal review if fatalities or injuries.' },
  { order:5, status:'pending',title:'Damage Assessment & Estimate',   date:'Expected: 3–7 days',     detail:'Fleet shop provides written estimate. Total loss evaluation if structural damage exceeds ACV threshold.' },
  { order:6, status:'pending',title:'Repair Authorization',           date:'Expected: 5–8 days',     detail:'Written authorization issued to fleet repair partner. Replacement unit billing confirmed.' },
  { order:7, status:'pending',title:'Repairs & Return to Service',    date:'Expected: 10–21 days',   detail:'Repair timeline depends on parts availability and damage extent. Daily status updates from repair facility.' },
  { order:8, status:'pending',title:'Settlement & Subrogation',       date:'Expected: 14–30 days',   detail:'Final settlement processed. Subrogation team pursues at-fault parties to recover costs and deductible.' },
]

export default function CommercialAutoClaimStatus() {
  const { id = '' }   = useParams<{ id:string }>()
  const [tab, setTab] = useState<TabId>('overview')
  const [showAlert, setShowAlert] = useState(true)
  const [msgInput, setMsgInput]   = useState('')
  const [typing, setTyping]       = useState(false)
  const [localMsgs, setLocalMsgs] = useState([
    { from:'adj' as const, name:'Marcus Chen · Commercial Adjuster', time:'Today · 2:18 PM',
      text:`Hi! I'm Marcus Chen, your assigned commercial adjuster for claim ${id}. I've requested your ELD logs and dashcam footage from dispatch. Please also send me the Bill of Lading for the cargo that was on board. I'll have a preliminary liability determination within 48 hours.` },
    { from:'me' as const,  name:'', time:'Today · 2:31 PM',
      text:"Hi Marcus, thanks. The dashcam footage is being pulled by our IT team now. The BOL is attached. The driver is available for a recorded statement whenever you need." },
    { from:'adj' as const, name:'Marcus Chen · Commercial Adjuster', time:'Today · 2:45 PM',
      text:"Thank you. I'll schedule the driver statement for tomorrow at 10 AM. Please also send the unit's maintenance records for the past 90 days — this is standard for commercial claims. I'm arranging the mobile inspection for this afternoon at Rush Truck Centers." },
  ])
  const msgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tab === 'messages') setTimeout(() => { if (msgRef.current) msgRef.current.scrollTop = 99999 }, 100)
  }, [tab, localMsgs])

  const handleSend = () => {
    const txt = msgInput.trim(); if (!txt) return
    setLocalMsgs(m => [...m, { from:'me', name:'', time:'Just now', text:txt }])
    setMsgInput(''); setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setLocalMsgs(m => [...m, { from:'adj', name:'Marcus Chen · Commercial Adjuster', time:'Just now', text:"Thank you. I've noted that in your claim file. I'll follow up shortly." }])
    }, 2200)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar crumb="Claim Status" secondCrumb="Commercial Auto" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-68 bg-navy flex-col sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto border-r border-white/8 flex-shrink-0">
          <div className="p-4 border-b border-white/8">
            <div className="text-[9.5px] font-bold tracking-widest uppercase text-white/30 mb-2">Commercial Claim</div>
            <div className="bg-white/6 border border-white/10 rounded-xl p-3">
              <div className="text-[13px] font-bold text-white">{id}</div>
              <div className="text-[11.5px] text-white/60 mt-1">🚛 Commercial Auto — Unit #1042</div>
              <div className="inline-flex items-center gap-1 mt-2 bg-blue/20 border border-blue/30 text-[10px] font-bold text-blue-300 px-2 py-px rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress
              </div>
            </div>
          </div>
          <div className="py-3 flex-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx('w-full flex items-center gap-2 px-5 py-2.5 border-l-[3px] transition-all text-left bg-transparent border-t-0 border-r-0 border-b-0',
                  tab===t.id?'bg-red/15 border-red':'border-transparent hover:bg-white/4')}>
                <span className={clsx('text-[12.5px] font-semibold', tab===t.id?'text-white/95':'text-white/50')}>
                  {t.label}{t.badge && <span className="ml-1.5 bg-red text-white text-[9px] px-1.5 py-px rounded-full">{t.badge}</span>}
                </span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-white/8 border-b border-white/8">
            <div className="text-[9.5px] font-bold tracking-widest uppercase text-white/30 mb-2">Commercial Adjuster</div>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue to-[#1D4ED8] flex items-center justify-center font-display font-black text-[15px] text-white">MC</div>
              <div>
                <div className="text-[13px] font-bold text-white">Marcus Chen</div>
                <div className="text-[11px] text-white/45">Sr. Commercial Adjuster</div>
                <div className="text-[11px] font-bold text-green-300 mt-0.5">24/7 commercial line</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTab('messages')} className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg bg-red text-white border-none cursor-pointer">💬 Message</button>
              <a href="tel:+12145550199" className="flex-1 text-center text-[11px] font-semibold py-1.5 rounded-lg bg-white/10 text-white/70 border border-white/15 hover:bg-white/20">📞 Call</a>
            </div>
          </div>
          <div className="p-4">
            <a href="tel:18008262534" className="text-[13px] font-bold text-[#FF8099]">📞 1-800-VM-CLAIMS</a>
            <div className="text-[10.5px] text-white/30 mt-1">Press 2 for commercial lines</div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 md:px-10 md:py-8 max-w-[860px]">

          {/* Hero */}
          <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-5 md:p-8 mb-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Commercial Claim Number</div>
                <div className="font-display font-black text-[20px] md:text-[22px] text-white">{id}</div>
                <div className="text-[11.5px] text-white/40 mt-1">Commercial Auto · Unit #1042 · 2022 Freightliner Cascadia</div>
                <div className="inline-flex items-center gap-2 bg-blue/22 border border-blue/35 text-blue-300 text-[11.5px] font-bold px-3 py-1 rounded-full mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress — Field Investigation
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-[10px] text-white/35 mb-1">Est. Resolution</div>
                <div className="font-display font-black text-[20px] text-white">14–30 Days</div>
                <div className="text-[11px] text-white/35 mt-0.5">Commercial lines timeline</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/10">
              {[{v:'Day 1',l:'Claim Age'},{v:'$10K',l:'Deductible'},{v:'$85K+',l:'Est. Damage'},{v:'Active',l:'Rental Unit',g:true}].map(k => (
                <div key={k.l} className="text-center">
                  <div className={clsx('font-display font-black text-[16px] md:text-[18px]', (k as any).g?'text-green-300':'text-white')}>{k.v}</div>
                  <div className="text-[10px] text-white/40 mt-px leading-tight">{k.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alert */}
          {showAlert && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4 bg-gradient-to-r from-[#FEF9C3] to-[#FEF08A] border border-[#FACC15]">
              <span className="text-[20px]">⚡</span>
              <div>
                <div className="text-[13px] font-bold text-[#713F12]">Action Needed: Send Maintenance Records</div>
                <div className="text-[11.5px] text-[#92400E] mt-0.5">Marcus Chen has requested 90-day maintenance records for Unit #1042. Please upload or email to commercial@valuemomentum.com.</div>
              </div>
              <button onClick={() => setShowAlert(false)} className="ml-auto text-[#92400E] bg-transparent border-none cursor-pointer text-[18px] opacity-60 hover:opacity-100">×</button>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex border-b-2 border-border mb-5 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx('text-[13px] font-semibold px-4 py-2.5 border-b-[2.5px] -mb-px whitespace-nowrap cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 transition-all',
                  tab===t.id?'text-red border-red':'text-muted border-transparent hover:text-navy')}>
                {t.label}{t.badge && <span className="ml-1 bg-red text-white text-[9px] px-1.5 py-px rounded-full">{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab==='overview' && (
            <div>
              <div className="card">
                <div className="card-title mb-5">📅 Claim Milestones</div>
                <ul className="list-none p-0">
                  {MILESTONES.map((m,i) => (
                    <li key={m.order} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center w-9 flex-shrink-0">
                        <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-[13px] z-10',
                          m.status==='done'?'bg-green text-white':m.status==='active'?'bg-red text-white':'bg-bg border-2 border-border text-faint')}>
                          {m.status==='done'?'✓':m.status==='active'?'🔍':m.order}
                        </div>
                        {i<MILESTONES.length-1 && <div className={clsx('flex-1 w-0.5 mt-1',m.status==='done'?'bg-green-mid':m.status==='active'?'bg-gradient-to-b from-red-mid to-border':'bg-border')} />}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className={clsx('text-[13.5px] font-bold mb-0.5',m.status==='pending'?'text-faint':'text-navy')}>{m.title}</div>
                        <div className="text-[11.5px] text-muted mb-1.5">{m.date}</div>
                        <div className={clsx('text-[12.5px] leading-relaxed',m.status==='pending'?'text-faint':'text-slate')}>{m.detail}</div>
                        {m.status==='active' && (
                          <div className="flex gap-2 mt-2.5">
                            <button onClick={() => setTab('messages')} className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg bg-blue-light text-blue border border-blue-mid cursor-pointer hover:bg-blue hover:text-white transition-colors">💬 Message Marcus</button>
                            <a href="tel:+12145550199" className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg bg-blue-light text-blue border border-blue-mid hover:bg-blue hover:text-white transition-colors">📞 Call</a>
                          </div>
                        )}
                        <span className={clsx('inline-block mt-2 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full',
                          m.status==='done'?'bg-green-light text-green':m.status==='active'?'bg-red-light text-red':'bg-bg text-faint border border-border')}>
                          {m.status==='done'?'✓ Complete':m.status==='active'?'⟳ In Progress':'Pending'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <div className="card-title mb-4">📋 Claim Summary</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  <div>{[['Fleet','ABC Logistics LLC'],['USDOT','USDOT-1234567'],['Unit','#1042 — 2022 Freightliner Cascadia'],['Driver','Robert J. Martinez'],['Incident','Rear-end collision, I-35E northbound']].map(([k,v]) => <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none"><span className="text-[12.5px] text-muted">{k}</span><span className="text-[12.5px] font-bold text-navy">{v}</span></div>)}</div>
                  <div className="sm:border-l sm:border-bg sm:pl-5">{[['Coverage','Commercial Auto Liability + Collision'],['Cargo','Electronics — $185,000'],['Deductible','$10,000'],['Hazmat','None'],['Replacement','Active — Rush Truck Centers rental']].map(([k,v]) => <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none"><span className="text-[12.5px] text-muted">{k}</span><span className="text-[12.5px] font-bold text-navy">{v}</span></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {tab==='documents' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4"><div className="card-title">📄 Claim Documents</div><button className="btn btn-primary text-[11.5px] px-3.5 py-1.5">+ Upload</button></div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead><tr>{['Document','Type','Date','Status'].map(h => <th key={h} className="text-[10.5px] font-bold uppercase tracking-wider text-faint px-2.5 py-2 border-b-2 border-border text-left">{h}</th>)}</tr></thead>
                  <tbody>
                    {[
                      ['Police Crash Report #DPS-2025-04821','Crash Report','Today','ok'],
                      ['Bill of Lading — Electronics Shipment','Cargo Document','Today','ok'],
                      ['ELD Log Export — Last 48 Hours','HOS Records','Today','review'],
                      ['Dashcam Footage — Front Camera','Video Evidence','Today','pending'],
                      ['Unit #1042 Registration & Title','Registration','Today','ok'],
                      ['Driver MVR — R. Martinez','Driver Record','Today','review'],
                      ['Maintenance Records — 90 Day','Maintenance','Requested','pending'],
                      ['Rush Truck Centers Estimate','Repair Estimate','Pending','pending'],
                    ].map(([name,type,date,status]) => (
                      <tr key={name} className="border-b border-bg last:border-none">
                        <td className="text-[12px] font-semibold text-navy px-2.5 py-2.5">{name}</td>
                        <td className="text-[12px] text-muted px-2.5 py-2.5 hidden sm:table-cell">{type}</td>
                        <td className="text-[12px] text-muted px-2.5 py-2.5 hidden sm:table-cell">{date}</td>
                        <td className="px-2.5 py-2.5">
                          <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full',
                            status==='ok'?'bg-green-light text-green':status==='pending'?'bg-amber-light text-amber':'bg-blue-light text-blue')}>
                            {status==='ok'?'✓ Received':status==='pending'?'⏳ Pending':'🔍 Review'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Repair */}
          {tab==='repair' && (
            <div className="card">
              <div className="card-title mb-4">🔧 Fleet Repair — Rush Truck Centers Fort Worth</div>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-[22px]">🔧</div>
                <div>
                  <div className="text-[14px] font-bold text-navy">Rush Truck Centers — Fort Worth</div>
                  <div className="text-[12px] text-muted mt-0.5">14001 Trinity Blvd, Fort Worth TX 76040</div>
                  <a href="tel:+18175550600" className="text-[12px] font-semibold text-blue mt-1 block">📞 (817) 555-0600 · 24/7 Commercial</a>
                </div>
              </div>
              {[['Service Writer','Greg Hoffman · (817) 555-0601'],['Inspection Date','Tomorrow 9:00 AM'],['Preliminary Estimate','Pending — due within 48 hours'],['Est. Repair Time','10–21 business days'],['Replacement Unit','Peterbilt 579 — Direct billed'],['Warranty','OEM parts + 1 year labor']].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none">
                  <span className="text-[12.5px] text-muted">{k}</span>
                  <span className="text-[12.5px] font-bold text-navy">{v}</span>
                </div>
              ))}
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-muted mb-1.5"><span>Repair progress</span><span>5% — Unit received, awaiting inspection</span></div>
                <div className="h-2 bg-border rounded-full overflow-hidden"><div className="h-full w-[5%] bg-green rounded-full" /></div>
              </div>
            </div>
          )}

          {/* Messages */}
          {tab==='messages' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="card-title">💬 Messages with Marcus Chen</div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-green"><span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" /> Online</div>
              </div>
              <div ref={msgRef} className="bg-bg rounded-xl p-3.5 max-h-[280px] overflow-y-auto flex flex-col gap-3 mb-3">
                {localMsgs.map((m,i) => (
                  <div key={i} className={clsx('max-w-[80%]', m.from==='me'&&'self-end')}>
                    {m.name && <div className="text-[10px] text-faint mb-1">{m.name}</div>}
                    <div className={clsx('px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed',m.from==='adj'?'bg-white border border-border text-navy rounded-bl-sm':'bg-navy text-white/90 rounded-br-sm')}>{m.text}</div>
                    <div className={clsx('text-[10px] text-faint mt-0.5',m.from==='me'&&'text-right')}>{m.time}</div>
                  </div>
                ))}
                {typing && <div className="max-w-[80%]"><div className="text-[10px] text-faint mb-1">Marcus Chen · Commercial Adjuster</div><div className="bg-white border border-border rounded-xl rounded-bl-sm px-4 py-2.5 flex gap-1 w-fit">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 rounded-full bg-faint animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div></div>}
              </div>
              <div className="flex gap-2.5">
                <textarea value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}} placeholder="Type a message to Marcus Chen…" rows={2} className="flex-1 text-[12.5px] text-navy border border-border rounded-xl px-3.5 py-2.5 outline-none resize-none focus:border-red transition-all font-body" />
                <button onClick={handleSend} className="btn btn-primary px-4 py-2 self-end text-[12.5px]">Send →</button>
              </div>
            </div>
          )}

          {/* Cargo */}
          {tab==='cargo' && (
            <div className="card">
              <div className="card-title mb-4">📦 Cargo Status</div>
              <InfoBox type="green" icon="✅">Cargo appears to be intact based on driver report. Formal cargo inspection scheduled at Rush Truck Centers tomorrow.</InfoBox>
              {[['Cargo Type','Electronics — Consumer goods'],['Shipper','TechSupply Corp, Austin TX'],['Consignee','BestBuy Distribution, Dallas TX'],['BOL Number','BOL-2025-TX-88421'],['Declared Value','$185,000'],['Weight','38,400 lbs'],['Hazmat','None'],['Cargo Damage','Under inspection — no visible damage reported'],['Cargo Insurance','Carrier cargo policy — $250,000 limit']].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none">
                  <span className="text-[12.5px] text-muted">{k}</span>
                  <span className="text-[12.5px] font-bold text-navy">{v}</span>
                </div>
              ))}
              <InfoBox type="amber" icon="⚠️" className="mt-4 mb-0">If cargo is time-sensitive or perishable, contact Marcus Chen immediately at (214) 555-0199 so we can prioritize cargo release.</InfoBox>
            </div>
          )}

          {/* Floating chat */}
          <button onClick={() => setTab('messages')}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-red text-white font-bold text-[13px] px-5 py-3 rounded-full shadow-[0_4px_20px_rgba(200,16,46,.4)] hover:bg-red-dark transition-all border-none cursor-pointer">
            <span>💬</span><span className="hidden sm:block">Message Marcus</span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </button>

          <div className="flex items-center justify-between pt-5 border-t border-border mt-2">
            <Link to="/" className="btn btn-ghost">← Home</Link>
            <a href="tel:18008262534" className="btn btn-navy">📞 Commercial Claims Line</a>
          </div>
        </main>
      </div>
    </div>
  )
}
