/* ═══════════════════════════════════════════════════════════════
   SmartOfferCard.tsx — Animated offer card with vendor picker
   Features:
   · Single vendor → direct open in new tab
   · Multiple vendors → picker dropdown
   · All vendors available:false → "Coming soon" greyed button
   · Same carrier (valuemomentum.com) → direct open
   · Slide-in animation + pulse highlight on change
   · Hover lift effect
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */
import { useState, useEffect, useRef } from 'react'
import type { Offer, VendorLink } from '@/lib/crossSellEngine'

interface Props {
  offer:     Offer
  variant:   'upsell' | 'crosssell'
  animate?:  boolean
  onDismiss?: (id: string) => void
}

const T = {
  upBg:'#E1F5EE', upBorder:'#5DCAA5', upBadgeBg:'#9FE1CB', upBadgeTxt:'#085041',
  upIconBg:'#9FE1CB', upBtn:'#0F6E56', upBtnTxt:'#E1F5EE',
  csBg:'#FAECE7', csBorder:'#F0997B', csBadgeBg:'#F5C4B3', csBadgeTxt:'#4A1B0C',
  csIconBg:'#F5C4B3', csBtn:'#993C1D', csBtnTxt:'#FAECE7',
  divider:'rgba(0,0,0,.06)', text:'#1A2744', sub:'#4A5568', muted:'#A0AEC0',
  comingSoonBg:'#F5F5F5', comingSoonTxt:'#A0AEC0', comingSoonBorder:'#E2E8F2',
  pickerBg:'#FFFFFF', pickerBorder:'#E2E8F2', pickerHover:'#F5F8FF',
}

/* Checks if ALL vendors are coming-soon */
const allComingSoon = (vendors: VendorLink[]) => vendors.every(v => !v.available)

