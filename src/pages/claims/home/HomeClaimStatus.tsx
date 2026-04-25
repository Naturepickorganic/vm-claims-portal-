import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { useClaimStatus, useSendMessage } from '@/lib/api/hooks/useClaimStatus'
import Navbar  from '@/components/layout/Navbar'
import InfoBox from '@/components/ui/InfoBox'

type TabId = 'overview' | 'documents' | 'repair' | 'messages' | 'ale'

const TABS: { id:TabId; label:string; badge?:number }[] = [
  { id:'overview',  label:'📊 Overview'            },
  { id:'documents', label:'📄 Documents'           },
  { id:'repair',    label:'🔨 Repair'              },
  { id:'messages',  label:'💬 Messages', badge:2   },
  { id:'ale',       label:'🏨 ALE'                 },
]

const DOCS = [
  { name:'Exterior Damage Photos (6 files)',   type:'Photos',      date:'Today', status:'ok'     },
  { name:'NOAA Weather Verification',          type:'Weather Data',date:'Today', status:'ok'     },
  { name:'DFW Elite — Preliminary Estimate',  type:'Repair Est.', date:'Today', status:'pending'},
  { name:'Emergency Tarp Receipt',            type:'Receipt',     date:'Today', status:'review' },
  { name:'Policy Declaration Page',           type:'Policy',      date:'Today', status:'ok'     },
]

