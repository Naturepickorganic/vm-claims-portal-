import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, AlertCircle, CheckCircle, Clock, History, FileText, Camera, CloudUpload, FolderOpen, Info, AlertTriangle } from 'lucide-react'

/* ── Brand tokens ── */
const C = {
  navy:'#024099', blue:'#0254CC', bluePale:'#EBF3FF', blueBorder:'#BFDBFE',
  green:'#2EB124', greenLight:'#EDFAEB', greenBorder:'#A8E4A2',
  amber:'#D97706', amberLight:'#FFFBEB', amberBorder:'#FDE68A',
  red:'#DC2626', redLight:'#FEF2F2', redBorder:'#FECACA',
  border:'#E2E8F2', bg:'#F5F8FF', white:'#FFFFFF',
  text:'#1A2744', mid:'#4A5568', muted:'#718096', faint:'#A0AEC0',
}

/* ── Types ── */
type DocStatus = 'ready' | 'new' | 'pending'
type FileStatus = 'accepted' | 'reviewing' | 'reupload'
type ReqStatus  = 'urgent' | 'warning' | 'done'

interface GWDocument {
  id: string; name: string; docType: string; mimeType: string
  sizeKB: number; uploadedDate: string; source: string; status: DocStatus
  downloadable: boolean
}

interface AdjusterRequest {
  id: string; title: string; description: string; dueDate: string
  status: ReqStatus; required: number; submitted: number; acceptedTypes: string[]
}

interface UploadedFile {
  id: string; name: string; sizeKB: number; uploadedDate: string
  category: string; status: FileStatus; mimeType: string
}

interface ActivityItem {
  id: string; title: string; sub: string; date: string
  color: 'green' | 'blue' | 'amber' | 'red'
}

interface Props {
  claimNumber: string
  lobType: 'auto' | 'property'
}

/* ══════════════════════════════════════════════════════════
   MOCK DATA — 🔌 Replace with GW API calls
   GET /claim/v1/claims/{id}/documents
   ══════════════════════════════════════════════════════════ */
const MOCK_DOCS: Record<string, GWDocument[]> = {
  '000-00-000480': [
    { id:'doc-001', name:'Claim Acknowledgement Letter',    docType:'acknowledgement',  mimeType:'application/pdf', sizeKB:245,  uploadedDate:'Sep 15, 2024', source:'Auto-generated',          status:'ready',   downloadable:true  },
    { id:'doc-002', name:'Repair Estimate — $8,267',        docType:'estimate',         mimeType:'application/pdf', sizeKB:1240, uploadedDate:'May 16, 2025', source:'Caliber Collision Dallas', status:'new',     downloadable:true  },
    { id:'doc-003', name:'Coverage Verification Letter',    docType:'coverage',         mimeType:'application/pdf', sizeKB:180,  uploadedDate:'May 15, 2025', source:'Auto-generated',          status:'ready',   downloadable:true  },
    { id:'doc-004', name:'Supplement Approval — $1,420',    docType:'supplement',       mimeType:'application/pdf', sizeKB:210,  uploadedDate:'May 17, 2025', source:'Emily Rodriguez',         status:'new',     downloadable:true  },
    { id:'doc-005', name:'Rental Authorization — ENT-88421',docType:'rental',           mimeType:'application/pdf', sizeKB:98,   uploadedDate:'May 14, 2025', source:'Enterprise ARMS',         status:'ready',   downloadable:true  },
    { id:'doc-006', name:'Settlement / Closure Letter',     docType:'settlement',       mimeType:'application/pdf', sizeKB:0,    uploadedDate:'',             source:'Pending repairs',          status:'pending', downloadable:false },
  ],
  '000-00-000750': [
    { id:'doc-101', name:'Claim Acknowledgement Letter',    docType:'acknowledgement',  mimeType:'application/pdf', sizeKB:245,  uploadedDate:'Apr 28, 2025', source:'Auto-generated',          status:'ready',   downloadable:true  },
    { id:'doc-102', name:'Xactimate Estimate — $28,400',    docType:'estimate',         mimeType:'application/pdf', sizeKB:1840, uploadedDate:'May 10, 2025', source:'Verisk / Xactimate',      status:'new',     downloadable:true  },
    { id:'doc-103', name:'ACV Payment Confirmation',        docType:'payment',          mimeType:'application/pdf', sizeKB:155,  uploadedDate:'May 13, 2025', source:'Auto-generated',          status:'ready',   downloadable:true  },
    { id:'doc-104', name:'ALE Authorization Letter',        docType:'ale',              mimeType:'application/pdf', sizeKB:188,  uploadedDate:'Apr 29, 2025', source:'Auto-generated',          status:'ready',   downloadable:true  },
    { id:'doc-105', name:'Contractor Assignment — Alacrity',docType:'contractor',       mimeType:'application/pdf', sizeKB:122,  uploadedDate:'Apr 30, 2025', source:'Alacrity Network',        status:'ready',   downloadable:true  },
    { id:'doc-106', name:'RCV Holdback Release Letter',     docType:'settlement',       mimeType:'application/pdf', sizeKB:0,    uploadedDate:'',             source:'Pending completion',       status:'pending', downloadable:false },
  ],
}