export default function SmartOfferCard({ offer, variant, animate = false, onDismiss }: Props) {
  const isUp = variant === 'upsell'
  const [visible,    setVisible]    = useState(false)
  const [pulsing,    setPulsing]    = useState(false)
  const [dismissed,  setDismissed]  = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const prevId = useRef<string>('')
  const pickerRef = useRef<HTMLDivElement>(null)

  /* Slide in on mount */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  /* Pulse + slide when offer id changes */
  useEffect(() => {
    if (!animate || !prevId.current || prevId.current === offer.id) {
      prevId.current = offer.id
      return
    }
    setVisible(false)
    setPickerOpen(false)
    const t1 = setTimeout(() => { setVisible(true); setPulsing(true) }, 260)
    const t2 = setTimeout(() => setPulsing(false), 1800)
    prevId.current = offer.id
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [offer.id, animate])

  /* Close picker on outside click */
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  if (dismissed) return null

  const bg     = isUp ? T.upBg     : T.csBg
  const border = isUp ? T.upBorder : T.csBorder
  const bdgBg  = isUp ? T.upBadgeBg: T.csBadgeBg
  const bdgTxt = isUp ? T.upBadgeTxt:T.csBadgeTxt
  const icoBg  = isUp ? T.upIconBg  : T.csIconBg
  const btn    = isUp ? T.upBtn    : T.csBtn
  const btnTxt = isUp ? T.upBtnTxt : T.csBtnTxt

  const comingSoon = allComingSoon(offer.vendors)
  const singleVendor = offer.vendors.length === 1
  const multiVendor  = offer.vendors.length > 1

  /* ── CTA click handler ── */
  const handleCTA = () => {
    if (comingSoon) return
    if (singleVendor) {
      window.open(offer.vendors[0].url || 'https://valuemomentum.com', '_blank')
      return
    }
    // multi-vendor → toggle picker
    setPickerOpen(p => !p)
  }

  const pulseBoxShadow = pulsing
    ? isUp ? '0 0 0 5px rgba(15,110,86,.2)' : '0 0 0 5px rgba(153,60,29,.2)'
    : 'none'

  return (
    <div
      style={{
        background:    bg,
        border:        `1px solid ${border}`,
        borderRadius:  8,
        padding:       '11px 12px',
        display:       'flex',
        flexDirection: 'column',
        gap:           7,
        opacity:       visible ? 1 : 0,
        transform:     visible ? 'translateX(0) translateY(0)' : (isUp ? 'translateX(-16px)' : 'translateX(16px)'),
        transition:    'opacity .25s ease, transform .25s ease, box-shadow .4s ease',
        boxShadow:     pulseBoxShadow,
        position:      'relative',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px rgba(0,0,0,.10)` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';    (e.currentTarget as HTMLElement).style.boxShadow = pulseBoxShadow }}
    >
      {/* Top: icon + badge + title */}
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

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:6, borderTop:`1px solid ${T.divider}` }}>
        {/* Powered by text */}
        <div style={{ fontSize:9.5, color:T.muted, lineHeight:1.3, flex:1, paddingRight:6 }}>
          {offer.vendors.map(v => v.name).join(' · ')}
        </div>

        {/* CTA + dismiss */}
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          {comingSoon ? (
            /* Coming soon state */
            <div style={{ fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:5, background:T.comingSoonBg, color:T.comingSoonTxt, border:`1px solid ${T.comingSoonBorder}`, cursor:'default', whiteSpace:'nowrap' }}
              title="Partner enrollment in progress — integration coming soon">
              Coming soon
            </div>
          ) : (
            <button
              onClick={handleCTA}
              style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:5, border:'none', background:btn, color:btnTxt, cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:3 }}
            >
              {offer.cta}
              {multiVendor && <span style={{ fontSize:9, opacity:.7 }}>{pickerOpen ? '▲' : '▼'}</span>}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => { setDismissed(true); onDismiss(offer.id) }}
              style={{ fontSize:10, color:T.muted, background:'none', border:'none', cursor:'pointer', padding:'0 2px', lineHeight:1 }}
              title="Dismiss"
            >✕</button>
          )}
        </div>
      </div>

      {/* Vendor Picker dropdown */}
      {pickerOpen && multiVendor && (
        <div
          ref={pickerRef}
          style={{
            position:    'absolute',
            bottom:      'calc(100% + 4px)',
            right:       0,
            background:  T.pickerBg,
            border:      `1px solid ${T.pickerBorder}`,
            borderRadius:8,
            boxShadow:   '0 4px 16px rgba(0,0,0,.12)',
            zIndex:      100,
            minWidth:    200,
            overflow:    'hidden',
            animation:   'fadeDown .15s ease',
          }}
        >
          <div style={{ padding:'7px 10px', fontSize:9.5, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${T.pickerBorder}` }}>
            Select vendor to explore
          </div>
          {offer.vendors.map(vendor => (
            <div
              key={vendor.name}
              onClick={() => {
                if (!vendor.available) return
                window.open(vendor.url, '_blank')
                setPickerOpen(false)
              }}
              style={{
                padding:     '8px 12px',
                display:     'flex',
                alignItems:  'center',
                justifyContent:'space-between',
                gap:         8,
                cursor:      vendor.available ? 'pointer' : 'default',
                borderBottom:`1px solid ${T.pickerBorder}`,
                opacity:     vendor.available ? 1 : 0.5,
                transition:  'background .1s',
              }}
              onMouseEnter={e => { if (vendor.available) (e.currentTarget as HTMLElement).style.background = T.pickerHover }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <div>
                <div style={{ fontSize:11.5, fontWeight:600, color: vendor.available ? T.text : T.muted }}>
                  {vendor.name}
                </div>
                {!vendor.available && (
                  <div style={{ fontSize:9.5, color:T.muted, marginTop:1 }}>
                    Coming soon — partner enrollment in progress
                  </div>
                )}
              </div>
              {vendor.available && (
                <span style={{ fontSize:10, color:isUp ? '#0F6E56' : '#993C1D', fontWeight:700 }}>
                  View docs →
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(4px) }
          to   { opacity:1; transform:translateY(0) }
        }
      `}</style>
    </div>
  )
}
