/* ═══════════════════════════════════════════════════════════════
   OfferBanner.tsx — Coverage gap alert banner
   Appears above center tab content when gaps detected
   Dismissible, soft yellow, non-blocking
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */
import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  message:  string
  onReview?: () => void
}

export default function OfferBanner({ message, onReview }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div style={{
      display:       'flex',
      alignItems:    'flex-start',
      gap:           8,
      background:    '#FAEEDA',
      border:        '1px solid #FAC775',
      borderRadius:  7,
      padding:       '9px 12px',
      marginBottom:  12,
      animation:     'fadeIn .3s ease',
    }}>
      <AlertTriangle size={14} color="#854F0B" style={{ flexShrink:0, marginTop:1 }}/>
      <div style={{ flex:1, fontSize:12, color:'#633806', lineHeight:1.5 }}>
        {message}
      </div>
      {onReview && (
        <button
          onClick={onReview}
          style={{ fontSize:11.5, fontWeight:700, color:'#854F0B', background:'none', border:'none', cursor:'pointer', whiteSpace:'nowrap', padding:'0 4px' }}
        >
          Review coverage →
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        style={{ fontSize:15, color:'#854F0B', background:'none', border:'none', cursor:'pointer', padding:'0 2px', lineHeight:1, flexShrink:0 }}
        title="Dismiss"
      >×</button>
    </div>
  )
}