const MOCK_REQUESTS: Record<string, AdjusterRequest[]> = {
  '000-00-000480': [
    { id:'req-001', title:'Vehicle damage photos — 4 required', description:'Upload 4–6 clear photos of all damaged areas: front bumper, rear, driver side, passenger side. Photos must be taken in daylight. Max 50 MB each.', dueDate:'May 20', status:'urgent',  required:4, submitted:0, acceptedTypes:['JPG','PNG','HEIC','MP4','MOV'] },
    { id:'req-002', title:"Driver's license — both sides",       description:"The previous upload was blurry. Re-upload a clear, well-lit photo of both the front and back of your driver's license. Place on a flat surface with no glare.",   dueDate:'May 22', status:'warning', required:2, submitted:1, acceptedTypes:['JPG','PNG','HEIC'] },
    { id:'req-003', title:'Police report',                        description:'Police report #DPD-2025-03891 has been received and accepted.',                                                                                                         dueDate:'May 14', status:'done',    required:1, submitted:1, acceptedTypes:['PDF'] },
  ],
  '000-00-000750': [
    { id:'req-101', title:'Contractor invoice — progress billing', description:'Please ask ABC Restoration to submit their progress billing invoice showing work completed to date. Required to release next payment tranche.', dueDate:'Jun 1', status:'warning', required:1, submitted:0, acceptedTypes:['PDF','JPG','PNG'] },
    { id:'req-102', title:'Signed completion certificate',         description:'City of Plano final inspection certificate. Required to release the RCV holdback of $3,550.',                                                  dueDate:'Jun 6', status:'urgent',  required:1, submitted:0, acceptedTypes:['PDF','JPG','PNG'] },
  ],
}

const MOCK_UPLOADS: Record<string, UploadedFile[]> = {
  '000-00-000480': [
    { id:'upl-001', name:'damage_front_bumper.jpg',    sizeKB:2400, uploadedDate:'May 13', category:'Damage photo',  status:'accepted',  mimeType:'image/jpeg' },
    { id:'upl-002', name:'damage_rear_panel.jpg',      sizeKB:1900, uploadedDate:'May 13', category:'Damage photo',  status:'accepted',  mimeType:'image/jpeg' },
    { id:'upl-003', name:'damage_driver_side.jpg',     sizeKB:3100, uploadedDate:'May 13', category:'Damage photo',  status:'accepted',  mimeType:'image/jpeg' },
    { id:'upl-004', name:'police_report_DPD2025.pdf',  sizeKB:890,  uploadedDate:'May 14', category:'Police report', status:'accepted',  mimeType:'application/pdf' },
    { id:'upl-005', name:'drivers_license_front.jpg',  sizeKB:450,  uploadedDate:'May 13', category:'ID document',   status:'reupload',  mimeType:'image/jpeg' },
  ],
  '000-00-000750': [
    { id:'upl-101', name:'roof_damage_overview.jpg',   sizeKB:3800, uploadedDate:'Apr 28', category:'Damage photo',  status:'accepted',  mimeType:'image/jpeg' },
    { id:'upl-102', name:'interior_water_damage.jpg',  sizeKB:2100, uploadedDate:'Apr 28', category:'Damage photo',  status:'accepted',  mimeType:'image/jpeg' },
    { id:'upl-103', name:'insurance_card.pdf',         sizeKB:320,  uploadedDate:'Apr 28', category:'Insurance doc', status:'accepted',  mimeType:'application/pdf' },
  ],
}