export default function HomeClaimStatus() {
  const { id = '' }    = useParams<{ id:string }>()
  const [tab, setTab]  = useState<TabId>('overview')
  const [showAlert, setShowAlert] = useState(true)
  const [msgInput, setMsgInput]   = useState('')
  const [typing,   setTyping]     = useState(false)
  const [localMsgs, setLocalMsgs] = useState([
    { from:'adj' as const, name:'Daniel Park · Adjuster', time:'Today · 4:18 PM', text:`Hi Sarah! I'm Daniel Park, your assigned property adjuster. I've received your photos — very helpful. NOAA confirms a verified hail event (1.5" hailstones). I've scheduled an on-site inspection with DFW Elite Roofing for tomorrow at 9 AM. Can you confirm availability?` },
    { from:'me'  as const, name:'', time:'Today · 4:35 PM', text:"Hi Daniel, thanks! Yes, tomorrow at 9 AM works. Is the ceiling stain in the master bedroom something to worry about tonight?" },
    { from:'adj' as const, name:'Daniel Park · Adjuster', time:'Today · 5:02 PM', text:"Place a bucket under it as a precaution tonight. If it gets significantly worse, call our 24-hr line and I can authorize a temporary repair tonight. 🏠" },
  ])
  const msgRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isError, refetch } = useClaimStatus(id)
  const { mutate: sendMsg } = useSendMessage(id)

  useEffect(() => {
    if (tab==='messages') setTimeout(() => { if(msgRef.current) msgRef.current.scrollTop = 99999 }, 100)
  }, [tab, localMsgs])

  const handleSend = () => {
    const txt = msgInput.trim(); if(!txt) return
    setLocalMsgs(m => [...m, { from:'me', name:'', time:'Just now', text:txt }])
    setMsgInput(''); setTyping(true); sendMsg(txt)
    setTimeout(() => {
      setTyping(false)
      setLocalMsgs(m => [...m, { from:'adj', name:'Daniel Park · Adjuster', time:'Just now', text:"Thanks Sarah. I've noted that in your claim file. Is there anything else I can clarify before tomorrow's inspection?" }])
    }, 2200)
  }

  if (isLoading) return (
    <div className="min-h-screen flex flex-col"><Navbar crumb="Claim Status" secondCrumb="Home Insurance" />
      <div className="flex-1 flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-border border-t-red rounded-full animate-spin" /><div className="text-[13px] text-muted">Loading your claim…</div></div></div>
    </div>
  )

  if (isError) return (
    <div className="min-h-screen flex flex-col"><Navbar crumb="Claim Status" secondCrumb="Home Insurance" />
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div><div className="text-[32px] mb-3">⚠️</div><div className="text-[16px] font-bold text-navy mb-2">Could not load claim</div><button onClick={() => refetch()} className="btn btn-primary">Try Again</button></div>
      </div>
    </div>
  )

  const adjName  = data?.adjusterName  ?? 'Daniel Park'
  const adjPhone = data?.adjusterPhone ?? '(214) 555-0193'
  const gwId     = data?.gwClaimId     ?? id
  const milestones = data?.milestones  ?? []

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar crumb="Claim Status" secondCrumb="Home Insurance" />
      <div className="md:hidden bg-navy px-4 py-2 border-b border-white/8 flex items-center gap-2 text-[11px] text-white/50"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />{gwId} · In Progress</div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-68 bg-navy flex-col sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto border-r border-white/8 flex-shrink-0">
          <div className="p-4 border-b border-white/8">
            <div className="text-[9.5px] font-bold tracking-widest uppercase text-white/30 mb-2">Active Claim</div>
            <div className="bg-white/6 border border-white/10 rounded-xl p-3">
              <div className="text-[13px] font-bold text-white">{gwId}</div>
              <div className="text-[11.5px] text-white/60 mt-1">🏠 4821 Mockingbird Ln, Dallas TX</div>
              <div className="inline-flex items-center gap-1 mt-2 bg-blue/20 border border-blue/30 text-[10px] font-bold text-blue-300 px-2 py-px rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress</div>
            </div>
          </div>
          <div className="py-3 flex-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={clsx('w-full flex items-center gap-2 px-5 py-2.5 border-l-[3px] transition-all text-left bg-transparent border-t-0 border-r-0 border-b-0', tab===t.id?'bg-red/15 border-red':'border-transparent hover:bg-white/4')}>
                <span className={clsx('text-[12.5px] font-semibold', tab===t.id?'text-white/95':'text-white/50')}>{t.label}{t.badge&&<span className="ml-1.5 bg-red text-white text-[9px] px-1.5 py-px rounded-full">{t.badge}</span>}</span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-white/8 border-b border-white/8">
            <div className="text-[9.5px] font-bold tracking-widest uppercase text-white/30 mb-2">Your Adjuster</div>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue to-[#1D4ED8] flex items-center justify-center font-display font-black text-[15px] text-white flex-shrink-0">DP</div>
              <div><div className="text-[13px] font-bold text-white">{adjName}</div><div className="text-[11px] text-white/45">Senior Property Adjuster</div><div className="text-[11px] font-bold text-green-300 mt-0.5">&lt;2hr response</div></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setTab('messages')} className="flex-1 text-[11px] font-semibold py-1.5 rounded-lg bg-red text-white border-none cursor-pointer hover:bg-red-dark">💬 Message</button>
              <a href={`tel:${adjPhone}`} className="flex-1 text-center text-[11px] font-semibold py-1.5 rounded-lg bg-white/10 text-white/70 border border-white/15 hover:bg-white/20">📞 Call</a>
            </div>
          </div>
          <div className="p-4"><a href="tel:18008262534" className="text-[13px] font-bold text-[#FF8099]">📞 1-800-VM-CLAIMS</a></div>
        </aside>

        <main className="flex-1 px-4 py-5 md:px-10 md:py-8 max-w-[860px]">
          {/* Hero */}
          <div className="bg-gradient-to-br from-navy to-navy-light rounded-2xl p-5 md:p-8 mb-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Guidewire Claim Number</div>
                <div className="font-display font-black text-[20px] md:text-[22px] text-white">{gwId}</div>
                <div className="text-[11.5px] text-white/40 mt-1">Filed today · Policy #{data?.policyNumber??'VM-HOME-2024-33891'}</div>
                <div className="inline-flex items-center gap-2 bg-blue/22 border border-blue/35 text-blue-300 text-[11.5px] font-bold px-3 py-1 rounded-full mt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> In Progress — Damage Inspection
                </div>
              </div>
              <div className="sm:text-right"><div className="text-[10px] text-white/35 mb-1">Est. Resolution</div><div className="font-display font-black text-[20px] text-white">14–18 Days</div><div className="text-[11px] text-white/35 mt-0.5">Property claims</div></div>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-white/10">
              {[{v:'Day 1',l:'Claim Age',g:false},{v:`$${(data?.deductible??4250).toLocaleString()}`,l:'Wind/Hail Ded.',g:false},{v:`~$${Math.round((data?.estimatedRepair??21000)/1000)}K`,l:'Est. Damage',g:false},{v:'RCV',l:'Pmt Basis',g:true}].map(k => (
                <div key={k.l} className="text-center"><div className={clsx('font-display font-black text-[16px] md:text-[18px]', k.g?'text-green-300':'text-white')}>{k.v}</div><div className="text-[10px] text-white/40 mt-px leading-tight">{k.l}</div></div>
              ))}
            </div>
          </div>

          {/* Alert */}
          {showAlert && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl mb-4 bg-gradient-to-r from-[#FEF9C3] to-[#FEF08A] border border-[#FACC15]">
              <span className="text-[20px]">📅</span>
              <div><div className="text-[13px] font-bold text-[#713F12]">Action Needed: Confirm Tomorrow's Inspection</div><div className="text-[11.5px] text-[#92400E] mt-0.5">{adjName} needs to confirm your inspection window. Please message or call {adjPhone}.</div></div>
              <button onClick={() => setShowAlert(false)} className="ml-auto text-[#92400E] bg-transparent border-none cursor-pointer text-[18px] opacity-60 hover:opacity-100">×</button>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex border-b-2 border-border mb-5 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={clsx('text-[13px] font-semibold px-4 py-2.5 border-b-[2.5px] -mb-px whitespace-nowrap cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0 transition-all', tab===t.id?'text-red border-red':'text-muted border-transparent hover:text-navy')}>
                {t.label}{t.badge&&<span className="ml-1 bg-red text-white text-[9px] px-1.5 py-px rounded-full">{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab==='overview' && (
            <div>
              <div className="card">
                <div className="card-title mb-5">📅 Claim Milestones</div>
                <ul className="list-none p-0">
                  {milestones.map((m,i) => (
                    <li key={m.order} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center w-9 flex-shrink-0">
                        <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-[14px] z-10 flex-shrink-0', m.status==='done'?'bg-green text-white':m.status==='active'?'bg-red text-white':'bg-bg border-2 border-border text-faint')}>{m.status==='done'?'✓':m.status==='active'?'🔍':m.order}</div>
                        {i<milestones.length-1&&<div className={clsx('flex-1 w-0.5 mt-1',m.status==='done'?'bg-green-mid':m.status==='active'?'bg-gradient-to-b from-red-mid to-border':'bg-border')} />}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <div className={clsx('text-[13.5px] font-bold mb-0.5',m.status==='pending'?'text-faint':'text-navy')}>{m.title}</div>
                        <div className="text-[11.5px] text-muted mb-1.5">{m.date}</div>
                        <div className={clsx('text-[12.5px] leading-relaxed',m.status==='pending'?'text-faint':'text-slate')}>{m.detail}</div>
                        {m.status==='active'&&<div className="flex gap-2 mt-2.5"><button onClick={() => setTab('messages')} className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg bg-blue-light text-blue border border-blue-mid cursor-pointer hover:bg-blue hover:text-white transition-colors">💬 Message {adjName.split(' ')[0]}</button><a href={`tel:${adjPhone}`} className="text-[11.5px] font-semibold px-3 py-1.5 rounded-lg bg-blue-light text-blue border border-blue-mid hover:bg-blue hover:text-white transition-colors">📞 Call</a></div>}
                        <span className={clsx('inline-block mt-2 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full',m.status==='done'?'bg-green-light text-green':m.status==='active'?'bg-red-light text-red':'bg-bg text-faint border border-border')}>{m.status==='done'?'✓ Complete':m.status==='active'?'⟳ In Progress':'Pending'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card">
                <div className="card-title mb-4">📋 Claim Summary</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                  <div>{[['Claimant','Sarah M. Johnson'],['Policy',`#${data?.policyNumber??'VM-HOME-2024-33891'}`],['Property','4821 Mockingbird Ln, Dallas TX'],['GW Claim ID',gwId],['Deductible',`$${(data?.deductible??4250).toLocaleString()} (1% wind/hail)`]].map(([k,v]) => <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none"><span className="text-[12.5px] text-muted">{k}</span><span className="text-[12.5px] font-bold text-navy">{v}</span></div>)}</div>
                  <div className="sm:border-l sm:border-bg sm:pl-5">{[['Coverage','HO-3 Special Form'],['Est. Damage','$18,400–$24,600'],['Pmt Basis','Replacement Cost Value'],['NOAA Confirmed','✓ Hail event verified'],['Contractor','DFW Elite Roofing']].map(([k,v]) => <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none"><span className="text-[12.5px] text-muted">{k}</span><span className="text-[12.5px] font-bold text-navy">{v}</span></div>)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {tab==='documents' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4"><div className="card-title">📄 Claim Documents</div><button className="btn btn-primary text-[11.5px] px-3.5 py-1.5">+ Upload</button></div>
              <div className="overflow-x-auto"><table className="w-full border-collapse">
                <thead><tr>{['Document','Type','Date','Status'].map(h => <th key={h} className="text-[10.5px] font-bold uppercase tracking-wider text-faint px-2.5 py-2 border-b-2 border-border text-left">{h}</th>)}</tr></thead>
                <tbody>{DOCS.map(d => <tr key={d.name} className="border-b border-bg last:border-none"><td className="text-[12.5px] font-semibold text-navy px-2.5 py-2.5">{d.name}</td><td className="text-[12px] text-muted px-2.5 py-2.5 hidden sm:table-cell">{d.type}</td><td className="text-[12px] text-muted px-2.5 py-2.5 hidden sm:table-cell">{d.date}</td><td className="px-2.5 py-2.5"><span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full',d.status==='ok'?'bg-green-light text-green':d.status==='pending'?'bg-amber-light text-amber':'bg-blue-light text-blue')}>{d.status==='ok'?'✓ Received':d.status==='pending'?'⏳ Pending':'🔍 Review'}</span></td></tr>)}</tbody>
              </table></div>
            </div>
          )}

          {/* Repair */}
          {tab==='repair' && (
            <div className="card">
              <div className="card-title mb-4">🔨 DFW Elite Roofing &amp; Restoration</div>
              <div className="flex items-start gap-4 mb-4"><div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-[22px] flex-shrink-0">🏠</div><div><div className="text-[14px] font-bold text-navy">DFW Elite Roofing &amp; Restoration</div><div className="text-[12px] text-muted mt-0.5">1840 W Northwest Hwy, Dallas TX 75220</div><a href="tel:+12145550600" className="text-[12px] font-semibold text-blue mt-2 block">📞 (214) 555-0600 · ⭐ 4.9 · 5-yr Warranty</a></div></div>
              {[['Inspection','Tomorrow 9:00 AM'],['Est. Completion','10–12 business days'],['Preliminary Est.','Pending — due tomorrow by 5 PM'],['Warranty','5-year contractor + VM guarantee']].map(([k,v]) => <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none"><span className="text-[12.5px] text-muted">{k}</span><span className="text-[12.5px] font-bold text-navy">{v}</span></div>)}
            </div>
          )}

          {/* Messages */}
          {tab==='messages' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4"><div className="card-title">💬 Messages with {adjName}</div><div className="flex items-center gap-1.5 text-[11px] font-semibold text-green"><span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" /> Online</div></div>
              <div ref={msgRef} className="bg-bg rounded-xl p-3.5 max-h-[280px] overflow-y-auto flex flex-col gap-3 mb-3">
                {localMsgs.map((m,i) => (
                  <div key={i} className={clsx('max-w-[80%]', m.from==='me'&&'self-end')}>
                    {m.name&&<div className="text-[10px] text-faint mb-1">{m.name}</div>}
                    <div className={clsx('px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed', m.from==='adj'?'bg-white border border-border text-navy rounded-bl-sm':'bg-navy text-white/90 rounded-br-sm')}>{m.text}</div>
                    <div className={clsx('text-[10px] text-faint mt-0.5',m.from==='me'&&'text-right')}>{m.time}</div>
                  </div>
                ))}
                {typing&&<div className="max-w-[80%]"><div className="text-[10px] text-faint mb-1">{adjName}</div><div className="bg-white border border-border rounded-xl rounded-bl-sm px-4 py-2.5 flex gap-1 w-fit">{[0,1,2].map(i=><span key={i} className="w-1.5 h-1.5 rounded-full bg-faint animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div></div>}
              </div>
              <div className="flex gap-2.5">
                <textarea value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend()}}} placeholder={`Type a message to ${adjName}…`} rows={2} className="flex-1 text-[12.5px] text-navy border border-border rounded-xl px-3.5 py-2.5 outline-none resize-none focus:border-red transition-all font-body" />
                <button onClick={handleSend} className="btn btn-primary px-4 py-2 self-end text-[12.5px]">Send →</button>
              </div>
            </div>
          )}

          {/* ALE */}
          {tab==='ale' && (
            <div className="card">
              <div className="card-title mb-4">🏨 Additional Living Expenses (ALE)</div>
              <InfoBox type="green" icon="🏠">Your home is currently <strong>safe to occupy</strong>. ALE is available — notify {adjName.split(' ')[0]} if that changes and it will be activated within 2 hours.</InfoBox>
              {[['ALE Limit','$85,000 total'],['Max Duration','24 months'],['Hotel / Night','Up to $175/night'],['Meal Allowance','$60/day above normal'],['Status','✓ Not Required — Home is safe'],['To Activate',`Message ${adjName} · ${adjPhone}`]].map(([k,v]) => <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none"><span className="text-[12.5px] text-muted">{k}</span><span className="text-[12.5px] font-bold text-navy">{v}</span></div>)}
              <InfoBox type="amber" icon="⚠️" className="mt-4 mb-0">During roof replacement there may be a 2–3 day period with the attic exposed. Your adjuster will advise on ALE activation for those specific days.</InfoBox>
            </div>
          )}

          <div className="flex items-center justify-between pt-5 border-t border-border mt-2">
            <Link to="/claims/home/new" className="btn btn-ghost">← File Another</Link>
            <Link to="/" className="btn btn-navy">Back to Home</Link>
          </div>
        </main>
      </div>
    </div>
  )
}
