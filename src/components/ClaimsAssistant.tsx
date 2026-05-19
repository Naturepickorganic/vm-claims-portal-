import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import VMlogo from '@/components/ui/VMlogo'

/* ── Brand tokens ── */
const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', muted:'#718096', faint:'#A0AEC0',
}

/* ── Types ── */
interface Message { role:'user'|'assistant'|'system'; content:string; id:string }
interface ClaimContext {
  claimNumber:string; insuredName:string; policyNumber:string; lobType:string
  claimStatus:string; statusType:string; vehicle:string; lossType:string
  dateOfLoss:string; reportedDate:string; adjusterName:string; adjusterPhone:string
  activeStep:number; statusMsg:string; repairShop:string; rentalInfo:string
}

interface Props {
  claimContext?: ClaimContext | null
  mode?: 'full' | 'limited'  // limited = not logged in (TrackResult)
}

/* ── Quick action menu items ── */
const QUICK_ACTIONS = [
  { id:'status',   icon:'📊', label:'Check my claim status',    auto:true,  prop:true  },
  { id:'file',     icon:'📋', label:'File a new claim',         auto:true,  prop:true  },
  { id:'payment',  icon:'💳', label:'Payment question',         auto:true,  prop:true  },
  { id:'adjuster', icon:'📞', label:'Reach my adjuster',        auto:true,  prop:true  },
  { id:'roadside', icon:'🚛', label:'Roadside assistance',      auto:true,  prop:false },
  { id:'ale',      icon:'🏨', label:'Housing / ALE question',   auto:false, prop:true  },
  { id:'other',    icon:'💬', label:'Something else',           auto:true,  prop:true  },
]

/* ── Greeting for limited (not logged in) mode ── */
const LIMITED_GREETING = `Hi! I'm the **ValueMomentum Claims Assistant**. I can answer general claims questions here.

For full claim details — payment amounts, adjuster contact, and your complete timeline — please log in.

How can I help you today?`

const FULL_GREETING = `Hi! I'm the **ValueMomentum Claims Assistant** 👋

I can help you with claim status, file a new claim, answer payment questions, or connect you with your adjuster.

What can I help you with today?`