const MOCK_ACTIVITY: Record<string, ActivityItem[]> = {
  '000-00-000480': [
    { id:'a1', title:'Vehicle damage photos requested by Emily Rodriguez', sub:'4 photos required · Due May 20 · Sourced from GW claim activity',               date:'May 18', color:'amber' },
    { id:'a2', title:'Supplement approval letter generated',               sub:'supplement_approval_1420.pdf · 210 KB · Auto-generated after adjuster approval', date:'May 17', color:'blue'  },
    { id:'a3', title:'Repair estimate uploaded by Caliber Collision',      sub:'estimate_caliber_8267.pdf · 1.2 MB · Via CCC/Mitchell integration',             date:'May 16', color:'blue'  },
    { id:'a4', title:"Driver's license re-upload requested",               sub:'"Image was blurry — please re-upload both sides" — Emily Rodriguez',             date:'May 14', color:'red'   },
    { id:'a5', title:'Police report accepted by Emily Rodriguez',          sub:'dpd_report_DPD2025.pdf · Liability investigation opened',                        date:'May 14', color:'green' },
    { id:'a6', title:'3 damage photos accepted',                           sub:'damage_front.jpg · damage_rear.jpg · damage_driver_side.jpg — all approved',     date:'May 13', color:'green' },
    { id:'a7', title:'Coverage verification letter generated',             sub:'Collision coverage confirmed · $500 deductible · Rental included',               date:'May 15', color:'blue'  },
    { id:'a8', title:'Claim acknowledgement letter generated',             sub:'Sent to rosario@email.com and (214) 555-0181',                                   date:'Sep 15, 2024', color:'green' },
  ],
  '000-00-000750': [
    { id:'b1', title:'Signed completion certificate requested by Maria Delgado', sub:'Required to release $3,550 RCV holdback · Due Jun 6',                    date:'May 20', color:'red'   },
    { id:'b2', title:'Contractor invoice requested',                             sub:'Progress billing required from ABC Restoration · Due Jun 1',              date:'May 18', color:'amber' },
    { id:'b3', title:'ACV payment confirmation generated',                       sub:'$24,850 disbursed via OneInc · Confirmation sent to sarah.mitchell@email.com', date:'May 13', color:'green' },
    { id:'b4', title:'Xactimate estimate uploaded',                              sub:'xactimate_estimate_28400.pdf · 1.84 MB · Verisk/Xactimate integration',   date:'May 10', color:'blue'  },
    { id:'b5', title:'2 damage photos accepted',                                 sub:'roof_damage_overview.jpg · interior_water_damage.jpg',                    date:'Apr 29', color:'green' },
    { id:'b6', title:'Claim acknowledgement letter generated',                   sub:'Sent to sarah.mitchell@email.com and (972) 555-0441',                      date:'Apr 28, 2025', color:'green' },
  ],
}

/* ── Accepted file types ── */
const ALL_TYPES = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.heic,.mov,.mp4'

