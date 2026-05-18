import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle } from 'lucide-react'
import VMlogo from '@/components/ui/VMlogo'
import { useAuth } from '@/lib/authContext'

/* ─────────────────────────────────────────────────────────────
   MOCK DATA
   🔌 Replace each field with Guidewire ClaimCenter API response
   API base: GET /api/v1/claims/{claimNumber}
   API base: GET /api/v1/policies/{policyNumber}/claims
   ───────────────────────────────────────────────────────────── */

interface ClaimInfo {
  claimNumber:   string  // 🔌 GW: claim.claimNumber
  insuredName:   string  // 🔌 GW: claim.insured.displayName
  policyNumber:  string  // 🔌 GW: claim.policy.policyNumber
  claimStatus:   string  // 🔌 GW: claim.state
  adjusterName:  string  // 🔌 GW: claim.assignedUser.displayName
  reporterName:  string  // 🔌 GW: claim.reporter.displayName
  reportedType:  string  // 🔌 GW: claim.reportedByType
  reportedDate:  string  // 🔌 GW: claim.reportedDate
}

interface Payment {
  checkNumber:       string  // 🔌 GW: payment.checkNumber
  payTo:             string  // 🔌 GW: payment.payee.displayName
  grossAmount:       number  // 🔌 GW: payment.grossAmount
  issueDate:         string  // 🔌 GW: payment.issueDate
  scheduledSendDate: string  // 🔌 GW: payment.scheduledSendDate
  status:            string  // 🔌 GW: payment.status
}

interface Contact {
  name:        string  // 🔌 GW: contact.displayName
  createdDate: string  // 🔌 GW: contact.createTime
  phone:       string  // 🔌 GW: contact.primaryPhone
  email:       string  // 🔌 GW: contact.emailAddress1
}

interface Service {
  serviceNumber:      string  // 🔌 GW: service.serviceNumber
  serviceType:        string  // 🔌 GW: service.serviceType
  expectedCompletion: string  // 🔌 GW: service.expectedCompletionDate
}

interface Note {
  adjusterName: string  // 🔌 GW: note.author.displayName
  createdDate:  string  // 🔌 GW: note.createTime
  message:      string  // 🔌 GW: note.body
}

interface PolicyClaim {
  claimNumber:  string  // 🔌 GW: claim.claimNumber
  insuredName:  string  // 🔌 GW: claim.insured.displayName
  adjusterName: string  // 🔌 GW: claim.assignedUser.displayName
  status:       string  // 🔌 GW: claim.state
  createdDate:  string  // 🔌 GW: claim.createTime
}

const MOCK_CLAIM: ClaimInfo = {
  claimNumber:  '000-00-000480',
  insuredName:  'Rosario Marinello',
  policyNumber: '7407354463',
  claimStatus:  'Open',
  adjusterName: 'Scott Henson (Property - TeamB)',
  reporterName: 'Rosario Marinello',
  reportedType: 'Self/Insured',
  reportedDate: '2024-09-15',
}

const MOCK_PAYMENTS: Payment[] = [
  { checkNumber:'',       payTo:'Rosario Marinello', grossAmount:88,  issueDate:'2025-09-02', scheduledSendDate:'',           status:'Notifying'  },
  { checkNumber:'',       payTo:'saimi kpbab',       grossAmount:100, issueDate:'',           scheduledSendDate:'2024-09-15', status:'Requesting' },
  { checkNumber:'',       payTo:'Rosario Marinello', grossAmount:500, issueDate:'2025-01-23', scheduledSendDate:'',           status:'Requesting' },
  { checkNumber:'',       payTo:'Rosario Marinello', grossAmount:77,  issueDate:'2025-09-02', scheduledSendDate:'',           status:'Requesting' },
]

const MOCK_CONTACTS: Contact[] = []

const MOCK_SERVICES: Service[] = []

const MOCK_NOTES: Note[] = [
  { adjusterName:'Super User', createdDate:'2025-09-01', message:'Test Note' },
]

