/* ═══════════════════════════════════════════════════════════════════════
   PolicyGate.tsx  →  src/components/fnol/PolicyGate.tsx
   Phase-1 FNOL front door: verify a REAL policy before the wizard opens.
     • policy # + loss date → live PolicyCenter lookup
     • in-force check vs loss date
     • auto-fill insured / address
     • vehicle picker when the policy has >1 vehicle
   Emits a PolicyCtx that the wizard threads into display + GW create.
   ═══════════════════════════════════════════════════════════════════════ */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { lookupPolicy, getVehicles, type PolicyLookup, type PolicyVehicle } from '@/lib/api/policyApi'

export interface PolicyCtx {
  policyNumber: string
  pcId?:        string
  insured?:     string
  address?:     string
  product?:     string
  lob?:         string
  inForce?:     boolean | null
  dateOfLoss?:  string
  vehicle?:     { id: string; year: number | string; make: string; model: string; vin: string; display: string }
  reporter?:    { firstName: string; lastName: string }
}

/* Curated demo policies per LOB (from PC_Policies_Reference) — shown as a hint */
const DEMO_HINT: Record<string, string> = {
  auto: '7819142859', home: '1784278359', 'commercial-auto': '0077432930', glass: '7819142859',
}

function splitName(full?: string): { firstName: string; lastName: string } {
  if (!full) return { firstName: '', lastName: '' }
  const p = full.trim().split(/\s+/)
  if (p.length === 1) return { firstName: p[0], lastName: '' }
  return { firstName: p.slice(0, -1).join(' '), lastName: p[p.length - 1] }
}

export default function PolicyGate({ lob, onReady }: { lob: string; onReady: (ctx: PolicyCtx) => void }) {
  const navigate = useNavigate()
  const [policyNumber, setPolicyNumber] = useState('')
  const [dateOfLoss,   setDateOfLoss]   = useState('2025-04-22') // inside the A Welch demo term
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [policy,       setPolicy]       = useState<PolicyLookup | null>(null)
  const [vehicles,     setVehicles]     = useState<PolicyVehicle[]>([])
  const [selVehicle,   setSelVehicle]   = useState<PolicyVehicle | null>(null)

  const doLookup = async () => {
    setError(''); setPolicy(null); setVehicles([]); setSelVehicle(null)
    const num = policyNumber.trim()
    if (!num) { setError('Enter a policy number to continue.'); return }
    setLoading(true)
    try {
      const p = await lookupPolicy(num, dateOfLoss)
      if (!p.found) { setError(p.message || `Policy ${num} was not found in PolicyCenter.`); setLoading(false); return }
      setPolicy(p)
      if (p.pcId) {
        const v = await getVehicles(p.pcId)
        const list = v.vehicles || []
        setVehicles(list)
        if (list.length === 1) setSelVehicle(list[0])
      }
    } catch {
      setError('Could not reach the proxy. Make sure node server.js is running on :3001 and you are on VPN.')
    }
    setLoading(false)
  }

  const canContinue = !!policy?.found && (vehicles.length === 0 || !!selVehicle)

  const handleContinue = () => {
    if (!policy) return
    onReady({
      policyNumber: policy.policyNumber,
      pcId:         policy.pcId,
      insured:      policy.insured,
      address:      policy.address,
      product:      policy.product,
      lob:          policy.lob || lob,
      inForce:      policy.inForce,
      dateOfLoss,
      vehicle:      selVehicle ? {
        id: selVehicle.id, year: selVehicle.year, make: selVehicle.make,
        model: selVehicle.model, vin: selVehicle.vin, display: selVehicle.display,
      } : undefined,
      reporter:     splitName(policy.insured),
    })
  }

  const fieldLabel = lob === 'home' ? 'Home Insurance' : lob === 'commercial-auto' ? 'Commercial Auto' : 'Auto Insurance'

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar crumb="File a Claim" secondCrumb={fieldLabel} />

      <main className="flex-1 flex items-start justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-[560px]">
          <h1 className="text-2xl font-bold text-navy">Verify your policy</h1>
          <p className="text-[13px] text-muted mt-1.5">
            Enter your policy number and the date of loss. We'll pull your coverage straight from PolicyCenter.
          </p>

          {/* Lookup form */}
          <div className="bg-white border border-border rounded-2xl p-5 mt-5 shadow-sm">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate mb-1.5">Policy Number</label>
            <input
              value={policyNumber}
              onChange={e => setPolicyNumber(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doLookup() }}
              placeholder={`e.g. ${DEMO_HINT[lob] || DEMO_HINT.auto}`}
              className="w-full border border-border rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-navy/30"
            />

            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate mb-1.5 mt-4">Date of Loss</label>
            <input
              type="date"
              value={dateOfLoss}
              onChange={e => setDateOfLoss(e.target.value)}
              className="w-full border border-border rounded-lg px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-navy/30"
            />

            <button
              type="button"
              onClick={doLookup}
              disabled={loading}
              className="btn btn-primary w-full mt-4 py-2.5"
            >
              {loading ? 'Verifying…' : 'Verify Policy →'}
            </button>

            {error && (
              <div className="mt-3 text-[12.5px] text-red bg-red/8 border border-red/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Resolved policy */}
          {policy?.found && (
            <div className="bg-white border border-border rounded-2xl p-5 mt-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[15px] font-bold text-navy">{policy.insured || 'Insured'}</div>
                  <div className="text-[12px] text-muted mt-px">Policy #{policy.policyNumber} · {policy.product}</div>
                  {policy.address && <div className="text-[12px] text-muted mt-0.5">{policy.address}</div>}
                </div>
                {policy.inForce === false ? (
                  <span className="shrink-0 inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-700 text-[10.5px] font-bold px-2.5 py-1 rounded-full">
                    ⚠ Outside policy term
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 bg-green/15 border border-green/35 text-green-700 text-[10.5px] font-bold px-2.5 py-1 rounded-full">
                    ✓ In force
                  </span>
                )}
              </div>
              {(policy.periodStart || policy.periodEnd) && (
                <div className="text-[11px] text-faint mt-2">
                  Term: {policy.periodStart ? new Date(policy.periodStart).toLocaleDateString() : '—'} → {policy.periodEnd ? new Date(policy.periodEnd).toLocaleDateString() : '—'}
                </div>
              )}
              {policy.inForce === false && (
                <div className="mt-3 text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  The selected date of loss falls outside this policy's term. Confirm the date — coverage may not apply.
                </div>
              )}

              {/* Vehicle picker */}
              {lob !== 'home' && (
                <div className="mt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate mb-2">
                    {vehicles.length > 1 ? 'Select the vehicle involved' : 'Vehicle on policy'}
                  </div>
                  {vehicles.length === 0 ? (
                    <div className="text-[12.5px] text-muted">No vehicles returned for this policy.</div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {vehicles.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelVehicle(v)}
                          className={
                            'text-left border rounded-xl px-3.5 py-3 transition ' +
                            (selVehicle?.id === v.id
                              ? 'border-navy ring-2 ring-navy/20 bg-navy/5'
                              : 'border-border hover:border-navy/40')
                          }
                        >
                          <div className="text-[13.5px] font-semibold text-navy">{v.display}</div>
                          <div className="text-[11px] text-muted mt-px">
                            VIN {v.vin || '—'}{v.bodyType ? ` · ${v.bodyType}` : ''}{v.state ? ` · ${v.state}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-5">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>← Cancel</button>
            <button
              type="button"
              className="btn btn-green px-7 py-3 text-[13.5px]"
              disabled={!canContinue}
              onClick={handleContinue}
            >
              Continue to claim →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
