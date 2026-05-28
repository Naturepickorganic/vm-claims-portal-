/* ═══════════════════════════════════════════════════════════════
   SmartOfferCard.tsx — Animated offer card component
   Variants: upsell (teal) | crosssell (orange)
   Features: slide-in animation, pulse highlight, dismiss
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from 'react'
import type { Offer } from '@/lib/crossSellEngine'

interface Props {
  offer:    Offer
  variant:  'upsell' | 'crosssell'
  animate?: boolean   // trigger slide+pulse on mount/change
  onDismiss?: (id:string) => void
}

const T = {
  upBg:        '#E1F5EE', upBorder:  '#5DCAA5', upBadgeBg: '#9FE1CB', upBadgeTxt: '#085041',
  upIconBg:    '#9FE1CB', upIconTxt: '#085041',  upBtn:     '#0F6E56', upBtnTxt:   '#E1F5EE',
  csBg:        '#FAECE7', csBorder:  '#F0997B',  csBadgeBg: '#F5C4B3', csBadgeTxt: '#4A1B0C',
  csIconBg:    '#F5C4B3', csIconTxt: '#4A1B0C',  csBtn:     '#993C1D', csBtnTxt:   '#FAECE7',
  divider:     'rgba(0,0,0,.06)', text: '#1A2744', sub: '#4A5568', muted: '#A0AEC0',
}

export default function SmartOfferCard({ offer, variant, animate = false, onDismiss }: Props) {
  const isUp  = variant === 'upsell'
  const [visible,   setVisible]   = useState(false)
  const [pulsing,   setPulsing]   = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const prevId = useRef<string>('')

  /* Slide in on mount */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  /* Pulse when offer changes */
  useEffect(() => {
    if (!animate) return
    if (prevId.current && prevId.current !== offer.id) {
      setVisible(false)
      const t1 = setTimeout(() => { setVisible(true); setPulsing(true) }, 260)
      const t2 = setTimeout(() => setPulsing(false), 1800)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
    prevId.current = offer.id
  }, [offer.id, animate])

  if (dismissed) return null

  const bg      = isUp ? T.upBg      : T.csBg
  const border  = isUp ? T.upBorder  : T.csBorder
  const bdgBg   = isUp ? T.upBadgeBg : T.csBadgeBg
  const bdgTxt  = isUp ? T.upBadgeTxt: T.csBadgeTxt
  const icoBg   = isUp ? T.upIconBg  : T.csIconBg
  const btn     = isUp ? T.upBtn     : T.csBtn
  const btnTxt  = isUp ? T.upBtnTxt  : T.csBtnTxt

  const pulseStyle = pulsing ? {
    boxShadow: isUp
      ? '0 0 0 4px rgba(15,110,86,.25)'
      : '0 0 0 4px rgba(153,60,29,.25)',
    transition: 'box-shadow .4s ease, transform .25s ease, opacity .25s ease',
  } : {}

  return (
    <div style={{
      background:    bg,
      border:        `1px solid ${border}`,
      borderRadius:  8,
      padding:       '11px 12px',
      display:       'flex',
      flexDirection: 'column',
      gap:           7,
      opacity:       visible ? 1 : 0,
      transform:     visible ? 'translateX(0)' : (isUp ? 'translateX(-18px)' : 'translateX(18px)'),
      transition:    'opacity .25s ease, transform .25s ease',
      cursor:        'default',
      ...pulseStyle,
    }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform  = 'translateY(-2px)'
        el.style.boxShadow  = '0 4px 14px rgba(0,0,0,.10)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform  = 'translateY(0)'
        el.style.boxShadow  = pulsing ? (isUp ? '0 0 0 4px rgba(15,110,86,.25)' : '0 0 0 4px rgba(153,60,29,.25)') : 'none'
      }}
    >
      {/* Top row: icon + badge + title */}
      <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
        <div style={{ width:34, height:34, borderRadius:7, background:icoBg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
          {offer.icon}
        </div>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:9.5, fontWeight:700, padding:'1px 6px', borderRadius:8, background:bdgBg, color:bdgTxt, display:'inline-block', marginBottom:3 }}>
            {offer.badge}
          </span>
          <div style={{ fontSize:11.5, fontWeight:700, color:T.text, lineHeight:1.3 }}>
            {offer.title}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize:10.5, color:T.sub, lineHeight:1.55 }}>
        {offer.desc}
      </div>

      {/* Footer: powered-by + CTA */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:6, borderTop:`1px solid ${T.divider}` }}>
        <div style={{ fontSize:9.5, color:T.muted, lineHeight:1.3, flex:1, paddingRight:6 }}>
          {offer.poweredBy}
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button
            onClick={() => window.open('https://valuemomentum.com', '_blank')}
            style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:5, border:'none', background:btn, color:btnTxt, cursor:'pointer', whiteSpace:'nowrap' }}
          >
            {offer.cta}
          </button>
          {onDismiss && (
            <button
              onClick={() => { setDismissed(true); onDismiss(offer.id) }}
              style={{ fontSize:10, color:T.muted, background:'none', border:'none', cursor:'pointer', padding:'0 2px', lineHeight:1 }}
              title="Dismiss"
            >✕</button>
          )}
        </div>
      </div>
    </div>
  )
}