// 🔌 GW: GET /api/v1/policies/{policyNumber}/claims — returns array of claims
const generatePolicyClaims = (): PolicyClaim[] => {
  const adjusters = ['Spencer Dunn','Scott Henson','Jonah Egertson','Trevor Gunderson','Lynzi Farrell']
  const names     = ['VfaMlo','CXDtpS','viSjcZa','HISJZA','JmtOhj','cBYZS','ccBUdv','blenN','ggxlCrB','HyOXAw',
                     'KmPqRt','LzWxYv','NbTsUq','OpMnKl','QrStWx','UvXyZa','BcDeFs','GhIjKl','MnOpQr','StUvWx',
                     'YzAbCd','EfGhIj','KlMnOp','QrStUv','WxYzAb']
  return Array.from({ length:25 }, (_,i) => ({
    claimNumber:  `000-00-00${6666+i}`,
    insuredName:  names[i],
    adjusterName: adjusters[i % adjusters.length],
    status:       'Open',
    createdDate:  `2025-05-${String(19 + Math.floor(i/3)).padStart(2,'0')}`,
  }))
}

const MOCK_POLICY_CLAIMS = generatePolicyClaims()

/* ─────────────────────────────────────────────────────────────
   PAGINATION COMPONENT — industry standard
   ───────────────────────────────────────────────────────────── */
const C = {
  navy:    '#1B2A3B',
  navyMid: '#1E3A5F',
  blue:    '#024099',
  border:  '#E2E8F2',
  bg:      '#F8F9FA',
  text:    '#212529',
  muted:   '#6C757D',
  white:   '#FFFFFF',
  tblHead: '#1B3A6B',
  rowAlt:  '#F0F4FF',
  link:    '#024099',
}

interface PaginationProps {
  total:       number
  page:        number
  pageSize:    number
  pageSizeOpts:number[]
  onPage:      (p:number) => void
  onPageSize:  (s:number) => void
}

