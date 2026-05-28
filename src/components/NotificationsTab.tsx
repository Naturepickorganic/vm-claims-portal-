/* ═══════════════════════════════════════════════════════════════
   NotificationsTab.tsx — SMS · Email · Push · GW Sync
   Layout: Chat thread (left 60%) + Event timeline (right 40%)
   Actors: Customer (orange) · Adjuster (teal) · System (grey)
   Polling: every 3 seconds for new inbound messages
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from 'react'

interface Message {
  id:          string
  direction:   'inbound' | 'outbound'
  channel:     'sms' | 'email' | 'push' | 'system'
  from:        string
  to?:         string
  toPhone?:    string
  fromPhone?:  string
  body:        string
  timestamp:   string
  status:      string
  actor:       'customer' | 'adjuster' | 'system'
  error?:      string
  twilioSid?:  string
}

interface Customer { phone: string; name: string; shortName: string }

interface Props {
  claimNumber: string
  adjusterName: string
  insuredName:  string
}

const C = {
  navy:'#024099', teal:'#0F6E56', tealLight:'#E1F5EE', tealBorder:'#5DCAA5',
  orange:'#C45B28', orangeLight:'#FAECE7', orangeBorder:'#F0997B',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
  green:'#2EB124', greenLight:'#EDFAEB',
  grey:'#F5F5F5', greyBorder:'#E0E0E0', greyText:'#718096',
}

const PROXY = (import.meta as any).env?.VITE_PROXY_URL || 'http://localhost:3001'

const CHANNEL_ICONS: Record<string, string> = { sms:'📱', email:'📧', push:'🔔', system:'⚙️' }
const CHANNEL_LABELS: Record<string, string> = { sms:'SMS', email:'Email', push:'Push', system:'System' }

/* Format timestamp */
const fmtTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })
}
const fmtDate = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const yesterday = new Date(today); yesterday.setDate(today.getDate()-1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

export default function NotificationsTab({ claimNumber, adjusterName, insuredName }: Props) {
  const [messages,      setMessages]      = useState<Message[]>([])
  const [customers,     setCustomers]     = useState<Customer[]>([])
  const [selectedTo,    setSelectedTo]    = useState('')
  const [channel,       setChannel]       = useState<'sms'|'email'|'push'>('sms')
  const [draft,         setDraft]         = useState('')
  const [sending,       setSending]       = useState(false)
  const [sendError,     setSendError]     = useState('')
  const [connected,     setConnected]     = useState(false)
  const [lastPoll,      setLastPoll]      = useState<Date|null>(null)
  const chatEndRef  = useRef<HTMLDivElement>(null)
  const pollRef     = useRef<ReturnType<typeof setInterval>|null>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)

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

  /* Poll for messages every 3 seconds */
  useEffect(() => {
    const poll = () => {
      fetch(`${PROXY}/notify/thread/${claimNumber}`)
        .then(r => r.json())
        .then(d => {
          setMessages(d.messages || [])
          setLastPoll(new Date())
          setConnected(true)
        })
        .catch(() => setConnected(false))
    }
    poll()
    pollRef.current = setInterval(poll, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [claimNumber])

  /* Auto-scroll chat to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* Request push permission on mount */
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  /* Show browser push notification for inbound messages */
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.actor !== 'customer') return
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${last.from}`, {
        body: last.body,
        icon: '/favicon.ico',
      })
    }
  }, [messages.filter(m => m.actor === 'customer').length])

  /* Send message */
  const sendMessage = async () => {
    if (!draft.trim() || !selectedTo || sending) return
    setSending(true)
    setSendError('')

    /* Optimistic UI — add message immediately */
    const optimistic: Message = {
      id:        'opt-' + Date.now(),
      direction: 'outbound',
      channel,
      from:      adjusterName,
      to:        customers.find(c => c.phone === selectedTo)?.name || selectedTo,
      toPhone:   selectedTo,
      body:      draft,
      timestamp: new Date().toISOString(),
      status:    'sending',
      actor:     'adjuster',
    }
    setMessages(prev => [...prev, optimistic])
    setDraft('')

    try {
      const r = await fetch(`${PROXY}/notify/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimNumber,
          to:           selectedTo,
          message:      draft.trim(),
          channel,
          adjusterName: adjusterName || 'Adjuster',
        }),
      })
      const d = await r.json()
      if (!d.success) setSendError(d.message?.error || 'Send failed — check proxy and Twilio credentials')

      /* Add system event */
      if (d.success) {
        const gwMsg: Message = {
          id:        'sys-' + Date.now(),
          direction: 'outbound',
          channel:   'system',
          from:      'System',
          body:      `✅ ${CHANNEL_LABELS[channel]} logged to Guidewire ClaimCenter`,
          timestamp: new Date().toISOString(),
          status:    'logged',
          actor:     'system',
        }
        setMessages(prev => [...prev.filter(m => m.id !== optimistic.id), d.message, gwMsg])
      }
    } catch (e) {
      setSendError('Cannot reach proxy — is server.js running on port 3001?')
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  /* Group messages by date */
  const grouped: { date: string; msgs: Message[] }[] = []
  messages.forEach(m => {
    const d = fmtDate(m.timestamp)
    const last = grouped[grouped.length - 1]
    if (!last || last.date !== d) grouped.push({ date: d, msgs: [m] })
    else last.msgs.push(m)
  })

  /* Timeline events from messages */
  const timelineEvents = messages.map(m => ({
    id:        m.id,
    icon:      m.actor === 'customer' ? '📱' : m.actor === 'system' ? '⚙️' : CHANNEL_ICONS[m.channel],
    actor:     m.actor,
    label:     m.actor === 'system' ? m.body :
               m.actor === 'customer' ? `${m.from} replied via ${CHANNEL_LABELS[m.channel]}` :
               `${m.from} sent ${CHANNEL_LABELS[m.channel]} to ${m.to}`,
    sub:       m.actor !== 'system' ? m.body.substring(0, 60) + (m.body.length > 60 ? '...' : '') : '',
    time:      fmtTime(m.timestamp),
    status:    m.status,
  }))

  const customerSelected = customers.find(c => c.phone === selectedTo)

  return (
    <div style={{ display:'flex', height:520, background:C.bg, overflow:'hidden' }}>

      {/* ═══ LEFT PANEL: Chat Thread (60%) ═══ */}
      <div style={{ flex:'0 0 60%', display:'flex', flexDirection:'column', background:C.white, borderRight:`1px solid ${C.border}` }}>

        {/* Chat header */}
        <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:C.navy, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>
              Claim {claimNumber} · Messaging Thread
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.6)', marginTop:1 }}>
              {connected
                ? `🟢 Connected · Syncing to Guidewire · ${messages.length} messages`
                : '🔴 Proxy offline — start server.js'}
              {lastPoll && <span style={{ marginLeft:8, opacity:.5 }}>Last sync: {fmtTime(lastPoll.toISOString())}</span>}
            </div>
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', textAlign:'right' }}>
            <div>🛡️ {adjusterName}</div>
            <div>👤 {insuredName}</div>
          </div>
        </div>

        {/* Actor legend */}
        <div style={{ display:'flex', gap:14, padding:'6px 14px', background:'#F8FAFF', borderBottom:`1px solid ${C.border}` }}>
          {[
            { color: C.teal,   bg: C.tealLight,   label: `Adjuster (${adjusterName})` },
            { color: C.orange, bg: C.orangeLight,  label: `Customer (${insuredName})` },
            { color: C.greyText, bg: C.grey,       label: 'System / GW' },
          ].map(a => (
            <div key={a.label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10.5, color:C.muted }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:a.color }}/>
              {a.label}
            </div>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', color:C.faint, fontSize:12, marginTop:40, fontStyle:'italic' }}>
              No messages yet for this claim.<br/>
              Type below to send the first {channel.toUpperCase()}.
            </div>
          )}

          {grouped.map(group => (
            <div key={group.date}>
              {/* Date divider */}
              <div style={{ display:'flex', alignItems:'center', gap:8, margin:'8px 0' }}>
                <div style={{ flex:1, height:1, background:C.border }}/>
                <span style={{ fontSize:10, color:C.faint, fontWeight:600 }}>{group.date}</span>
                <div style={{ flex:1, height:1, background:C.border }}/>
              </div>

              {group.msgs.map(msg => {
                const isAdj    = msg.actor === 'adjuster'
                const isSystem = msg.actor === 'system'
                const isCust   = msg.actor === 'customer'

                if (isSystem) return (
                  <div key={msg.id} style={{ textAlign:'center', margin:'4px 0' }}>
                    <span style={{ fontSize:10.5, color:C.muted, background:C.grey, padding:'3px 12px', borderRadius:10, display:'inline-block' }}>
                      {CHANNEL_ICONS.system} {msg.body}
                    </span>
                  </div>
                )

                return (
                  <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: isAdj ? 'flex-end' : 'flex-start' }}>
                    {/* Actor label */}
                    <div style={{ fontSize:10, color:C.faint, marginBottom:2, paddingLeft: isCust ? 4 : 0, paddingRight: isAdj ? 4 : 0 }}>
                      {CHANNEL_ICONS[msg.channel]} {msg.from} · {fmtTime(msg.timestamp)}
                    </div>
                    {/* Bubble */}
                    <div style={{
                      maxWidth:      '75%',
                      padding:       '8px 12px',
                      borderRadius:  isAdj ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                      background:    isAdj ? C.teal : isCust ? C.orangeLight : C.grey,
                      color:         isAdj ? '#fff' : C.text,
                      border:        isAdj ? 'none' : `1px solid ${isCust ? C.orangeBorder : C.greyBorder}`,
                      fontSize:      12.5,
                      lineHeight:    1.5,
                      wordBreak:     'break-word',
                    }}>
                      {msg.body}
                    </div>
                    {/* Status */}
                    <div style={{ fontSize:9.5, color:C.faint, marginTop:2, paddingRight: isAdj ? 4 : 0 }}>
                      {msg.status === 'sending' ? '⏳ Sending...' :
                       msg.status === 'failed'  ? `❌ Failed: ${msg.error}` :
                       msg.status === 'received'? '✅ Received' : '✓ Delivered'}
                      {msg.twilioSid && <span style={{ marginLeft:4, opacity:.4 }}>· {msg.twilioSid.substring(0,12)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={chatEndRef}/>
        </div>

        {/* ── Compose area ── */}
        <div style={{ borderTop:`1px solid ${C.border}`, padding:'10px 14px', background:C.white }}>
          {/* Channel + recipient selectors */}
          <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center', flexWrap:'wrap' }}>
            {/* Channel tabs */}
            <div style={{ display:'flex', gap:2, background:C.bg, borderRadius:6, padding:2 }}>
              {(['sms','email','push'] as const).map(ch => (
                <button key={ch} onClick={() => setChannel(ch)} style={{
                  padding:'3px 10px', borderRadius:5, fontSize:11, fontWeight:600, border:'none',
                  background: channel===ch ? C.navy : 'transparent',
                  color:      channel===ch ? '#fff' : C.muted,
                  cursor:'pointer'
                }}>
                  {CHANNEL_ICONS[ch]} {ch.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Recipient selector */}
            <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
              <span style={{ fontSize:11, color:C.muted, whiteSpace:'nowrap' }}>To:</span>
              <select
                value={selectedTo}
                onChange={e => setSelectedTo(e.target.value)}
                style={{ flex:1, padding:'4px 8px', borderRadius:5, border:`1px solid ${C.border}`, fontSize:11.5, color:C.text, background:C.white, cursor:'pointer' }}
              >
                {customers.map(c => (
                  <option key={c.phone} value={c.phone}>{c.name} ({c.phone})</option>
                ))}
                {customers.length === 0 && <option>Loading customers...</option>}
              </select>
            </div>
          </div>

          {/* Error message */}
          {sendError && (
            <div style={{ fontSize:11, color:'#DC2626', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:5, padding:'5px 10px', marginBottom:6 }}>
              ⚠️ {sendError}
            </div>
          )}

          {/* Text input + send */}
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Type a ${channel.toUpperCase()} message... (Enter to send, Shift+Enter for new line)`}
              rows={2}
              style={{
                flex:1, padding:'8px 10px', borderRadius:7, border:`1px solid ${C.border}`,
                fontSize:12.5, color:C.text, resize:'none', fontFamily:'inherit',
                outline:'none', lineHeight:1.5,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!draft.trim() || sending || !connected}
              style={{
                padding:'8px 16px', borderRadius:7, border:'none', fontSize:12, fontWeight:700,
                background: (!draft.trim() || sending || !connected) ? C.faint : C.teal,
                color:'#fff', cursor: (!draft.trim() || sending) ? 'default' : 'pointer',
                whiteSpace:'nowrap', height:54,
              }}
            >
              {sending ? '⏳ Sending' : `Send ${channel.toUpperCase()} ➤`}
            </button>
          </div>
          <div style={{ fontSize:10, color:C.faint, marginTop:4 }}>
            {CHANNEL_ICONS[channel]} {channel === 'sms' ? `SMS via Twilio → Guidewire ClaimCenter` :
              channel === 'email' ? 'Email via SendGrid → Guidewire ClaimCenter' :
              'Push notification → browser · Guidewire ClaimCenter'}
            {customerSelected && <span> · to {customerSelected.shortName} ({customerSelected.phone})</span>}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Event Timeline (40%) ═══ */}
      <div style={{ flex:'0 0 40%', display:'flex', flexDirection:'column', background:'#F8FAFF' }}>

        {/* Timeline header */}
        <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, background:C.white }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:C.text }}>📋 Activity Timeline</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
            All events · SMS · Email · Push · GW sync
          </div>
        </div>

        {/* GW sync status banner */}
        <div style={{
          margin:'8px 10px 0',
          background: connected ? C.greenLight : '#FEF2F2',
          border:`1px solid ${connected ? C.tealBorder : '#FECACA'}`,
          borderRadius:6, padding:'6px 10px',
          fontSize:11, color: connected ? C.teal : '#DC2626',
          display:'flex', alignItems:'center', gap:6,
        }}>
          {connected ? '🟢' : '🔴'}
          <div>
            <div style={{ fontWeight:600 }}>{connected ? 'Guidewire Sync Active' : 'Sync offline'}</div>
            <div style={{ fontSize:10, opacity:.7 }}>
              {connected ? 'Messages logging to GW ClaimCenter Activities' : 'Start proxy: node server.js'}
            </div>
          </div>
        </div>

        {/* Timeline events */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px' }}>
          {timelineEvents.length === 0 && (
            <div style={{ textAlign:'center', color:C.faint, fontSize:11, marginTop:30, fontStyle:'italic' }}>
              Events will appear here as messages are sent and received
            </div>
          )}
          {[...timelineEvents].reverse().map((ev, i) => (
            <div key={ev.id} style={{ display:'flex', gap:8, marginBottom:10, opacity: i === 0 ? 1 : 0.85 }}>
              {/* Icon */}
              <div style={{
                width:28, height:28, borderRadius:'50%', flexShrink:0,
                background: ev.actor === 'adjuster' ? C.tealLight :
                            ev.actor === 'customer' ? C.orangeLight : C.grey,
                border:`1px solid ${
                  ev.actor === 'adjuster' ? C.tealBorder :
                  ev.actor === 'customer' ? C.orangeBorder : C.greyBorder}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:13,
              }}>
                {ev.icon}
              </div>
              {/* Content */}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11.5, fontWeight:600, color:C.text, lineHeight:1.3 }}>
                  {ev.label}
                </div>
                {ev.sub && (
                  <div style={{ fontSize:11, color:C.muted, marginTop:1, lineHeight:1.4 }}>
                    "{ev.sub}"
                  </div>
                )}
                <div style={{ fontSize:10, color:C.faint, marginTop:2, display:'flex', gap:8, alignItems:'center' }}>
                  <span>{ev.time}</span>
                  <span style={{
                    padding:'1px 6px', borderRadius:8, fontSize:9.5, fontWeight:600,
                    background: ev.status === 'received' ? C.greenLight :
                                ev.status === 'failed'   ? '#FEF2F2' : C.bg,
                    color:      ev.status === 'received' ? C.teal :
                                ev.status === 'failed'   ? '#DC2626' : C.muted,
                  }}>
                    {ev.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats footer */}
        <div style={{ padding:'8px 12px', borderTop:`1px solid ${C.border}`, background:C.white }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, textAlign:'center' }}>
            {[
              { label:'Sent',     val: messages.filter(m=>m.actor==='adjuster').length, color:C.teal   },
              { label:'Received', val: messages.filter(m=>m.actor==='customer').length, color:C.orange },
              { label:'GW Synced',val: messages.filter(m=>m.actor!=='system').length,  color:C.navy   },
            ].map(s => (
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
