import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/authContext'
import VMlogo from '@/components/ui/VMlogo'

export default function TrackClaim() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [claimNum, setClaimNum] = useState('')
  const [zip, setZip]           = useState('')

  const handleTrack = () => {
    if (claimNum.trim()) navigate(`/claims/search?claim=${claimNum}`)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F8FF', fontFamily:'"DM Sans",system-ui,sans-serif', display:'flex', flexDirection:'column' }}>

      {/* NAV */}
      <nav style={{ background:'#024099', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', boxShadow:'0 2px 20px rgba(2,64,153,.3)' }}>
        <Link to="/" style={{ textDecoration:'none' }}>
          <VMlogo size="md" variant="full-light" />
        </Link>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          {isAuthenticated
            ? <>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.6)' }}>{user?.name}</span>
                <button onClick={() => { logout(); navigate('/') }}
                  style={{ fontSize:13, color:'rgba(255,255,255,.5)', background:'transparent', border:'none', cursor:'pointer' }}>
                  Log Out
                </button>
              </>
            : <Link to="/login" style={{ fontSize:13, fontWeight:600, color:'#fff', border:'1px solid rgba(255,255,255,.3)', padding:'6px 16px', borderRadius:8, textDecoration:'none' }}>
                Log In
              </Link>
          }
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background:'linear-gradient(135deg, #024099 0%, #02306B 55%, #013080 100%)', padding:'40px 32px', textAlign:'center' }}>
        <h1 style={{ fontSize:30, fontWeight:800, color:'#fff', marginBottom:10 }}>Track Your Claim</h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.65)', maxWidth:460, margin:'0 auto' }}>
          {isAuthenticated ? `Welcome back, ${user?.name?.split(' ')[0]}. View your claims below or enter a claim number.` : 'Enter your claim number and ZIP code on your policy.'}
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ flex:1, padding:'40px 24px', maxWidth:900, margin:'0 auto', width:'100%' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

          {/* Track by claim number */}
          <div style={{ background:'#fff', border:'1px solid #E2E8F2', borderRadius:16, padding:28, boxShadow:'0 1px 4px rgba(2,64,153,.06),0 4px 16px rgba(2,64,153,.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>🔍</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#1A2744' }}>Track by Claim Number</span>
            </div>
            <p style={{ fontSize:13, color:'#718096', marginBottom:16 }}>Enter your claim number and the ZIP code on your policy.</p>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#4A5568', display:'block', marginBottom:4 }}>
                Claim Number <span style={{ color:'#DC2626' }}>*</span>
              </label>
              <input value={claimNum} onChange={e=>setClaimNum(e.target.value)}
                placeholder="e.g. CLM-2025-AUTO-04821"
                style={{ width:'100%', fontSize:13, border:'1px solid #E2E8F2', borderRadius:8, padding:'9px 12px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'#4A5568', display:'block', marginBottom:4 }}>
                ZIP Code <span style={{ color:'#DC2626' }}>*</span>
              </label>
              <input value={zip} onChange={e=>setZip(e.target.value)}
                placeholder="75209"
                style={{ width:'100%', fontSize:13, border:'1px solid #E2E8F2', borderRadius:8, padding:'9px 12px', outline:'none', boxSizing:'border-box' }} />
            </div>
            <button onClick={handleTrack}
              style={{ width:'100%', background:'#024099', color:'#fff', fontSize:14, fontWeight:700, padding:'11px 0', borderRadius:10, border:'none', cursor:'pointer' }}>
              Track My Claim →
            </button>
          </div>

          {/* Active claims */}
          <div style={{ background:'#fff', border:'1px solid #E2E8F2', borderRadius:16, padding:28, boxShadow:'0 1px 4px rgba(2,64,153,.06),0 4px 16px rgba(2,64,153,.08)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, width:'100%' }}>
              <span style={{ fontSize:16 }}>📋</span>
              <span style={{ fontSize:16, fontWeight:700, color:'#1A2744' }}>Your Active Claims</span>
            </div>
            <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:14, fontWeight:600, color:'#4A5568', marginBottom:4 }}>No active claims found</div>
            <div style={{ fontSize:12, color:'#718096', marginBottom:20 }}>Claims you file will appear here automatically.</div>
            <button onClick={() => navigate('/claims/search')}
              style={{ background:'#024099', color:'#fff', fontSize:13, fontWeight:700, padding:'10px 24px', borderRadius:10, border:'none', cursor:'pointer' }}>
              Search Claims →
            </button>
          </div>
        </div>

        <div style={{ textAlign:'center', marginTop:28 }}>
          <Link to="/" style={{ fontSize:13, color:'#718096', textDecoration:'none' }}>← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