function Pagination({ total, page, pageSize, pageSizeOpts, onPage, onPageSize }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const from = (page-1)*pageSize + 1
  const to   = Math.min(page*pageSize, total)

  const pages = useMemo(() => {
    if (totalPages <= 7) return Array.from({length:totalPages},(_,i)=>i+1)
    if (page <= 4) return [1,2,3,4,5,'...',totalPages]
    if (page >= totalPages-3) return [1,'...',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages]
    return [1,'...',page-1,page,page+1,'...',totalPages]
  }, [page, totalPages])

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:`1px solid ${C.border}`, flexWrap:'wrap', gap:8 }}>
      {/* Left — per page + count */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <select value={pageSize} onChange={e => { onPageSize(Number(e.target.value)); onPage(1) }}
            style={{ fontSize:13, border:`1px solid ${C.border}`, borderRadius:6, padding:'4px 8px', color:C.text, background:C.white, cursor:'pointer' }}>
            {pageSizeOpts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize:12, color:C.muted }}>per page</span>
        </div>
        <span style={{ fontSize:12, color:C.muted }}>
          Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> results
        </span>
      </div>

      {/* Right — page controls */}
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <button onClick={() => onPage(1)} disabled={page===1}
          style={{ border:`1px solid ${C.border}`, borderRadius:6, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', background:page===1?C.bg:C.white, cursor:page===1?'not-allowed':'pointer', opacity:page===1?.4:1 }}>
          <ChevronsLeft size={14} color={C.muted} />
        </button>
        <button onClick={() => onPage(page-1)} disabled={page===1}
          style={{ border:`1px solid ${C.border}`, borderRadius:6, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', background:page===1?C.bg:C.white, cursor:page===1?'not-allowed':'pointer', opacity:page===1?.4:1 }}>
          <ChevronLeft size={14} color={C.muted} />
        </button>

        {pages.map((p,i) => (
          <button key={i} onClick={() => typeof p==='number' && onPage(p)} disabled={p==='...'}
            style={{ border:`1px solid ${p===page?C.blue:C.border}`, borderRadius:6, minWidth:30, height:30, padding:'0 6px', fontSize:13, fontWeight:p===page?700:400, background:p===page?C.blue:C.white, color:p===page?C.white:p==='...'?C.muted:C.text, cursor:p==='...'?'default':'pointer' }}>
            {p}
          </button>
        ))}

        <button onClick={() => onPage(page+1)} disabled={page===totalPages}
          style={{ border:`1px solid ${C.border}`, borderRadius:6, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', background:page===totalPages?C.bg:C.white, cursor:page===totalPages?'not-allowed':'pointer', opacity:page===totalPages?.4:1 }}>
          <ChevronRight size={14} color={C.muted} />
        </button>
        <button onClick={() => onPage(totalPages)} disabled={page===totalPages}
          style={{ border:`1px solid ${C.border}`, borderRadius:6, width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', background:page===totalPages?C.bg:C.white, cursor:page===totalPages?'not-allowed':'pointer', opacity:page===totalPages?.4:1 }}>
          <ChevronsRight size={14} color={C.muted} />
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SORTABLE TABLE HEADER
   ───────────────────────────────────────────────────────────── */
function TH({ label, col, sort, onSort }: { label:string; col:string; sort:{col:string;dir:'asc'|'desc'}; onSort:(c:string)=>void }) {
  const active = sort.col === col
  return (
    <th onClick={() => onSort(col)}
      style={{ padding:'10px 14px', textAlign:'left', fontSize:13, fontWeight:600, color:C.white, whiteSpace:'nowrap', cursor:'pointer', userSelect:'none', borderRight:`1px solid rgba(255,255,255,.1)` }}>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {label}
        <span style={{ opacity: active ? 1 : 0.4 }}>
          {active && sort.dir==='asc' ? '↑' : '↓'}
        </span>
      </div>
    </th>
  )
}

/* ─────────────────────────────────────────────────────────────
   CLAIM DETAIL COMPONENT
   ───────────────────────────────────────────────────────────── */
function ClaimDetail({ claim }: { claim: ClaimInfo }) {
  const [activeTab, setActiveTab]   = useState<'info'|'payments'|'contacts'|'services'>('info')
  const [tabView, setTabView]       = useState(true)
  const [noteSearch, setNoteSearch] = useState('')
  const [paySearch, setPaySearch]   = useState('')
  const [conSearch, setConSearch]   = useState('')
  const [svcSearch, setSvcSearch]   = useState('')
  const [paySort, setPaySort]       = useState({ col:'payTo', dir:'asc' as 'asc'|'desc' })
  const [payPage, setPayPage]       = useState(1)
  const [paySize, setPaySize]       = useState(10)
  const [conPage, setConPage]       = useState(1)
  const [conSize, setConSize]       = useState(10)
  const [svcPage, setSvcPage]       = useState(1)
  const [svcSize, setSvcSize]       = useState(10)

  const tabs = [
    { id:'info'     as const, label:'Info',     icon:'ℹ️' },
    { id:'payments' as const, label:'Payments', icon:'💳' },
    { id:'contacts' as const, label:'Contacts', icon:'👤' },
    { id:'services' as const, label:'Services', icon:'⚙️' },
  ]

  const handlePaySort = (col: string) =>
    setPaySort(s => ({ col, dir: s.col===col && s.dir==='asc' ? 'desc' : 'asc' }))

  const filteredPayments = MOCK_PAYMENTS.filter(p =>
    [p.payTo, p.status, String(p.grossAmount)].some(v => v.toLowerCase().includes(paySearch.toLowerCase()))
  )

  const sortedPayments = [...filteredPayments].sort((a:any,b:any) => {
    const av = a[paySort.col] ?? '', bv = b[paySort.col] ?? ''
    return paySort.dir==='asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })

  const pagedPayments = sortedPayments.slice((payPage-1)*paySize, payPage*paySize)

  const TBL_HEAD = { background: C.tblHead }

  const InfoContent = () => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      {/* Left — claim fields */}
      <div>
        {[
          { label:'Insured Name',   value: claim.insuredName,  api:'🔌 GW: claim.insured.displayName'     },
          { label:'Policy Number',  value: claim.policyNumber, api:'🔌 GW: claim.policy.policyNumber'     },
          { label:'Claim Status',   value: claim.claimStatus,  api:'🔌 GW: claim.state'                   },
          { label:'Adjuster Name',  value: claim.adjusterName, api:'🔌 GW: claim.assignedUser.displayName'},
          { label:'Reporter Name',  value: claim.reporterName, api:'🔌 GW: claim.reporter.displayName'    },
          { label:'Reported Type',  value: claim.reportedType, api:'🔌 GW: claim.reportedByType'          },
          { label:'Reported Date',  value: claim.reportedDate, api:'🔌 GW: claim.reportedDate'            },
        ].map(f => (
          <div key={f.label} style={{ display:'grid', gridTemplateColumns:'160px 1fr', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}
            title={f.api}>
            <span style={{ fontSize:13, color:C.muted, fontWeight:500 }}>{f.label}</span>
            <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{f.value || '—'}</span>
          </div>
        ))}

        {/* Notes */}
        <div style={{ marginTop:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <span style={{ fontSize:16 }}>📝</span>
            <span style={{ fontSize:15, fontWeight:700, color:C.text }}>Notes</span>
            <span style={{ fontSize:11, color:C.muted }}>🔌 GW: GET /claim/{claim.claimNumber}/notes</span>
          </div>
          {/* Search bar */}
          <div style={{ ...TBL_HEAD, borderRadius:'8px 8px 0 0', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
            <Search size={15} color="rgba(255,255,255,.6)" />
            <input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Search..."
              style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:13, flex:1, '::placeholder':{ color:'rgba(255,255,255,.5)' } } as any} />
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${C.border}`, borderTop:'none' }}>
            <thead style={TBL_HEAD}>
              <tr>
                {['Adjuster Name','Created Date','Message'].map(h => (
                  <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:12, fontWeight:600, color:C.white, borderRight:`1px solid rgba(255,255,255,.1)` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_NOTES.filter(n => !noteSearch || n.message.toLowerCase().includes(noteSearch.toLowerCase())).map((n,i) => (
                <tr key={i} style={{ background: i%2===0 ? C.white : C.rowAlt }}>
                  <td style={{ padding:'8px 14px', fontSize:13, color:C.text }}>{n.adjusterName}</td>
                  <td style={{ padding:'8px 14px', fontSize:13, color:C.text }}>{n.createdDate}</td>
                  <td style={{ padding:'8px 14px', fontSize:13, color:C.text }}>{n.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right — Timelines (blank — API coming) */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>〜</span>
            <span style={{ fontSize:15, fontWeight:700, color:C.text }}>Timelines</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:C.muted }}>Filter by type</span>
            <select style={{ fontSize:12, border:`1px solid ${C.border}`, borderRadius:6, padding:'4px 10px', color:C.text }}>
              <option>View All</option>
            </select>
          </div>
        </div>
        <div style={{ border:`1px solid ${C.border}`, borderRadius:8, minHeight:300, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>No timeline entries found.</div>
            <div style={{ fontSize:11, color:'#A0AEC0' }}>🔌 GW: GET /claim/{claim.claimNumber}/activities</div>
          </div>
        </div>
      </div>
    </div>
  )

  const PaymentsContent = () => (
    <div>
      <div style={{ ...TBL_HEAD, borderRadius:'8px 8px 0 0', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <Search size={15} color="rgba(255,255,255,.6)" />
        <input value={paySearch} onChange={e=>{setPaySearch(e.target.value);setPayPage(1)}} placeholder="Search..."
          style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:13, flex:1 } as any} />
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${C.border}`, borderTop:'none' }}>
          <thead style={TBL_HEAD}>
            <tr>
              <TH label="Check Number"       col="checkNumber"       sort={paySort} onSort={handlePaySort} />
              <TH label="Pay To"             col="payTo"             sort={paySort} onSort={handlePaySort} />
              <TH label="Gross Amount"       col="grossAmount"       sort={paySort} onSort={handlePaySort} />
              <TH label="Issue Date"         col="issueDate"         sort={paySort} onSort={handlePaySort} />
              <TH label="Scheduled Send Date"col="scheduledSendDate" sort={paySort} onSort={handlePaySort} />
              <TH label="Status"             col="status"            sort={paySort} onSort={handlePaySort} />
            </tr>
          </thead>
          <tbody>
            {pagedPayments.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:24, textAlign:'center', color:C.muted, fontSize:13 }}>No rows found</td></tr>
            ) : pagedPayments.map((p,i) => (
              <tr key={i} style={{ background: i%2===0 ? C.white : C.rowAlt }}>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.text }}>{p.checkNumber || '—'}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.link, fontWeight:500 }}>{p.payTo}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.text }}>{p.grossAmount.toFixed(2)}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.text }}>{p.issueDate || '—'}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.text }}>{p.scheduledSendDate || '—'}</td>
                <td style={{ padding:'9px 14px', fontSize:13 }}>
                  <span style={{ background: p.status==='Notifying'?'#E3F2FD':'#FFF3E0', color: p.status==='Notifying'?'#1565C0':'#E65100', padding:'2px 10px', borderRadius:12, fontSize:12, fontWeight:600 }}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={filteredPayments.length} page={payPage} pageSize={paySize} pageSizeOpts={[10,25,50]}
        onPage={setPayPage} onPageSize={setPaySize} />
      <div style={{ fontSize:11, color:'#A0AEC0', padding:'6px 16px' }}>🔌 GW: GET /claim/{claim.claimNumber}/checks</div>
    </div>
  )

  const ContactsContent = () => (
    <div>
      <div style={{ ...TBL_HEAD, borderRadius:'8px 8px 0 0', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <Search size={15} color="rgba(255,255,255,.6)" />
        <input value={conSearch} onChange={e=>{setConSearch(e.target.value);setConPage(1)}} placeholder="Search..."
          style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:13, flex:1 } as any} />
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${C.border}`, borderTop:'none' }}>
        <thead style={TBL_HEAD}>
          <tr>
            {['Name','Created Date','Phone','Email'].map(h => (
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:13, fontWeight:600, color:C.white, borderRight:`1px solid rgba(255,255,255,.1)` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={4} style={{ padding:24, textAlign:'center', color:C.muted, fontSize:13 }}>No rows found</td></tr>
        </tbody>
      </table>
      <Pagination total={0} page={conPage} pageSize={conSize} pageSizeOpts={[10,25,50]} onPage={setConPage} onPageSize={setConSize} />
      <div style={{ fontSize:11, color:'#A0AEC0', padding:'6px 16px' }}>🔌 GW: GET /claim/{claim.claimNumber}/contacts</div>
    </div>
  )

  const ServicesContent = () => (
    <div>
      <div style={{ ...TBL_HEAD, borderRadius:'8px 8px 0 0', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <Search size={15} color="rgba(255,255,255,.6)" />
        <input value={svcSearch} onChange={e=>{setSvcSearch(e.target.value);setSvcPage(1)}} placeholder="Search..."
          style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:13, flex:1 } as any} />
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${C.border}`, borderTop:'none' }}>
        <thead style={TBL_HEAD}>
          <tr>
            {['Service Number','Service Type','Expected Completion'].map(h => (
              <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:13, fontWeight:600, color:C.white, borderRight:`1px solid rgba(255,255,255,.1)` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={3} style={{ padding:24, textAlign:'center', color:C.muted, fontSize:13 }}>No rows found</td></tr>
        </tbody>
      </table>
      <Pagination total={0} page={svcPage} pageSize={svcSize} pageSizeOpts={[10,25,50]} onPage={setSvcPage} onPageSize={setSvcSize} />
      <div style={{ fontSize:11, color:'#A0AEC0', padding:'6px 16px' }}>🔌 GW: GET /claim/{claim.claimNumber}/services</div>
    </div>
  )

  return (
    <div style={{ marginTop:24 }}>
      {/* Detail header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ fontSize:20, fontWeight:700, color:C.text }}>Claim {claim.claimNumber} Details</h2>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, color:C.muted }}>Show Tab View</span>
          <div onClick={() => setTabView(v=>!v)}
            style={{ width:44, height:24, borderRadius:12, background: tabView ? C.blue : '#CBD5E0', cursor:'pointer', position:'relative', transition:'background .2s' }}>
            <div style={{ position:'absolute', top:2, left: tabView ? 22 : 2, width:20, height:20, borderRadius:'50%', background:C.white, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      {tabView ? (
        <div style={{ border:`1px solid ${C.border}`, borderRadius:8, background:C.white }}>
          {/* Tab bar */}
          <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, padding:'0 16px' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 16px', fontSize:13, fontWeight:600, background:'transparent', border:'none', borderBottom: activeTab===t.id ? `2px solid ${C.blue}` : '2px solid transparent', color: activeTab===t.id ? C.blue : C.muted, cursor:'pointer', marginBottom:-1, transition:'color .15s' }}>
                {t.label}
              </button>
            ))}
          </div>
          {/* Tab content */}
          <div style={{ padding:20 }}>
            {activeTab==='info'     && <InfoContent />}
            {activeTab==='payments' && <PaymentsContent />}
            {activeTab==='contacts' && <ContactsContent />}
            {activeTab==='services' && <ServicesContent />}
          </div>
        </div>
      ) : (
        /* Scroll view — all tabs stacked */
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {tabs.map(t => (
            <div key={t.id} style={{ border:`1px solid ${C.border}`, borderRadius:8, background:C.white }}>
              <div style={{ padding:'12px 20px', borderBottom:`1px solid ${C.border}`, fontSize:14, fontWeight:700, color:C.text }}>
                {t.icon} {t.label}
              </div>
              <div style={{ padding:20 }}>
                {t.id==='info'     && <InfoContent />}
                {t.id==='payments' && <PaymentsContent />}
                {t.id==='contacts' && <ContactsContent />}
                {t.id==='services' && <ServicesContent />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   POLICY CLAIMS LIST
   ───────────────────────────────────────────────────────────── */
function PolicyClaimsList({ onSelect }: { onSelect:(c:PolicyClaim)=>void }) {
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState({ col:'claimNumber', dir:'asc' as 'asc'|'desc' })
  const [page, setPage]       = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [policyNum] = useState('7407354463')

  const handleSort = (col: string) =>
    setSort(s => ({ col, dir: s.col===col && s.dir==='asc' ? 'desc' : 'asc' }))

  const filtered = MOCK_POLICY_CLAIMS.filter(c =>
    [c.claimNumber,c.insuredName,c.adjusterName,c.status].some(v => v.toLowerCase().includes(search.toLowerCase()))
  )
  const sorted = [...filtered].sort((a:any,b:any) => {
    const av = a[sort.col]??'', bv = b[sort.col]??''
    return sort.dir==='asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
  })
  const paged = sorted.slice((page-1)*pageSize, page*pageSize)

  return (
    <div style={{ marginTop:24 }}>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:12 }}>
        List of claims for : {policyNum}
        <span style={{ fontSize:11, color:'#A0AEC0', marginLeft:12 }}>🔌 GW: GET /api/v1/policies/{policyNum}/claims</span>
      </h2>
      {/* Search */}
      <div style={{ background:C.tblHead, borderRadius:'8px 8px 0 0', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <Search size={15} color="rgba(255,255,255,.6)" />
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search..."
          style={{ background:'transparent', border:'none', outline:'none', color:C.white, fontSize:13, flex:1 } as any} />
      </div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', border:`1px solid ${C.border}`, borderTop:'none' }}>
          <thead style={{ background:C.tblHead }}>
            <tr>
              <TH label="Claim Number"  col="claimNumber"  sort={sort} onSort={handleSort} />
              <TH label="Insured Name"  col="insuredName"  sort={sort} onSort={handleSort} />
              <TH label="Adjuster Name" col="adjusterName" sort={sort} onSort={handleSort} />
              <TH label="Status"        col="status"       sort={sort} onSort={handleSort} />
              <TH label="Created Date"  col="createdDate"  sort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {paged.map((c,i) => (
              <tr key={i} style={{ background: i%2===0 ? C.white : C.rowAlt, cursor:'pointer' }}
                onClick={() => onSelect(c)}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background='#DBEAFE'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i%2===0 ? C.white : C.rowAlt}>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.link, fontWeight:600 }}>{c.claimNumber}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color: i%2===1?C.link:C.text, fontWeight: i%2===1?600:400 }}>{c.insuredName}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color: i%2===1?C.link:C.text, fontWeight: i%2===1?600:400 }}>{c.adjusterName}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.text }}>{c.status}</td>
                <td style={{ padding:'9px 14px', fontSize:13, color:C.text }}>{c.createdDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination total={filtered.length} page={page} pageSize={pageSize} pageSizeOpts={[10,25,50]}
        onPage={setPage} onPageSize={setPageSize} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */
export default function ClaimSearch() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const [activeSearchTab, setActiveSearchTab] = useState<'claim'|'policy'>('claim')
  const [claimInput, setClaimInput]           = useState('')
  const [policyInput, setPolicyInput]         = useState('')
  const [searched, setSearched]               = useState(false)
  const [error, setError]                     = useState('')
  const [foundClaim, setFoundClaim]           = useState<ClaimInfo|null>(null)
  const [showPolicyList, setShowPolicyList]   = useState(false)
  const [selectedPolicyClaim, setSelectedPolicyClaim] = useState<ClaimInfo|null>(null)

  const handleClaimSearch = () => {
    setError(''); setFoundClaim(null); setSearched(true)
    // 🔌 Replace with: GET /api/v1/claims/{claimInput}
    if (claimInput.trim() === '000-00-000480') {
      setFoundClaim(MOCK_CLAIM)
    } else if (claimInput.trim()) {
      setError('Claim not found. Please check the claim number and try again.')
    } else {
      setError('Please enter a claim number.')
    }
  }

  const handlePolicySearch = () => {
    setError(''); setShowPolicyList(false); setSelectedPolicyClaim(null)
    // 🔌 Replace with: GET /api/v1/policies/{policyInput}/claims
    if (policyInput.trim()) {
      setShowPolicyList(true)
    } else {
      setError('Please enter a policy number.')
    }
  }

  const handlePolicyClaimSelect = (c: PolicyClaim) => {
    // 🔌 Replace with: GET /api/v1/claims/{c.claimNumber}
    setSelectedPolicyClaim({
      claimNumber:  c.claimNumber,
      insuredName:  c.insuredName,
      policyNumber: policyInput,
      claimStatus:  c.status,
      adjusterName: c.adjusterName,
      reporterName: c.insuredName,
      reportedType: 'Self/Insured',
      reportedDate: c.createdDate,
    })
    setShowPolicyList(false)
  }

  const handleClear = () => {
    setClaimInput(''); setPolicyInput(''); setFoundClaim(null)
    setShowPolicyList(false); setSelectedPolicyClaim(null)
    setError(''); setSearched(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'"DM Sans",system-ui,sans-serif' }}>

      {/* VM Navbar */}
      <nav style={{ background:'#024099', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', boxShadow:'0 2px 10px rgba(2,64,153,.3)' }}>
        <Link to="/" style={{ textDecoration:'none' }}>
          <VMlogo size="md" variant="full-light" />
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {isAuthenticated && <span style={{ fontSize:12, color:'rgba(255,255,255,.6)' }}>{user?.name}</span>}
          <button onClick={() => { logout(); navigate('/') }}
            style={{ fontSize:12, color:'rgba(255,255,255,.55)', background:'transparent', border:'none', cursor:'pointer' }}>
            Log Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        {/* Title block */}
        <h1 style={{ fontSize:26, fontWeight:700, color:'#1B3A6B', marginBottom:6 }}>Welcome to Claim Notifications</h1>
        <p style={{ fontSize:13, color:C.muted, marginBottom:4 }}>Look up your claim or policy details and track updates in real time.</p>
        <ul style={{ paddingLeft:20, marginBottom:24 }}>
          {['Search by Claim Number or Policy Number','Access real-time updates on claim status and progress','Receive instant notifications for important changes'].map(b => (
            <li key={b} style={{ fontSize:13, color:C.muted, marginBottom:2 }}>{b}</li>
          ))}
        </ul>
        <p style={{ fontSize:13, color:C.muted, marginBottom:28 }}>Get started by entering your claim or policy number to view the latest details.</p>

        {/* Search tabs */}
        <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
          {[['claim','Search by claim number'],['policy','Search by Policy number']].map(([id,label]) => (
            <button key={id} onClick={() => { setActiveSearchTab(id as any); handleClear() }}
              style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'transparent', border:'none', borderBottom: activeSearchTab===id ? `2px solid #024099` : '2px solid transparent', color: activeSearchTab===id ? '#024099' : C.muted, cursor:'pointer', marginBottom:-1 }}>
              {label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <input
            value={activeSearchTab==='claim' ? claimInput : policyInput}
            onChange={e => activeSearchTab==='claim' ? setClaimInput(e.target.value) : setPolicyInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && (activeSearchTab==='claim' ? handleClaimSearch() : handlePolicySearch())}
            placeholder={activeSearchTab==='claim' ? 'Enter claim number' : 'Enter policy number'}
            style={{ width:200, fontSize:13, border:`1px solid ${error?'#DC2626':C.border}`, borderRadius:6, padding:'6px 10px', color:C.text, outline:'none' }}
          />
          <button onClick={activeSearchTab==='claim' ? handleClaimSearch : handlePolicySearch}
            style={{ fontSize:13, fontWeight:600, background:'#024099', color:'#fff', border:'none', borderRadius:6, padding:'7px 20px', cursor:'pointer' }}>
            Search
          </button>
          <button onClick={handleClear}
            style={{ fontSize:13, fontWeight:500, background:'#fff', color:C.muted, border:`1px solid ${C.border}`, borderRadius:6, padding:'7px 16px', cursor:'pointer' }}>
            Clear Search
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#DC2626', marginBottom:8 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Claim detail */}
        {foundClaim && <ClaimDetail claim={foundClaim} />}

        {/* Policy claims list */}
        {showPolicyList && !selectedPolicyClaim && (
          <PolicyClaimsList onSelect={handlePolicyClaimSelect} />
        )}

        {/* Selected policy claim detail */}
        {selectedPolicyClaim && (
          <div>
            <button onClick={() => { setSelectedPolicyClaim(null); setShowPolicyList(true) }}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:'#024099', background:'transparent', border:'none', cursor:'pointer', marginBottom:12, fontWeight:600 }}>
              <ChevronLeft size={16} /> Back to claims list
            </button>
            <ClaimDetail claim={selectedPolicyClaim} />
          </div>
        )}

        <div style={{ marginTop:32, textAlign:'center' }}>
          <Link to="/" style={{ fontSize:13, color:C.muted, textDecoration:'none' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
