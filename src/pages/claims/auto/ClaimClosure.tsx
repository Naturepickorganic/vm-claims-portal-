import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar   from '@/components/layout/Navbar'
import InfoBox  from '@/components/ui/InfoBox'

export default function ClaimClosure() {
  const { id = '' } = useParams<{ id:string }>()
  const [stars, setStars] = useState(0)
  const [nps, setNps]     = useState<number|null>(null)
  const [done, setDone]   = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar crumb="Settlement & Closure" secondCrumb="Auto Insurance" />
      <div className="flex-1 px-4 py-6 md:px-10 md:py-8 max-w-[860px] mx-auto w-full">

        {/* Closure hero */}
        <div className="bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857] rounded-2xl p-6 md:p-8 mb-5 text-center relative overflow-hidden">
          <div className="w-[74px] h-[74px] rounded-full bg-white/15 border-[3px] border-white/30 flex items-center justify-center text-[33px] mx-auto mb-4">✓</div>
          <h1 className="font-display font-black text-[22px] md:text-[26px] text-white mb-2">Your Claim is Resolved</h1>
          <p className="text-[13.5px] text-white/65 max-w-[440px] mx-auto mb-6 leading-relaxed">Your 2021 Honda Accord has been repaired and returned. Settlement has been processed. Thank you for trusting us, Sarah.</p>
          <div className="flex justify-center gap-8 pt-5 border-t border-white/15">
            {[['8 Days','Resolution'],['$3,140','Amount Paid'],['$500','Subrogation Pending'],['100%','Warranty']].map(([v,l]) => (
              <div key={l}><div className="font-display font-black text-[18px] md:text-[20px] text-white">{v}</div><div className="text-[10.5px] text-white/45 mt-0.5">{l}</div></div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div className="card">
          <div className="card-title mb-4">💰 Settlement Summary</div>
          <InfoBox type="green" icon="✅">Payment of <strong>$3,140</strong> processed directly to AutoNation Collision.</InfoBox>
          {[['Full Repair Cost (Final Invoice)','$3,640.00',''],['Your Collision Deductible','− $500.00','text-red'],['Rental (6 days × $40/day)','$240.00 (covered)','text-green'],['Towing','$0.00 (roadside)','text-green']].map(([k,v,c]) => (
            <div key={k} className="flex justify-between py-2.5 border-b border-bg last:border-none">
              <span className="text-[13px] text-muted">{k}</span>
              <span className={`text-[13px] font-bold ${c||'text-navy'}`}>{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between mt-3 p-3.5 bg-green-light border border-green-mid rounded-xl">
            <div><div className="text-[13px] font-bold text-green-dark">Net Payment to AutoNation</div><div className="text-[11px] text-green mt-0.5">Repair cost less your $500 deductible</div></div>
            <div className="font-display font-black text-[22px] text-green-dark">$3,140.00</div>
          </div>
        </div>

        {/* Subrogation */}
        <div className="card">
          <div className="card-title mb-3">🔄 Subrogation Tracker</div>
          <InfoBox type="amber" icon="🔄">Our team opened a recovery file against Allstate. If successful, your <strong>$500 deductible will be refunded to you</strong> — typically within 60–90 days. No action needed.</InfoBox>
          <div className="flex gap-0 relative mt-4">
            <div className="absolute top-[17px] left-0 right-0 h-0.5 bg-border z-0" />
            {[['File Opened','done'],['Demand Sent','done'],['Awaiting Response','active'],['Negotiation',''],['$500 Refunded','']].map(([l,s]) => (
              <div key={l} className="flex-1 flex flex-col items-center gap-1.5 z-10">
                <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[14px] border-2 border-bg ${s==='done'?'bg-green text-white':s==='active'?'bg-amber text-white':'bg-border text-faint'}`}>{s==='done'?'✓':s==='active'?'⏳':'·'}</div>
                <div className={`text-[10px] font-semibold text-center leading-tight ${s==='done'?'text-green':s==='active'?'text-amber':'text-faint'}`}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div className="card">
          {done ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-green flex items-center justify-center text-[26px] text-white mx-auto mb-4">✓</div>
              <div className="font-display font-black text-[20px] text-navy mb-2">Feedback Submitted</div>
              <div className="text-[13px] text-muted">Thank you, Sarah. Your feedback helps every future customer.</div>
            </div>
          ) : (
            <>
              <div className="card-title mb-4">⭐ Rate Your Experience</div>
              <div className="flex justify-center gap-2.5 mb-1">
                {[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setStars(n)} className={`text-[28px] cursor-pointer bg-transparent border-none transition-all hover:scale-110 ${stars>=n?'opacity-100 grayscale-0':'opacity-30 grayscale'}`}>⭐</button>)}
              </div>
              <div className="text-[12px] text-muted text-center mb-5 h-4">{['','Poor','Fair','Good','Very good!','Excellent! 🌟'][stars]}</div>
              <div className="text-[12.5px] font-bold text-navy mb-2">How likely are you to recommend us? (0–10)</div>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} type="button" onClick={() => setNps(n)}
                    className={`w-[38px] h-[38px] rounded-lg font-bold text-[13px] cursor-pointer transition-all border ${nps===n?(n>=9?'bg-green border-green text-white':'bg-navy border-navy text-white'):'border-border bg-white text-slate hover:border-navy'}`}>{n}</button>
                ))}
              </div>
              <textarea className="w-full text-[12.5px] text-navy border border-border rounded-xl px-3.5 py-3 outline-none resize-y min-h-[80px] mb-4 focus:border-green transition-colors font-body" placeholder="What went well? What could we have done better?" />
              <button onClick={() => setDone(true)} className="btn btn-green w-full justify-center py-3">✓ Submit Feedback</button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-border">
          <Link to={`/claims/auto/${id}/status`} className="btn btn-ghost">← Back to Status</Link>
          <Link to="/" className="btn btn-navy">Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
