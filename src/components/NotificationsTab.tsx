/* ═══════════════════════════════════════════════════════════════
   NotificationsTab.tsx — WhatsApp · SMS · Email · Push · GW Sync
   Layout: Chat thread (left 60%) + Event timeline (right 40%)
   Actors: Customer (green/WA) · Adjuster (navy) · System (grey)
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from 'react'

interface Message {
  id:         string
  direction:  'inbound' | 'outbound'
  channel:    'whatsapp' | 'sms' | 'email' | 'push' | 'system'
  from:       string
  to?:        string
  toPhone?:   string
  fromPhone?: string
  body:       string
  timestamp:  string
  status:     string
  actor:      'customer' | 'adjuster' | 'system'
  error?:     string
  twilioSid?: string
}

interface Customer { phone: string; name: string; shortName: string }

interface Props {
  claimNumber:  string
  adjusterName: string
  insuredName:  string
}

const C = {
  navy:'#024099', navyLight:'#E6F0FF',
  wa:'#25D366', waLight:'#E7FAF0', waBorder:'#9FE5BF', waDark:'#128C7E',
  orange:'#C45B28', orangeLight:'#FAECE7', orangeBorder:'#F0997B',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
  green:'#2EB124', greenLight:'#EDFAEB',
  grey:'#F5F5F5', greyBorder:'#E0E0E0',
}

const PROXY = (import.meta as any).env?.VITE_PROXY_URL || 'http://localhost:3001'

const CH_ICON:  Record<string, string> = { whatsapp:'💬', sms:'📱', email:'📧', push:'🔔', system:'⚙️' }
const CH_LABEL: Record<string, string> = { whatsapp:'WhatsApp', sms:'SMS', email:'Email', push:'Push', system:'System' }
const CH_COLOR: Record<string, string> = { whatsapp:'#25D366', sms:'#024099', email:'#6366F1', push:'#F59E0B' }

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })

const fmtDate = (iso: string) => {
  const d = new Date(iso); const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const y = new Date(today); y.setDate(today.getDate()-1)
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

export default function NotificationsTab({ claimNumber, adjusterName, insuredName }: Props) {
  const [messages,   setMessages]   = useState<Message[]>([])
  const [customers,  setCustomers]  = useState<Customer[]>([])
  const [selectedTo, setSelectedTo] = useState('')
  const [channel,    setChannel]    = useState<'whatsapp'|'sms'|'email'|'push'>('whatsapp')
  const [draft,      setDraft]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [sendError,  setSendError]  = useState('')
  const [connected,  setConnected]  = useState(false)
  const [lastPoll,   setLastPoll]   = useState<Date|null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLTextAreaElement>(null)

  /* Load customers */
  useEffect(() => {
    fetch(`${PROXY}/notify/customers`)
      .then(r => r.json())
      .then(d => {
        setCustomers(d.customers || [])
        if (d.customers?.length > 0) setSelectedTo(d.customers[0].phone)
        setConnected(true)
      })
      .catch(() => setConnected(false))
  }, [])

  /* Poll messages every 3s */
  useEffect(() => {
    const poll = () => {
      fetch(`${PROXY}/notify/thread/${claimNumber}`)
        .then(r => r.json())
        .then(d => { setMessages(d.messages || []); setLastPoll(new Date()); setConnected(true) })
        .catch(() => setConnected(false))
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [claimNumber])

  /* Auto scroll */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  /* Push permission */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default')
      Notification.requestPermission()
  }, [])

  /* Browser push on inbound */
  const custCount = messages.filter(m => m.actor === 'customer').length
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.actor !== 'customer') return
    if ('Notification' in window && Notification.permission === 'granted')
      new Notification(`💬 New ${CH_LABEL[last.channel]} from ${last.from}`, { body: last.body, icon:'/favicon.ico' })
  }, [custCount])

  /* Send message */
  const sendMessage = async () => {
    if (!draft.trim() || !selectedTo || sending) return
    setSending(true); setSendError('')
    const optimistic: Message = {
      id:'opt-'+Date.now(), direction:'outbound', channel, actor:'adjuster',
      from: adjusterName, to: customers.find(c=>c.phone===selectedTo)?.name||selectedTo,
      toPhone: selectedTo, body: draft, timestamp: new Date().toISOString(), status:'sending',
    }
    setMessages(prev => [...prev, optimistic])
    const msgText = draft.trim()
    setDraft('')
    try {
      const r = await fetch(`${PROXY}/notify/send`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ claimNumber, to:selectedTo, message:msgText, channel, adjusterName: adjusterName||'Adjuster' }),
      })
      const d = await r.json()
      if (!d.success) setSendError(d.message?.error || 'Send failed')
      if (d.success) {
        const sysMsg: Message = {
          id:'sys-'+Date.now(), direction:'outbound', channel:'system', actor:'system',
          from:'System', body:`✅ ${CH_LABEL[channel]} logged to Guidewire ClaimCenter`,
          timestamp: new Date().toISOString(), status:'logged',
        }
        setMessages(prev => [...prev.filter(m=>m.id!==optimistic.id), d.message, sysMsg])
      }
    } catch { setSendError('Cannot reach proxy — is server.js running?') }
    finally { setSending(false); inputRef.current?.focus() }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* Group by date */
  const grouped: { date:string; msgs:Message[] }[] = []
  messages.forEach(m => {
    const d = fmtDate(m.timestamp)
    const last = grouped[grouped.length-1]
    if (!last || last.date!==d) grouped.push({ date:d, msgs:[m] })
    else last.msgs.push(m)
  })

  const timeline = messages.map(m => ({
    id: m.id, icon: CH_ICON[m.channel], actor: m.actor,
    label: m.actor==='system' ? m.body :
           m.actor==='customer' ? `${m.from} replied via ${CH_LABEL[m.channel]}` :
           `${m.from} sent ${CH_LABEL[m.channel]} to ${m.to}`,
    sub:   m.actor!=='system' ? m.body.substring(0,60)+(m.body.length>60?'...':'') : '',
    time:  fmtTime(m.timestamp), status: m.status,
  }))

  const custSelected = customers.find(c=>c.phone===selectedTo)
  const isWA = channel === 'whatsapp'

  return (
    <div style={{ display:'flex', height:540, background:C.bg, overflow:'hidden' }}>

      {/* ═══ LEFT — Chat Thread (60%) ═══ */}
      <div style={{ flex:'0 0 60%', display:'flex', flexDirection:'column', background:C.white, borderRight:`1px solid ${C.border}` }}>

        {/* Header */}
        <div style={{ padding:'10px 14px', background: isWA ? C.waDark : C.navy, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', gap:6 }}>
              {isWA ? '💬' : '📱'} Claim {claimNumber} · {isWA ? 'WhatsApp' : 'SMS'} Thread
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.65)', marginTop:1 }}>
              {connected
                ? `🟢 Connected · Syncing to Guidewire · ${messages.length} messages`
                : '🔴 Proxy offline — start server.js'}
              {lastPoll && <span style={{ marginLeft:8, opacity:.5 }}>· {fmtTime(lastPoll.toISOString())}</span>}
            </div>
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.55)', textAlign:'right' }}>
            <div>🛡️ {adjusterName}</div>
            <div>👤 {insuredName}</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display:'flex', gap:14, padding:'6px 14px', background:'#F8FAFF', borderBottom:`1px solid ${C.border}` }}>
          {[
            { color: isWA ? C.waDark : C.navy,   label:`Adjuster (${adjusterName})` },
            { color: isWA ? C.wa : C.orange,      label:`Customer (${insuredName})` },
            { color: C.muted,                     label:'System / GW' },
          ].map(a => (
            <div key={a.label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, color:C.muted }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:a.color }}/>
              {a.label}
            </div>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8,
          background: isWA ? '#ECE5DD' : C.white /* WhatsApp background */ }}>
          {messages.length===0 && (
            <div style={{ textAlign:'center', color:C.faint, fontSize:12, marginTop:40, fontStyle:'italic' }}>
              No messages yet for this claim.<br/>
              {isWA ? '💬 Send a WhatsApp message below.' : '📱 Type below to send the first SMS.'}
            </div>
          )}
          {grouped.map(group => (
            <div key={group.date}>
              <div style={{ display:'flex', alignItems:'center', gap:8, margin:'8px 0' }}>
                <div style={{ flex:1, height:1, background:isWA?'rgba(0,0,0,.1)':C.border }}/>
                <span style={{ fontSize:10, color:isWA?'#667781':C.faint, fontWeight:600,
                  background: isWA?'#D1F4CC':'transparent', padding: isWA?'2px 8px':'0', borderRadius:10 }}>
                  {group.date}
                </span>
                <div style={{ flex:1, height:1, background:isWA?'rgba(0,0,0,.1)':C.border }}/>
              </div>
              {group.msgs.map(msg => {
                const isAdj = msg.actor==='adjuster'
                const isSys = msg.actor==='system'
                const isCust= msg.actor==='customer'
                if (isSys) return (
                  <div key={msg.id} style={{ textAlign:'center', margin:'4px 0' }}>
                    <span style={{ fontSize:10.5, color: isWA?'#667781':C.muted,
                      background: isWA?'#FFF3CD':'#F5F5F5',
                      padding:'3px 12px', borderRadius:10, display:'inline-block' }}>
                      {CH_ICON.system} {msg.body}
                    </span>
                  </div>
                )
                return (
                  <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: isAdj?'flex-end':'flex-start' }}>
                    <div style={{ fontSize:10, color: isWA?'#667781':C.faint, marginBottom:2,
                      paddingLeft: isCust?4:0, paddingRight: isAdj?4:0 }}>
                      {CH_ICON[msg.channel]} {msg.from} · {fmtTime(msg.timestamp)}
                    </div>
                    <div style={{
                      maxWidth:'75%', padding:'8px 12px', wordBreak:'break-word', fontSize:12.5, lineHeight:1.5,
                      borderRadius: isAdj
                        ? (isWA ? '12px 12px 3px 12px' : '12px 12px 3px 12px')
                        : (isWA ? '12px 12px 12px 3px' : '12px 12px 12px 3px'),
                      background: isAdj
                        ? (isWA ? '#DCF8C6' : C.navy)       /* WA green sent / navy SMS */
                        : (isWA ? C.white   : C.orangeLight), /* WA white recv / orange SMS */
                      color: isAdj && !isWA ? '#fff' : C.text,
                      border: (!isAdj && !isWA) ? `1px solid ${C.orangeBorder}` : 'none',
                      boxShadow: isWA ? '0 1px 2px rgba(0,0,0,.1)' : 'none',
                    }}>
                      {msg.body}
                    </div>
                    <div style={{ fontSize:9.5, color: isWA?'#667781':C.faint, marginTop:2,
                      paddingRight: isAdj?4:0, display:'flex', alignItems:'center', gap:4 }}>
                      {msg.status==='sending' ? '⏳ Sending...' :
                       msg.status==='failed'  ? `❌ ${msg.error||'Failed'}` :
                       isAdj && isWA          ? '✓✓ Delivered' : '✓ Sent'}
                      {msg.twilioSid && <span style={{ opacity:.35 }}>· {msg.twilioSid.substring(0,10)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={chatEndRef}/>
        </div>

        {/* Compose */}
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'10px 14px', background:C.white }}>
          {/* Channel + recipient */}
          <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center', flexWrap:'wrap' }}>
            <div style={{ display:'flex', gap:2, background:C.bg, borderRadius:6, padding:2 }}>
              {(['whatsapp','sms','email','push'] as const).map(ch => (
                <button key={ch} onClick={() => setChannel(ch)} style={{
                  padding:'3px 10px', borderRadius:5, fontSize:11, fontWeight:600, border:'none', cursor:'pointer',
                  background: channel===ch ? CH_COLOR[ch] : 'transparent',
                  color:      channel===ch ? '#fff' : C.muted,
                }}>
                  {CH_ICON[ch]} {ch === 'whatsapp' ? 'WA' : ch.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
              <span style={{ fontSize:11, color:C.muted, whiteSpace:'nowrap' }}>To:</span>
              <select value={selectedTo} onChange={e=>setSelectedTo(e.target.value)}
                style={{ flex:1, padding:'4px 8px', borderRadius:5, border:`1px solid ${C.border}`,
                  fontSize:11.5, color:C.text, background:C.white, cursor:'pointer' }}>
                {customers.map(c=>(
                  <option key={c.phone} value={c.phone}>{c.name} ({c.phone})</option>
                ))}
                {customers.length===0 && <option>Loading...</option>}
              </select>
            </div>
          </div>

          {sendError && (
            <div style={{ fontSize:11, color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA',
              borderRadius:5, padding:'5px 10px', marginBottom:6 }}>
              ⚠️ {sendError}
            </div>
          )}

          {/* WhatsApp sandbox reminder */}
          {isWA && (
            <div style={{ fontSize:10.5, color:C.waDark, background:C.waLight, border:`1px solid ${C.waBorder}`,
              borderRadius:5, padding:'4px 10px', marginBottom:6 }}>
              💬 WhatsApp Sandbox — customer must have joined via Twilio sandbox code
            </div>
          )}

          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)}
              onKeyDown={handleKey} rows={2}
              placeholder={`Type a ${CH_LABEL[channel]} message... (Enter to send)`}
              style={{ flex:1, padding:'8px 10px', borderRadius:7,
                border:`1px solid ${isWA ? C.waBorder : C.border}`,
                fontSize:12.5, color:C.text, resize:'none', fontFamily:'inherit',
                outline:'none', lineHeight:1.5 }}
            />
            <button onClick={sendMessage}
              disabled={!draft.trim()||sending||!connected}
              style={{ padding:'8px 14px', borderRadius:7, border:'none', fontSize:12, fontWeight:700,
                background: (!draft.trim()||sending||!connected) ? C.faint :
                            (isWA ? C.waDark : C.navy),
                color:'#fff', cursor:(!draft.trim()||sending)?'default':'pointer',
                whiteSpace:'nowrap', height:54 }}>
              {sending ? '⏳' : isWA ? '💬 Send WA' : `📱 Send ${CH_LABEL[channel]}`}
            </button>
          </div>
          <div style={{ fontSize:10, color:C.faint, marginTop:4 }}>
            {CH_ICON[channel]} {isWA
              ? 'WhatsApp via Twilio Sandbox → Guidewire ClaimCenter'
              : `${CH_LABEL[channel]} via Twilio → Guidewire ClaimCenter`}
            {custSelected && <span> · to {custSelected.shortName} ({custSelected.phone})</span>}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT — Timeline (40%) ═══ */}
      <div style={{ flex:'0 0 40%', display:'flex', flexDirection:'column', background:'#F8FAFF' }}>
        <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:C.white }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.text }}>📋 Activity Timeline</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>WhatsApp · SMS · Email · Push · GW sync</div>
        </div>

        {/* GW sync status */}
        <div style={{ margin:'8px 10px 0', background: connected?C.greenLight:'#FEF2F2',
          border:`1px solid ${connected?C.waBorder:'#FECACA'}`, borderRadius:6, padding:'6px 10px',
          fontSize:11, color: connected?C.waDark:'#DC2626', display:'flex', alignItems:'center', gap:6 }}>
          {connected ? '🟢' : '🔴'}
          <div>
            <div style={{ fontWeight:600 }}>{connected ? 'Guidewire Sync Active' : 'Sync offline'}</div>
            <div style={{ fontSize:10, opacity:.7 }}>
              {connected ? 'Messages logging to GW ClaimCenter Activities' : 'Start proxy: node server.js'}
            </div>
          </div>
        </div>

        {/* Events */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px' }}>
          {timeline.length===0 && (
            <div style={{ textAlign:'center', color:C.faint, fontSize:11, marginTop:30, fontStyle:'italic' }}>
              Events appear here as messages are sent and received
            </div>
          )}
          {[...timeline].reverse().map((ev,i) => (
            <div key={ev.id} style={{ display:'flex', gap:8, marginBottom:10, opacity:i===0?1:.85 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0,
                background: ev.actor==='adjuster' ? (isWA?C.waLight:C.navyLight) :
                            ev.actor==='customer' ? C.orangeLight : C.grey,
                border:`1px solid ${ev.actor==='adjuster'?(isWA?C.waBorder:C.navy):
                                    ev.actor==='customer'?C.orangeBorder:C.greyBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>
                {ev.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11.5, fontWeight:600, color:C.text, lineHeight:1.3 }}>{ev.label}</div>
                {ev.sub && <div style={{ fontSize:11, color:C.muted, marginTop:1, lineHeight:1.4 }}>"{ev.sub}"</div>}
                <div style={{ fontSize:10, color:C.faint, marginTop:2, display:'flex', gap:8, alignItems:'center' }}>
                  <span>{ev.time}</span>
                  <span style={{ padding:'1px 6px', borderRadius:8, fontSize:9.5, fontWeight:600,
                    background: ev.status==='received'?C.greenLight:ev.status==='failed'?'#FEF2F2':C.bg,
                    color:      ev.status==='received'?C.waDark:ev.status==='failed'?'#DC2626':C.muted }}>
                    {ev.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ padding:'8px 12px', borderTop:`1px solid ${C.border}`, background:C.white }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, textAlign:'center' }}>
            {[
              { label:'Sent',      val:messages.filter(m=>m.actor==='adjuster').length, color:isWA?C.waDark:C.navy  },
              { label:'Received',  val:messages.filter(m=>m.actor==='customer').length, color:C.orange              },
              { label:'GW Synced', val:messages.filter(m=>m.actor!=='system').length,   color:C.navy                },
            ].map(s=>(
              <div key={s.label} style={{ background:C.bg, borderRadius:5, padding:'4px 0' }}>
                <div style={{ fontSize:16, fontWeight:800, color:s.color }}>{s.val}</div>
                <div style={{ fontSize:9.5, color:C.faint }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