export default function ClaimsAssistant({ claimContext, mode = 'full' }: Props) {
  const navigate  = useNavigate()
  const [open,    setOpen]    = useState(false)
  const [msgs,    setMsgs]    = useState<Message[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [typing,  setTyping]  = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  /* Scroll to bottom on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [msgs, typing])

  /* Focus input when opened */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  /* Initialize greeting when opened first time */
  useEffect(() => {
    if (open && msgs.length === 0) {
      const greeting = mode === 'limited' ? LIMITED_GREETING : FULL_GREETING
      setMsgs([{ role:'assistant', content:greeting, id:'greeting' }])
    }
  }, [open, mode])

  const addMsg = (role: 'user'|'assistant', content: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`
    setMsgs(prev => [...prev, { role, content, id }])
    return id
  }

  /* Send message to api/chat.ts */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    addMsg('user', text)
    setLoading(true)
    setTyping(true)

    /* Build messages array for Claude (exclude system messages) */
    const history = [
      ...msgs.filter(m => m.role !== 'system').map(m => ({ role:m.role, content:m.content })),
      { role:'user', content:text },
    ]

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          messages:     history,
          claimContext: claimContext || null,
          sessionId,
        }),
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)

      /* Read SSE stream */
      const reader   = res.body!.getReader()
      const decoder  = new TextDecoder()
      let   fullText = ''
      const msgId    = `stream_${Date.now()}`

      setTyping(false)
      setMsgs(prev => [...prev, { role:'assistant', content:'', id:msgId }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream:true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              fullText += parsed.text
              setMsgs(prev => prev.map(m =>
                m.id === msgId ? { ...m, content: fullText } : m
              ))
            }
          } catch { /* ignore parse errors */ }
        }
      }

    } catch (err: any) {
      setTyping(false)
      addMsg('assistant', `Sorry, I ran into an issue. Please try again. (${err.message})`)
    } finally {
      setLoading(false)
      setTyping(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [msgs, loading, claimContext, sessionId])

  /* Handle quick action button clicks */
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.id === 'roadside') {
      navigate('/roadside')
      setOpen(false)
      return
    }
    if (mode === 'limited' && ['file','payment','adjuster','status'].includes(action.id)) {
      const redirectUrl = claimContext
        ? `/claims/search?claim=${claimContext.claimNumber}`
        : '/claims/search'
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`)
      setOpen(false)
      return
    }

    const prompts: Record<string,string> = {
      status:   claimContext ? `What is the current status of claim ${claimContext.claimNumber}?` : 'I want to check my claim status.',
      file:     'I need to file a new claim.',
      payment:  claimContext ? `What is the payment status for claim ${claimContext.claimNumber}?` : 'I have a question about my payment.',
      adjuster: claimContext ? `How can I reach my adjuster for claim ${claimContext.claimNumber}?` : 'How can I reach my adjuster?',
      ale:      'I need help with my housing / Additional Living Expenses (ALE).',
      other:    'I have a question.',
    }
    sendMessage(prompts[action.id] || action.label)
  }

  /* Render message content — simple markdown bold/italic */
  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} style={{ fontWeight:600 }}>{part.slice(2,-2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1,-1)}</em>
      return <span key={i}>{part}</span>
    })
  }

  /* Which quick actions to show based on LOB and mode */
  const visibleActions = QUICK_ACTIONS.filter(a =>
    !claimContext ? true :
    claimContext.lobType === 'property' ? a.prop :
    a.auto
  )

  const showQuickActions = msgs.length <= 1

  return (
    <>
      {/* ── FLOATING BUBBLE ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open ValueMomentum Claims Assistant"
        style={{
          position:'fixed', bottom:24, right:24, zIndex:9998,
          width:56, height:56, borderRadius:'50%',
          background: open ? C.muted : C.navy,
          border:'none', cursor:'pointer',
          boxShadow:'0 4px 20px rgba(2,64,153,.35)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, transition:'all .2s',
        }}>
        {open ? '✕' : '💬'}
      </button>

      {/* ── CHAT PANEL ── */}
      {open && (
        <div style={{
          position:'fixed', bottom:92, right:24, zIndex:9997,
          width:380, height:580, maxHeight:'calc(100vh - 110px)',
          background:C.white, borderRadius:16,
          border:`1px solid ${C.border}`,
          boxShadow:'0 8px 40px rgba(2,64,153,.18)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          fontFamily:'"DM Sans",system-ui,sans-serif',
          animation:'slideUp .25s ease',
        }}>
          <style>{`
            @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
            @keyframes blink{0%,80%,100%{opacity:0}40%{opacity:1}}
            .dot-typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:${C.faint};margin:0 2px;animation:blink 1.4s infinite both;}
            .dot-typing span:nth-child(2){animation-delay:.2s}
            .dot-typing span:nth-child(3){animation-delay:.4s}
            .chat-msg{word-break:break-word;line-height:1.55;}
            .quick-btn:hover{background:${C.bluePale}!important;border-color:${C.navy}!important;}
          `}</style>

          {/* Header */}
          <div style={{ background:C.navy, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:18 }}>🤖</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.white, lineHeight:1.2 }}>ValueMomentum Claims Assistant</div>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,.6)', marginTop:1 }}>
                {mode === 'limited' ? 'Limited mode — log in for full access' : (loading ? '⟳ Thinking…' : '● Online · Powered by Claude')}
              </div>
            </div>
            {claimContext && (
              <div style={{ fontSize:10, background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.85)', padding:'2px 8px', borderRadius:10, whiteSpace:'nowrap', flexShrink:0 }}>
                #{claimContext.claimNumber?.slice(-6)}
              </div>
            )}
          </div>

          {/* Claim context banner */}
          {claimContext && mode === 'full' && (
            <div style={{ background:C.bluePale, borderBottom:`1px solid ${C.blueBorder}`, padding:'7px 14px', fontSize:11.5, color:C.navy, display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              <span>{claimContext.lobType === 'property' ? '🏠' : '🚗'}</span>
              <span><strong>{claimContext.vehicle?.split('·')[0]?.trim()}</strong> · {claimContext.statusType === 'on-track' ? '✅ On Track' : claimContext.statusType === 'action-needed' ? '⚡ Action Needed' : '⚫ Closed'} · Step {claimContext.activeStep}/8</span>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
            {msgs.map(msg => (
              <div key={msg.id} style={{ display:'flex', flexDirection:'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className="chat-msg" style={{
                  maxWidth:'86%', padding:'9px 13px', borderRadius:12, fontSize:13,
                  background: msg.role === 'user' ? C.navy : C.bg,
                  color:      msg.role === 'user' ? C.white : C.text,
                  borderBottomRightRadius: msg.role === 'user' ? 3 : 12,
                  borderBottomLeftRadius:  msg.role === 'user' ? 12 : 3,
                  border: msg.role === 'user' ? 'none' : `1px solid ${C.border}`,
                }}>
                  {msg.content ? renderContent(msg.content) : <span style={{ color:C.faint }}>…</span>}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div style={{ display:'flex', alignItems:'flex-start' }}>
                <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, borderBottomLeftRadius:3, padding:'10px 14px' }}>
                  <div className="dot-typing"><span/><span/><span/></div>
                </div>
              </div>
            )}

            {/* Quick action buttons — show after greeting */}
            {showQuickActions && msgs.length === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:4 }}>
                {visibleActions.map(a => (
                  <button key={a.id} className="quick-btn" onClick={() => handleQuickAction(a)}
                    style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 13px',
                      background:C.white, border:`1px solid ${C.border}`, borderRadius:10,
                      fontSize:12.5, fontWeight:600, color:C.text, cursor:'pointer',
                      textAlign:'left', transition:'all .15s' }}>
                    <span style={{ fontSize:16 }}>{a.icon}</span>
                    {a.label}
                    <span style={{ marginLeft:'auto', color:C.faint, fontSize:11 }}>→</span>
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{ padding:'10px 12px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, alignItems:'center', flexShrink:0, background:C.white }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder={loading ? 'Please wait…' : 'Type your message…'}
              disabled={loading}
              style={{
                flex:1, fontSize:13, border:`1px solid ${C.border}`, borderRadius:9,
                padding:'8px 11px', color:C.text, outline:'none', fontFamily:'inherit',
                background: loading ? C.bg : C.white,
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Send"
              style={{
                width:36, height:36, borderRadius:'50%', border:'none',
                background: loading || !input.trim() ? C.bg : C.navy,
                color: loading || !input.trim() ? C.faint : C.white,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all .15s', flexShrink:0,
              }}>
              {loading ? '⟳' : '↑'}
            </button>
          </div>

          {/* Footer */}
          <div style={{ padding:'4px 14px 8px', fontSize:10, color:C.faint, textAlign:'center', background:C.white, flexShrink:0 }}>
            ValueMomentum Claims Assistant · Powered by Claude · Not a substitute for adjuster advice
          </div>
        </div>
      )}
    </>
  )
}
