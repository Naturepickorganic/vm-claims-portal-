import { clsx } from 'clsx'
import {
  getStateRules,
  detectStateFromLocation,
  negligenceLabel,
  dvLabel,
  type StateRule,
} from '@/lib/stateRules'

interface StateRulesPanelProps {
  location:    string
  repairType?: 'chip' | 'replacement'
}

const NEGLIGENCE_COLORS: Record<string, string> = {
  'pure-comparative': 'bg-blue-light text-blue border border-blue-mid',
  'modified-51':      'bg-amber-light text-amber border border-[#FDE68A]',
  'modified-50':      'bg-amber-light text-amber border border-[#FDE68A]',
  'contributory':     'bg-red-light text-red border border-red-mid',
}

const DV_COLORS: Record<string, string> = {
  strong:  'bg-[#EEEDFE] text-[#3C3489] border border-[#AFA9EC]',
  allowed: 'bg-blue-light text-blue border border-blue-mid',
  limited: 'bg-amber-light text-amber border border-[#FDE68A]',
  none:    'bg-bg text-faint border border-border',
}

export default function StateRulesPanel({ location, repairType }: StateRulesPanelProps) {
  const stateCode = detectStateFromLocation(location)
  if (!stateCode) return null

  const rule = getStateRules(stateCode)
  if (!rule) return null

  const isNofault     = rule.pip.type !== 'none'
  const isContrib     = rule.negligence === 'contributory'
  const isStrongDV    = rule.diminishedValue === 'strong'
  const glassWaived   = rule.glassDeductible === 'waived-all' ||
                        (rule.glassDeductible === 'waived-chip' && repairType === 'chip')

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {rule.code}
        </div>
        <div className="text-[13px] font-bold text-navy">
          {rule.name} — State rules detected
        </div>
        <span className="text-[10px] text-faint border border-border px-2 py-px rounded-full ml-auto">
          #{rule.rank} by DPW
        </span>
      </div>

      {/* Key alerts — always shown first */}
      {rule.keyAlerts.map((alert, i) => (
        <div key={i} className={clsx('flex gap-2.5 p-3 rounded-xl mb-2 text-[12px] leading-relaxed',
          alert.includes('WAIVED') ? 'bg-green-light border border-green-mid text-[#064E3B]' :
          alert.includes('NO-FAULT') || alert.includes('PIP') ? 'bg-red-light border border-red-mid text-[#7F1D1D]' :
          alert.includes('CONTRIBUTORY') ? 'bg-red-light border border-red-mid text-[#7F1D1D]' :
          alert.includes('DV') || alert.includes('diminished') ? 'bg-[#EEEDFE] border border-[#AFA9EC] text-[#26215C]' :
          'bg-amber-light border border-[#FDE68A] text-[#92400E]'
        )}>
          <span className="flex-shrink-0 mt-px">
            {alert.includes('WAIVED') ? '✓' :
             alert.includes('NO-FAULT') || alert.includes('PIP') ? '⚡' :
             alert.includes('CONTRIBUTORY') ? '⚠️' : 'ℹ️'}
          </span>
          <span>{alert}</span>
        </div>
      ))}

      {/* Rule cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">

        {/* Negligence */}
        <div className="border border-border rounded-xl p-3 bg-white">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-faint mb-1.5">Negligence standard</div>
          <div className={clsx('inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full mb-1.5', NEGLIGENCE_COLORS[rule.negligence])}>
            {isContrib ? 'Contributory — strict' : rule.negligence.replace('-', ' ')}
          </div>
          <div className="text-[11.5px] text-muted leading-relaxed">
            {rule.negligence === 'pure-comparative'  && 'Claimant can recover even if 99% at fault — award reduced by fault %.'}
            {rule.negligence === 'modified-51'        && 'Claimant barred if 51% or more at fault. Document all fault percentages.'}
            {rule.negligence === 'modified-50'        && 'Claimant barred if exactly 50% or more at fault.'}
            {rule.negligence === 'contributory'       && 'Any claimant fault (even 1%) bars ALL recovery. Thorough fault investigation required.'}
          </div>
        </div>

        {/* PIP / No-fault */}
        <div className={clsx('border rounded-xl p-3', isNofault ? 'border-red-mid bg-red-light' : 'border-border bg-white')}>
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-faint mb-1.5">PIP / No-fault</div>
          {isNofault ? (
            <>
              <div className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-red text-white inline-flex mb-1.5">
                {rule.pip.type === 'choice' ? 'Choice no-fault' : 'Mandatory no-fault'}
                {rule.pip.limit ? ` — $${rule.pip.limit.toLocaleString()}` : ' — verify tier'}
              </div>
              <div className="text-[11.5px] text-[#7F1D1D] leading-relaxed">{rule.pip.specialRules}</div>
              {rule.pip.treatmentWindow && (
                <div className="mt-1.5 text-[11px] font-bold text-red">
                  Treatment window: {rule.pip.treatmentWindow} days from accident
                </div>
              )}
            </>
          ) : (
            <>
              <div className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-bg border border-border text-faint inline-flex mb-1.5">
                Traditional tort state
              </div>
              <div className="text-[11.5px] text-muted">No PIP requirement. Standard liability and UM/UIM apply.</div>
            </>
          )}
        </div>

        {/* Diminished Value */}
        <div className="border border-border rounded-xl p-3 bg-white">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-faint mb-1.5">Diminished value</div>
          <div className={clsx('inline-flex text-[10.5px] font-bold px-2 py-0.5 rounded-full mb-1.5', DV_COLORS[rule.diminishedValue])}>
            {dvLabel(rule.diminishedValue)}
          </div>
          <div className="text-[11.5px] text-muted leading-relaxed">{rule.dvNotes}</div>
        </div>

        {/* Statutory clock */}
        <div className="border border-border rounded-xl p-3 bg-white">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-faint mb-1.5">Statutory clocks</div>
          <div className="flex flex-col gap-1">
            {[
              { label:'Acknowledge', days:rule.clock.acknowledgeDays },
              { label:'Accept / deny', days:rule.clock.investigateDays },
              { label:'Pay after agreement', days:rule.clock.payDays },
            ].map(c => (
              <div key={c.label} className="flex items-center justify-between">
                <span className="text-[11.5px] text-muted">{c.label}</span>
                <span className={clsx('text-[11px] font-bold px-2 py-px rounded-full',
                  c.days <= 10 ? 'bg-red-light text-red' : c.days <= 15 ? 'bg-amber-light text-amber' : 'bg-green-light text-green')}>
                  {c.days} days
                </span>
              </div>
            ))}
          </div>
          <div className="text-[10.5px] text-faint mt-2">{rule.clock.statute}</div>
        </div>
      </div>

      {/* Glass deductible — only shown if glassWaived */}
      {glassWaived && (
        <div className="flex gap-2.5 p-3 rounded-xl mt-2 bg-green-light border border-green-mid text-[12px] text-[#064E3B] leading-relaxed">
          <span>✓</span>
          <span>{rule.glassNote}</span>
        </div>
      )}

      {/* Anti-steering */}
      <div className="flex gap-2.5 p-3 rounded-xl mt-2 bg-blue-light border border-blue-mid text-[12px] text-[#1E3A8A] leading-relaxed">
        <span className="flex-shrink-0">⚖️</span>
        <span><strong>Anti-steering:</strong> {rule.antiSteering}</span>
      </div>
    </div>
  )
}