/* ── File icon by MIME ── */
function FileIcon({ mime, size = 18 }: { mime: string; size?: number }) {
  const s = { fontSize: size, flexShrink: 0 }
  if (mime.startsWith('image/'))      return <img src="" alt="" style={{ display:'none' }} />
  if (mime.startsWith('video/'))      return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z"/></svg>
  if (mime === 'application/pdf')     return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z"/></svg>
  if (mime.includes('word') || mime.includes('docx')) return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z"/></svg>
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125V5.625m0 12.75v-1.5m0-11.25c0-.621.504-1.125 1.125-1.125H6m-3.75 0h3.75m-3.75 0c0 .621.504 1.125 1.125 1.125m0 0h12.75M6 5.625h12.75M6 5.625c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125M6 5.625v12.75m12.75-12.75c.621 0 1.125.504 1.125 1.125v12.75m-1.125 1.125H20.625c.621 0 1.125-.504 1.125-1.125M18.75 19.5V6.75"/></svg>
  return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z"/></svg>
}

/* ── GW API footer ── */
function GWTag({ endpoints }: { endpoints: string[] }) {
  return (
    <div style={{ marginTop:10, padding:'6px 0', borderTop:`1px solid ${C.border}`, fontSize:11, color:C.faint, display:'flex', alignItems:'flex-start', gap:5 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ flexShrink:0, marginTop:1 }}><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 0v3m0 15v-3m0-9h3m-15 0h3m9.36-5.64 2.12 2.12M4.52 19.48l2.12-2.12m0-11.28L4.52 4.52m15.24 14.96-2.12-2.12"/></svg>
      <span>GW: {endpoints.join(' · ')}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   DOWNLOADS SUB-TAB
   ══════════════════════════════════════════════════════════ */
function Downloads({ claimNumber }: { claimNumber: string }) {
  const docs = MOCK_DOCS[claimNumber] || MOCK_DOCS['000-00-000480']

  const statusBadge = (s: DocStatus) => {
    const map = {
      new:     { bg:'#EDFAEB', color:'#1B5E20', border:C.greenBorder, label:'New' },
      ready:   { bg:C.bluePale, color:C.navy, border:C.blueBorder, label:'Ready' },
      pending: { bg:C.amberLight, color:'#92400E', border:C.amberBorder, label:'Pending' },
    }
    const m = map[s]
    return <span style={{ fontSize:10.5, fontWeight:600, padding:'2px 8px', borderRadius:10, background:m.bg, color:m.color, border:`1px solid ${m.border}`, whiteSpace:'nowrap' }}>{m.label}</span>
  }

  const docIconColor = (type: string) => {
    const map: Record<string,{bg:string;color:string}> = {
      acknowledgement:{ bg:'#FEF3C7', color:'#92400E' },
      estimate:       { bg:C.greenLight, color:'#1B5E20' },
      coverage:       { bg:C.bluePale, color:C.navy },
      supplement:     { bg:'#F3E8FF', color:'#6D28D9' },
      rental:         { bg:'#E1F5EE', color:'#065F46' },
      settlement:     { bg:'#F1F5F9', color:C.muted },
      ale:            { bg:C.bluePale, color:C.navy },
      contractor:     { bg:'#FEF3C7', color:'#92400E' },
      payment:        { bg:C.greenLight, color:'#1B5E20' },
    }
    return map[type] || { bg:C.bg, color:C.muted }
  }

  const ready  = docs.filter(d => d.downloadable).length
  const newDoc = docs.filter(d => d.status === 'new').length
  const pend   = docs.filter(d => d.status === 'pending').length

  return (
    <div style={{ padding:16 }}>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { n:ready, l:'Available to download' },
          { n:newDoc, l:'New since last visit', highlight:newDoc>0 },
          { n:pend, l:'Pending generation' },
        ].map((s,i) => (
          <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:12, textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:700, color: s.highlight ? C.blue : C.text, lineHeight:1 }}>{s.n}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z"/></svg>
        Carrier-generated documents
      </div>

      {docs.map(doc => {
        const ic = docIconColor(doc.docType)
        return (
          <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
            border:`1px solid ${C.border}`, borderRadius:8, marginBottom:6,
            background: C.white, opacity: doc.downloadable ? 1 : 0.55,
            transition:'border-color .15s' }}>
            <div style={{ width:36, height:36, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:ic.bg, color:ic.color }}>
              <FileIcon mime={doc.mimeType} size={18}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{doc.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                {doc.source}{doc.uploadedDate ? ` · PDF · ${doc.uploadedDate}` : ''}{doc.sizeKB ? ` · ${doc.sizeKB >= 1000 ? (doc.sizeKB/1000).toFixed(1)+'MB' : doc.sizeKB+'KB'}` : ''}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {statusBadge(doc.status)}
              <button
                disabled={!doc.downloadable}
                onClick={()=>alert(`🔌 GW: GET /claim/v1/claims/${claimNumber}/documents/${doc.id}/content\n\nIn production this fetches a signed URL from GW and triggers download.`)}
                style={{ display:'flex', alignItems:'center', gap:4, fontSize:11.5, fontWeight:600, padding:'5px 10px', borderRadius:7, border:`1px solid ${C.border}`, background:C.white, color:doc.downloadable?C.blue:C.faint, cursor:doc.downloadable?'pointer':'not-allowed' }}>
                <Download size={13}/> {doc.downloadable ? 'PDF' : 'Pending'}
              </button>
            </div>
          </div>
        )
      })}
      <GWTag endpoints={[`GET /claim/v1/claims/${claimNumber}/documents`, `GET /claim/v1/claims/${claimNumber}/documents/{docId}/content`]}/>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ADJUSTER REQUESTS SUB-TAB
   ══════════════════════════════════════════════════════════ */
function AdjusterRequests({ claimNumber }: { claimNumber: string }) {
  const requests = MOCK_REQUESTS[claimNumber] || MOCK_REQUESTS['000-00-000480']

  const cardStyle = (s: ReqStatus) => ({
    urgent:  { border:`1px solid ${C.redBorder}`,   background:C.redLight },
    warning: { border:`1px solid ${C.amberBorder}`, background:C.amberLight },
    done:    { border:`1px solid ${C.greenBorder}`,  background:C.greenLight },
  }[s])

  const iconStyle = (s: ReqStatus) => ({
    urgent:  { bg:'#FCEBEB', color:'#A32D2D' },
    warning: { bg:'#FAEEDA', color:'#854F0B' },
    done:    { bg:'#EAF3DE', color:'#3B6D11' },
  }[s])

  const dueStyle = (s: ReqStatus) => ({
    urgent:  C.red,
    warning: C.amber,
    done:    C.green,
  }[s])

  const progColor = (s: ReqStatus) => ({
    urgent:  '#E24B4A',
    warning: '#EF9F27',
    done:    '#639922',
  }[s])

  const btnStyle = (s: ReqStatus) => ({
    urgent:  { background:'#A32D2D', color:'#FCEBEB' },
    warning: { background:'#854F0B', color:'#FAEEDA' },
    done:    { background:C.bg, color:C.muted, border:`1px solid ${C.border}` },
  }[s])

  return (
    <div style={{ padding:16 }}>
      <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>
        Adjuster-requested documents
      </div>

      {requests.map(req => {
        const pct = req.required > 0 ? (req.submitted / req.required) * 100 : 0
        const ic  = iconStyle(req.status)
        const cs  = cardStyle(req.status)
        return (
          <div key={req.id} style={{ ...cs, borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:6 }}>
              <div style={{ width:32, height:32, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:ic.bg, color:ic.color }}>
                {req.status === 'done' ? <CheckCircle size={16}/> : req.title.toLowerCase().includes('photo') ? <Camera size={16}/> : <FileText size={16}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{req.title}</div>
                <div style={{ fontSize:11.5, fontWeight:600, marginTop:2, color:dueStyle(req.status), display:'flex', alignItems:'center', gap:4 }}>
                  {req.status === 'urgent' && <AlertTriangle size={11}/>}
                  {req.status === 'done' ? <CheckCircle size={11}/> : <Clock size={11}/>}
                  {req.status === 'done' ? `Completed ${req.dueDate} · Accepted` : `Due ${req.dueDate} · ${req.submitted} of ${req.required} submitted`}
                  {req.status === 'urgent' && ' · Overdue'}
                </div>
              </div>
            </div>
            <div style={{ fontSize:12, color:C.mid, marginBottom:8, lineHeight:1.6 }}>{req.description}</div>

            {/* Progress bar */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ flex:1, height:3, background:C.border, borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:progColor(req.status), borderRadius:2, transition:'width .5s ease' }}/>
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:dueStyle(req.status), flexShrink:0 }}>
                {req.status === 'done' ? 'Complete' : `${req.submitted} / ${req.required}`}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {req.status !== 'done' ? (
                <>
                  <button
                    onClick={()=>alert(`🔌 GW: POST /claim/v1/claims/${claimNumber}/documents\n\nIn production this opens a file picker and uploads directly to GW ClaimCenter.`)}
                    style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', ...btnStyle(req.status) }}>
                    <Upload size={13}/> {req.status === 'warning' ? 'Re-upload' : 'Upload files'}
                  </button>
                  <span style={{ fontSize:11, color:C.faint }}>Accepts: {req.acceptedTypes.join(' · ')}</span>
                </>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:C.green, fontWeight:600 }}>
                  <CheckCircle size={13}/> Document accepted · {req.dueDate}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <GWTag endpoints={[`POST /claim/v1/claims/${claimNumber}/documents`, `GET /claim/v1/claims/${claimNumber}/documents`]}/>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MY UPLOADS SUB-TAB
   ══════════════════════════════════════════════════════════ */
function MyUploads({ claimNumber }: { claimNumber: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const uploads = MOCK_UPLOADS[claimNumber] || MOCK_UPLOADS['000-00-000480']

  const statusBadge = (s: FileStatus) => {
    const map = {
      accepted: { bg:C.greenLight, color:'#1B5E20', border:C.greenBorder, icon:<CheckCircle size={11}/>, label:'Accepted' },
      reviewing:{ bg:C.bluePale,   color:C.navy,    border:C.blueBorder,  icon:<Clock size={11}/>,        label:'Reviewing' },
      reupload: { bg:C.redLight,   color:C.red,     border:C.redBorder,   icon:<AlertCircle size={11}/>,  label:'Re-upload' },
    }
    const m = map[s]
    return (
      <span style={{ fontSize:10.5, fontWeight:600, padding:'2px 8px', borderRadius:10, background:m.bg, color:m.color, border:`1px solid ${m.border}`, display:'flex', alignItems:'center', gap:3, whiteSpace:'nowrap' }}>
        {m.icon} {m.label}
      </span>
    )
  }

  const fileIconBg = (mime: string) => {
    if (mime.startsWith('image/'))  return { bg:C.bluePale,   color:C.navy }
    if (mime.startsWith('video/'))  return { bg:'#F3E8FF',    color:'#6D28D9' }
    if (mime.includes('pdf'))       return { bg:C.redLight,   color:C.red }
    if (mime.includes('word'))      return { bg:C.bluePale,   color:C.navy }
    if (mime.includes('sheet'))     return { bg:C.greenLight, color:'#1B5E20' }
    return { bg:C.bg, color:C.muted }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    alert(`🔌 GW: POST /claim/v1/claims/${claimNumber}/documents\n\nIn production: files are base64 encoded and uploaded to GW ClaimCenter. All file types accepted.`)
  }

  const handleFileSelect = () => {
    alert(`🔌 GW: POST /claim/v1/claims/${claimNumber}/documents\n\nIn production this uploads directly to GW ClaimCenter.\n\nAccepted types: JPG, PNG, HEIC, PDF, Word, Excel, MP4, MOV, dashcam footage`)
  }

  return (
    <div style={{ padding:16 }}>
      {/* Upload zone */}
      <div
        onClick={handleFileSelect}
        onDragOver={e=>{e.preventDefault();setDragging(true)}}
        onDragLeave={()=>setDragging(false)}
        onDrop={handleDrop}
        style={{ border:`2px dashed ${dragging?C.navy:C.blueBorder}`, borderRadius:12, padding:24, textAlign:'center',
          background: dragging ? C.bluePale : C.bg, cursor:'pointer', transition:'all .2s', marginBottom:14 }}>
        <input ref={inputRef} type="file" multiple accept={ALL_TYPES} style={{ display:'none' }} onChange={handleFileSelect}/>
        <div style={{ width:44, height:44, borderRadius:'50%', background:C.bluePale, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', color:C.navy }}>
          <CloudUpload size={22}/>
        </div>
        <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4 }}>Drag files here or click to browse</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:10 }}>Photos, videos, dashcam footage, PDFs, Word, Excel — anything related to your claim</div>
        <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
          {[
            ['image','JPG / PNG / HEIC'],
            ['video','MP4 / MOV'],
            ['pdf','PDF'],
            ['word','Word (.docx)'],
            ['sheet','Excel (.xlsx)'],
            ['csv','CSV'],
            ['cam','Dashcam'],
          ].map(([type, label]) => (
            <span key={type} style={{ fontSize:11, fontWeight:500, padding:'3px 10px', borderRadius:10, background:C.white, border:`1px solid ${C.border}`, color:C.muted }}>
              {label}
            </span>
          ))}
        </div>
        <div style={{ fontSize:11, color:C.faint, marginTop:8 }}>Max 50 MB per file · All files encrypted in transit · Stored in GW ClaimCenter</div>
      </div>

      <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
        <FolderOpen size={13}/> Uploaded by you ({uploads.length} files)
      </div>

      {uploads.map(file => {
        const ic = fileIconBg(file.mimeType)
        return (
          <div key={file.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
            background:C.white, border:`1px solid ${C.border}`, borderRadius:8, marginBottom:6 }}>
            <div style={{ width:34, height:34, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:ic.bg, color:ic.color }}>
              <FileIcon mime={file.mimeType} size={17}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{file.name}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                {file.sizeKB >= 1000 ? (file.sizeKB/1000).toFixed(1)+'MB' : file.sizeKB+'KB'} · {file.uploadedDate} · {file.category}
              </div>
            </div>
            {statusBadge(file.status)}
            <button
              onClick={()=>alert(`Download: ${file.name}\n\n🔌 GW: GET /claim/v1/claims/${claimNumber}/documents/{id}/content`)}
              style={{ display:'flex', alignItems:'center', padding:'5px 8px', borderRadius:7, border:`1px solid ${C.border}`, background:C.white, color:C.blue, cursor:'pointer', marginLeft:6, flexShrink:0 }}>
              <Download size={13}/>
            </button>
          </div>
        )
      })}

      <div style={{ display:'flex', gap:8, padding:'10px 12px', background:C.bg, borderRadius:8, fontSize:12, color:C.muted, border:`1px solid ${C.border}`, marginTop:8, alignItems:'flex-start' }}>
        <Info size={15} style={{ flexShrink:0, marginTop:1 }}/>
        <span>Shoot photos in daylight · Dashcam MP4/MOV accepted · All files encrypted · Max 50 MB per file · Word & Excel accepted for contractor quotes and inventories</span>
      </div>
      <GWTag endpoints={[`POST /claim/v1/claims/${claimNumber}/documents`, `GET /claim/v1/claims/${claimNumber}/documents`]}/>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   ACTIVITY LOG SUB-TAB
   ══════════════════════════════════════════════════════════ */
function ActivityLog({ claimNumber }: { claimNumber: string }) {
  const items = MOCK_ACTIVITY[claimNumber] || MOCK_ACTIVITY['000-00-000480']

  const dotColor = (c: ActivityItem['color']) => ({
    green: C.green, blue: C.blue, amber: C.amber, red: C.red,
  }[c])

  return (
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'.06em', display:'flex', alignItems:'center', gap:5 }}>
          <History size={13}/> Document activity log
        </div>
        <button onClick={()=>alert('Export activity log as CSV')}
          style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600, padding:'5px 10px', borderRadius:7, border:`1px solid ${C.border}`, background:C.white, color:C.blue, cursor:'pointer' }}>
          <Download size={12}/> Export
        </button>
      </div>

      <div>
        {items.map((item, i) => (
          <div key={item.id} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom: i < items.length-1 ? `1px solid ${C.bg}` : 'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:14, flexShrink:0 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:dotColor(item.color), marginTop:4, flexShrink:0 }}/>
              {i < items.length-1 && <div style={{ width:1.5, flex:1, marginTop:3, background:C.border }}/>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:600, color:C.text, lineHeight:1.3 }}>{item.title}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{item.sub}</div>
            </div>
            <div style={{ fontSize:11, color:C.faint, flexShrink:0, paddingTop:2, whiteSpace:'nowrap' }}>{item.date}</div>
          </div>
        ))}
      </div>
      <GWTag endpoints={[`GET /claim/v1/claims/${claimNumber}/documents`, `GET /claim/v1/claims/${claimNumber}/notes`]}/>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN DOCUMENTS TAB
   ══════════════════════════════════════════════════════════ */
export default function DocumentsTab({ claimNumber, lobType }: Props) {
  const [sub, setSub] = useState<'downloads'|'requests'|'uploads'|'activity'>('downloads')

  const docs     = MOCK_DOCS[claimNumber]     || MOCK_DOCS['000-00-000480']
  const requests = MOCK_REQUESTS[claimNumber] || MOCK_REQUESTS['000-00-000480']
  const uploads  = MOCK_UPLOADS[claimNumber]  || MOCK_UPLOADS['000-00-000480']

  const newDocs    = docs.filter(d => d.status === 'new').length
  const urgentReqs = requests.filter(r => r.status !== 'done').length
  const totalUps   = uploads.length

  const SUBS = [
    { id:'downloads' as const, icon:<Download size={14}/>,     label:'Downloads',         count:docs.filter(d=>d.downloadable).length, countStyle:'blue' },
    { id:'requests'  as const, icon:<AlertCircle size={14}/>,  label:'Adjuster requests', count:urgentReqs, countStyle:'red'  },
    { id:'uploads'   as const, icon:<Upload size={14}/>,       label:'My uploads',        count:totalUps, countStyle:'gray' },
    { id:'activity'  as const, icon:<History size={14}/>,      label:'Activity log',      count:0, countStyle:'' },
  ]

  const countBg = (s: string) => s === 'blue' ? C.bluePale : s === 'red' ? C.redLight : C.bg
  const countColor = (s: string) => s === 'blue' ? C.navy : s === 'red' ? C.red : C.muted

  return (
    <div style={{ background:C.white, border:`1px solid ${C.border}`, borderTop:'none' }}>
      {/* Sub-nav */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, background:C.bg, padding:'0 4px' }}>
        {SUBS.map(s => (
          <button key={s.id} onClick={()=>setSub(s.id)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', fontSize:12.5, fontWeight:600,
              border:'none', background:'transparent', cursor:'pointer', transition:'color .15s',
              color: sub===s.id ? C.navy : C.muted,
              borderBottom: sub===s.id ? `2px solid ${C.navy}` : '2px solid transparent',
              marginBottom:-1 }}>
            {s.icon}
            {s.label}
            {s.count > 0 && (
              <span style={{ fontSize:10.5, fontWeight:600, padding:'1px 7px', borderRadius:10, background:countBg(s.countStyle), color:countColor(s.countStyle) }}>
                {s.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {sub === 'downloads' && <Downloads claimNumber={claimNumber}/>}
      {sub === 'requests'  && <AdjusterRequests claimNumber={claimNumber}/>}
      {sub === 'uploads'   && <MyUploads claimNumber={claimNumber}/>}
      {sub === 'activity'  && <ActivityLog claimNumber={claimNumber}/>}
    </div>
  )
}
