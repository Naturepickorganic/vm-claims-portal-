/* ─────────────────────────────────────────────────────────────────
   State Rules Engine — Top 20 States by Direct Premiums Written
   Sources: NAIC, state insurance codes, FACA regulations
   ───────────────────────────────────────────────────────────────── */

export type NegligenceStandard =
  | 'pure-comparative'        // CA, FL, NY, WA, AZ — recover even if 99% at fault
  | 'modified-51'             // TX, PA, IL, OH, MA, IN, MN — barred at 51%+
  | 'modified-50'             // NJ, GA, CO, TN — barred at 50%+
  | 'contributory'            // NC, VA, MD — barred at ANY fault

export type PIPType =
  | 'none'
  | 'no-fault'      // FL, MI, NJ, NY, MA, MN, PA (choice), KY (choice)
  | 'choice'        // PA, NJ — policyholder selects tort vs no-fault

export interface PIPRules {
  type:          PIPType
  limit:         number | null          // USD
  mandatory:     boolean
  treatmentWindow?: number             // days to seek treatment
  specialRules?: string
}

export interface StatutoryClock {
  acknowledgeDays:  number             // days to acknowledge claim
  investigateDays:  number             // days to accept or deny
  payDays:          number             // days to pay once agreed
  statute:          string             // cite
}

export interface StateRule {
  code:              string            // 2-letter abbrev
  name:              string
  rank:              number            // DPW rank 1-20
  negligence:        NegligenceStandard
  pip:               PIPRules
  diminishedValue:   'strong' | 'allowed' | 'limited' | 'none'
  dvNotes:           string
  glassDeductible:   'waived-chip' | 'full' | 'waived-all'
  glassNote:         string
  antiSteering:      string            // cite or note
  clock:             StatutoryClock
  keyAlerts:         string[]          // shown as banner in FNOL
}

export const STATE_RULES: Record<string, StateRule> = {

  CA: {
    code:'CA', name:'California', rank:1,
    negligence: 'pure-comparative',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV claims allowed against at-fault third party. CA courts apply a 17c formula for first-party DV.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies to all glass repairs in CA.',
    antiSteering: 'Cal. Ins. Code § 758.5 — insurer cannot require use of specific shop.',
    clock: { acknowledgeDays:15, investigateDays:40, payDays:30, statute:'Cal. Ins. Code § 790.03' },
    keyAlerts: ['Pure comparative negligence applies — document all party fault percentages.','15-day acknowledgment window begins today.'],
  },

  TX: {
    code:'TX', name:'Texas', rank:2,
    negligence: 'modified-51',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV recoverable from at-fault third party. Texas uses market value approach. First-party DV from own insurer is limited.',
    glassDeductible: 'waived-chip',
    glassNote: 'Texas waives the deductible for windshield chip repair under Tex. Ins. Code § 1952.061. Full replacement is subject to deductible.',
    antiSteering: 'Tex. Ins. Code § 1952.301 — cannot require insured to use specific repair shop.',
    clock: { acknowledgeDays:15, investigateDays:15, payDays:5, statute:'Tex. Ins. Code § 542.055–542.058' },
    keyAlerts: ['Chip repair deductible WAIVED under Tex. Ins. Code § 1952.061.','Texas has strict 15-business-day clock for acceptance/denial — track carefully.','Modified comparative: claimant barred if 51% or more at fault.'],
  },

  FL: {
    code:'FL', name:'Florida', rank:3,
    negligence: 'pure-comparative',
    pip: { type:'no-fault', limit:10000, mandatory:true, treatmentWindow:14, specialRules:'80% of medical expenses, 60% of lost wages. Emergency medical condition (EMC) required for full $10K. Non-EMC capped at $2,500.' },
    diminishedValue: 'allowed',
    dvNotes: 'DV allowed against at-fault third party under Fla. Stat. § 626.9641. Geczy formula commonly used. First-party DV from own insurer not recognized.',
    glassDeductible: 'waived-all',
    glassNote: 'Florida law (Fla. Stat. § 627.7288) prohibits deductibles for glass replacement — full coverage with no out-of-pocket cost.',
    antiSteering: 'Fla. Stat. § 626.9641(1)(i) — insured has right to select their own repair shop.',
    clock: { acknowledgeDays:14, investigateDays:90, payDays:20, statute:'Fla. Stat. § 627.70131' },
    keyAlerts: ['FLORIDA NO-FAULT: PIP ($10,000) triggered automatically. Initiate PIP documentation now.','Insured must seek medical treatment within 14 days or PIP benefits are forfeited.','Glass deductible FULLY WAIVED — Fla. Stat. § 627.7288.','Pure comparative: document all fault percentages carefully.'],
  },

  NY: {
    code:'NY', name:'New York', rank:4,
    negligence: 'pure-comparative',
    pip: { type:'no-fault', limit:50000, mandatory:true, treatmentWindow:30, specialRules:'Basic Economic Loss (BEL) up to $50K. Covers medical, lost wages (80% up to $2,000/mo), and other expenses. Supplementary Uninsured Motorist (SUM) often required.' },
    diminishedValue: 'limited',
    dvNotes: 'DV against at-fault third party allowed but courts are inconsistent. First-party DV not recognized in NY.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies unless policyholder has zero-deductible glass endorsement.',
    antiSteering: 'NY Ins. Law § 2610 — insurer cannot require use of specific repair shop. Must inform insured of right to choose.',
    clock: { acknowledgeDays:15, investigateDays:30, payDays:30, statute:'NY Ins. Law § 2601; 11 NYCRR 216' },
    keyAlerts: ['NEW YORK NO-FAULT: $50K PIP triggered. File NF-2 form with insured within 30 days.','Insured must file NF-2 (no-fault application) within 30 days of accident.','SUM coverage — verify if insured has Supplementary Uninsured Motorist endorsement.'],
  },

  PA: {
    code:'PA', name:'Pennsylvania', rank:5,
    negligence: 'modified-51',
    pip: { type:'choice', limit:5000, mandatory:false, specialRules:'PA is a CHOICE no-fault state. Policyholder selects "limited tort" (no-fault, $5K PIP default) or "full tort" (traditional). MUST verify selection before processing injury claims.' },
    diminishedValue: 'allowed',
    dvNotes: 'DV allowed from at-fault third party. First-party DV claims against own insurer limited by policy language.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies. Some PA policies include zero-deductible glass endorsement — verify.',
    antiSteering: '31 Pa. Code § 62.3 — insurer must inform insured of right to select repair facility.',
    clock: { acknowledgeDays:10, investigateDays:15, payDays:30, statute:'31 Pa. Code § 146.5–146.7' },
    keyAlerts: ['PENNSYLVANIA CHOICE NO-FAULT: Verify whether insured elected LIMITED TORT or FULL TORT before processing injury claims.','Limited tort limits right to sue for pain and suffering except for serious injury.'],
  },

  IL: {
    code:'IL', name:'Illinois', rank:6,
    negligence: 'modified-51',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV recoverable from at-fault third party in Illinois. No specific formula mandated — market-based approach.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies.',
    antiSteering: '215 ILCS 5/143.29 — insurer cannot require use of specific repair facility.',
    clock: { acknowledgeDays:15, investigateDays:30, payDays:30, statute:'215 ILCS 5/154.6; Ill. Admin. Code § 919.70' },
    keyAlerts: ['Modified comparative (51% bar): claimant barred if 51%+ at fault.','Document repair estimates carefully — IL requires itemized written estimates.'],
  },

  OH: {
    code:'OH', name:'Ohio', rank:7,
    negligence: 'modified-51',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV claims allowed in Ohio against at-fault third party. Ohio courts recognize both "inherent" and "repair-related" DV.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies in Ohio.',
    antiSteering: 'Ohio Adm. Code 3901-1-54(H) — insurer must disclose right to choose repair facility.',
    clock: { acknowledgeDays:15, investigateDays:21, payDays:10, statute:'Ohio Rev. Code § 3901.38; Ohio Adm. Code 3901-1-54' },
    keyAlerts: ['Ohio requires itemized repair estimates. Direct repair program participation must be voluntary.'],
  },

  NJ: {
    code:'NJ', name:'New Jersey', rank:8,
    negligence: 'modified-50',
    pip: { type:'choice', limit:15000, mandatory:true, treatmentWindow:null, specialRules:'NJ is a CHOICE no-fault state with mandatory PIP. Basic Policy: $15K PIP default. Standard Policy: up to $250K. "Lawsuit Threshold" chosen by policyholder — Verbal (limited tort) or Dollar ($3,600 medical expenses). CRITICAL: verify threshold selection.' },
    diminishedValue: 'limited',
    dvNotes: 'DV limited in NJ. Third-party DV claims possible but courts apply strict scrutiny. First-party DV generally not recognized.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies. Check if zero-deductible glass endorsement is on policy.',
    antiSteering: 'N.J.A.C. 11:3-10.3 — insurer cannot unreasonably require specific repair facility.',
    clock: { acknowledgeDays:10, investigateDays:30, payDays:30, statute:'N.J.A.C. 11:2-17.7' },
    keyAlerts: ['NEW JERSEY CHOICE NO-FAULT: Verify policyholder tort threshold (Verbal / Dollar) before processing injury claims.','PIP is MANDATORY in NJ regardless of tort election — initiate PIP documentation.','Modified comparative (50% bar): barred at exactly 50% fault.'],
  },

  GA: {
    code:'GA', name:'Georgia', rank:9,
    negligence: 'modified-50',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'strong',
    dvNotes: 'Georgia is the STRONGEST DV state. O.C.G.A. § 33-34-6 explicitly recognizes DV. Third-party DV is routinely claimed and awarded. First-party DV may also be available depending on policy. Always initiate DV assessment for repaired vehicles.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies in Georgia.',
    antiSteering: 'O.C.G.A. § 33-34-6 — insurer must not unreasonably restrict repair facility choice.',
    clock: { acknowledgeDays:15, investigateDays:30, payDays:30, statute:'O.C.G.A. § 33-6-34; Ga. Comp. R. & Regs. 120-2-52' },
    keyAlerts: ['GEORGIA — STRONGEST DV STATE: Always initiate diminished value assessment for any repaired vehicle under O.C.G.A. § 33-34-6.','Offer DV supplement proactively — failure to do so is a common bad faith exposure in GA.','Modified comparative (50% bar).'],
  },

  MI: {
    code:'MI', name:'Michigan', rank:10,
    negligence: 'modified-51',
    pip: { type:'no-fault', limit:null, mandatory:true, specialRules:'Michigan post-2020 REFORM has 6 PIP tiers: (1) Unlimited medical, (2) $500K, (3) $250K, (4) $50K (Medicaid eligible), (5) Coordinated with employer health, (6) Opt-out (Medicare eligible). MUST verify tier from policy declarations before any medical bill payment. Attendant care, replacement services, and work loss covered under applicable tier.' },
    diminishedValue: 'limited',
    dvNotes: 'DV against at-fault third party allowed but limited by Michigan tort threshold. First-party DV not recoverable from own insurer.',
    glassDeductible: 'full',
    glassNote: 'Michigan comprehensive deductible applies. Check for zero-deductible glass endorsement.',
    antiSteering: 'MCL 500.3030 — insured has right to select repair facility.',
    clock: { acknowledgeDays:30, investigateDays:30, payDays:30, statute:'MCL 500.3142 (PIP 30-day payment); MCL 500.2006' },
    keyAlerts: ['MICHIGAN — MOST COMPLEX PIP: IMMEDIATELY verify the insured\'s PIP tier from the policy declarations page (6 tiers post-2020 reform).','Unlimited tier: no cap on medical expenses. $50K tier: Medicaid must be primary.','Work loss: 85% of gross income up to $6,065/month (2024 indexed amount).','PIP must be paid within 30 days of reasonable proof of loss.'],
  },

  NC: {
    code:'NC', name:'North Carolina', rank:11,
    negligence: 'contributory',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'none',
    dvNotes: 'North Carolina does not recognize DV claims — neither first-party nor third-party. Courts have consistently rejected DV as a measure of damages.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies.',
    antiSteering: 'NC Gen. Stat. § 58-36-85 — insurer cannot require use of specific repair facility.',
    clock: { acknowledgeDays:10, investigateDays:30, payDays:10, statute:'NC Gen. Stat. § 58-63-15' },
    keyAlerts: ['NORTH CAROLINA — CONTRIBUTORY NEGLIGENCE: If claimant is even 1% at fault, they recover NOTHING from the other party. Document all fault carefully.','DV claims are NOT recognized in NC — do not offer or promise DV supplements.'],
  },

  VA: {
    code:'VA', name:'Virginia', rank:12,
    negligence: 'contributory',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV allowed in Virginia against at-fault third party despite contributory negligence rule. Progressive v. Lloyd established DV as recoverable.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies.',
    antiSteering: 'Va. Code § 38.2-510 — insurer cannot require use of specific repair facility.',
    clock: { acknowledgeDays:15, investigateDays:45, payDays:30, statute:'14 VAC 5-400-60' },
    keyAlerts: ['VIRGINIA — CONTRIBUTORY NEGLIGENCE: If claimant is even 1% at fault, they recover NOTHING. Document fault allocation with extreme care.','Note: VA allows DV despite contributory negligence rule — unusual combination.'],
  },

  WA: {
    code:'WA', name:'Washington', rank:13,
    negligence: 'pure-comparative',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV recoverable in Washington against at-fault third party. Washington courts apply market value diminution approach.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies. Chip repair waiver not mandated but some carriers waive voluntarily.',
    antiSteering: 'WAC 284-30-391 — insured has right to use repair facility of their choice.',
    clock: { acknowledgeDays:10, investigateDays:30, payDays:15, statute:'WAC 284-30-330 through 284-30-410' },
    keyAlerts: ['Pure comparative negligence — document all party fault percentages.','Washington has detailed unfair claims settlement practices regulations — WAC 284-30.'],
  },

  MA: {
    code:'MA', name:'Massachusetts', rank:14,
    negligence: 'modified-51',
    pip: { type:'no-fault', limit:8000, mandatory:true, specialRules:'Massachusetts PIP covers 80% of medical expenses and 75% of lost wages up to $8,000. PIP is primary regardless of health insurance. Claimant must exhaust PIP before accessing liability coverage for medical expenses.' },
    diminishedValue: 'limited',
    dvNotes: 'DV allowed in Massachusetts against at-fault third party. First-party DV limited by policy language. Courts use market value approach.',
    glassDeductible: 'waived-all',
    glassNote: 'Massachusetts law (211 CMR 113.00) waives the deductible for all glass repairs — chip and replacement both covered at no cost to insured.',
    antiSteering: '211 CMR 133.05 — insurer must inform claimant of right to select repair shop of their choice.',
    clock: { acknowledgeDays:7, investigateDays:30, payDays:30, statute:'211 CMR 123.00; M.G.L. c. 176D § 3' },
    keyAlerts: ['MASSACHUSETTS NO-FAULT: $8,000 PIP triggered. PIP is PRIMARY — must be applied before liability for medical expenses.','Glass deductible FULLY WAIVED in Massachusetts — 211 CMR 113.00.','MA has strict unfair claims settlement practices law M.G.L. c. 176D with significant penalties.'],
  },

  AZ: {
    code:'AZ', name:'Arizona', rank:15,
    negligence: 'pure-comparative',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV recoverable in Arizona against at-fault third party. Arizona courts have consistently upheld DV claims.',
    glassDeductible: 'waived-all',
    glassNote: 'Arizona law (A.R.S. § 20-1263.01) prohibits deductibles for all glass repairs — full coverage at no cost to insured. Arizona has highest glass claim rate in the US due to road conditions.',
    antiSteering: 'A.R.S. § 20-1263 — insured has right to select repair facility.',
    clock: { acknowledgeDays:10, investigateDays:15, payDays:30, statute:'A.R.S. § 20-461; AAC R20-6-801' },
    keyAlerts: ['Glass deductible FULLY WAIVED in Arizona — A.R.S. § 20-1263.01.','Arizona has among the highest glass claim frequency nationally — Safelite and other glass networks have strong AZ presence.','Pure comparative negligence.'],
  },

  CO: {
    code:'CO', name:'Colorado', rank:16,
    negligence: 'modified-50',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV allowed in Colorado against at-fault third party. Colorado uses the before-and-after market value method.',
    glassDeductible: 'waived-all',
    glassNote: 'Colorado law (C.R.S. § 10-4-110.9) waives the deductible for all glass repairs and replacement — no out-of-pocket for insured.',
    antiSteering: 'C.R.S. § 10-4-110.5 — insurer must inform insured of right to select repair shop.',
    clock: { acknowledgeDays:10, investigateDays:30, payDays:30, statute:'C.R.S. § 10-3-1115; 3 CCR 702-5:5-1-14' },
    keyAlerts: ['Glass deductible FULLY WAIVED in Colorado — C.R.S. § 10-4-110.9.','Modified comparative (50% bar): claimant barred at exactly 50% fault.'],
  },

  MD: {
    code:'MD', name:'Maryland', rank:17,
    negligence: 'contributory',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV allowed in Maryland against at-fault third party despite contributory negligence. Maryland courts recognize DV as a separate element of damages.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies in Maryland.',
    antiSteering: 'Md. Code, Ins. § 19-508 — insurer cannot unreasonably require use of specific repair facility.',
    clock: { acknowledgeDays:10, investigateDays:30, payDays:30, statute:'Md. Code, Ins. § 27-303; COMAR 31.15.05' },
    keyAlerts: ['MARYLAND — CONTRIBUTORY NEGLIGENCE: If claimant is even 1% at fault, they recover NOTHING. Thorough fault investigation required.','MD allows DV despite contributory negligence — document vehicle value pre and post repair.'],
  },

  TN: {
    code:'TN', name:'Tennessee', rank:18,
    negligence: 'modified-50',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV recoverable in Tennessee against at-fault third party. Tennessee uses market value diminution approach.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies. No statutory waiver for glass in Tennessee.',
    antiSteering: 'Tenn. Code Ann. § 56-7-1201 — insured has right to select repair facility.',
    clock: { acknowledgeDays:15, investigateDays:30, payDays:15, statute:'Tenn. Code Ann. § 56-7-105; Tenn. Comp. R. & Regs. 0780-01-05' },
    keyAlerts: ['Modified comparative (50% bar): barred at exactly 50% fault.','Tennessee cap on bad faith penalties: 25% of amount due.'],
  },

  IN: {
    code:'IN', name:'Indiana', rank:19,
    negligence: 'modified-51',
    pip: { type:'none', limit:null, mandatory:false },
    diminishedValue: 'allowed',
    dvNotes: 'DV allowed in Indiana against at-fault third party. Indiana courts use market value diminution.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies in Indiana.',
    antiSteering: '760 IAC 1-22.5-5 — insurer must inform insured of right to choose repair facility.',
    clock: { acknowledgeDays:10, investigateDays:30, payDays:30, statute:'Ind. Code § 27-4-1-4.5; 760 IAC 1-22.5' },
    keyAlerts: ['Modified comparative (51% bar).','Indiana requires written acknowledgment of claim receipt.'],
  },

  MN: {
    code:'MN', name:'Minnesota', rank:20,
    negligence: 'modified-51',
    pip: { type:'no-fault', limit:40000, mandatory:true, treatmentWindow:null, specialRules:'Minnesota No-Fault Act: $40,000 PIP covering medical expenses ($20K) and non-medical loss ($20K). MN has strict no-fault rules — must use PIP before accessing tort liability for economic loss. Economic threshold: $4,000 in medical expenses or 60-day disability to access tort system.' },
    diminishedValue: 'limited',
    dvNotes: 'DV limited in Minnesota under the no-fault framework. Third-party DV may be available once tort threshold is met.',
    glassDeductible: 'full',
    glassNote: 'Standard comprehensive deductible applies. Chip repair waiver not mandated in Minnesota.',
    antiSteering: 'Minn. Stat. § 72A.201 subd. 6(4) — insurer cannot require use of specific repair shop.',
    clock: { acknowledgeDays:10, investigateDays:30, payDays:30, statute:'Minn. Stat. § 72A.201; Minn. R. 2880.0100' },
    keyAlerts: ['MINNESOTA NO-FAULT: $40,000 PIP mandatory. Economic threshold of $4,000 in medical expenses required to access tort system.','PIP covers $20K medical + $20K non-medical loss. Apply PIP first for all economic losses.'],
  },
}

/* ─── Helper functions ─────────────────────────────────────────── */

/** Extract 2-letter state code from a location string */
export function detectStateFromLocation(location: string): string | null {
  if (!location || location.trim().length < 2) return null
  const upper = location.toUpperCase()

  // Match explicit state codes (e.g. ", TX" or " TX " or "TEXAS")
  const STATE_NAMES: Record<string, string> = {
    'CALIFORNIA':'CA','TEXAS':'TX','FLORIDA':'FL','NEW YORK':'NY',
    'PENNSYLVANIA':'PA','ILLINOIS':'IL','OHIO':'OH','NEW JERSEY':'NJ',
    'GEORGIA':'GA','MICHIGAN':'MI','NORTH CAROLINA':'NC','VIRGINIA':'VA',
    'WASHINGTON':'WA','MASSACHUSETTS':'MA','ARIZONA':'AZ','COLORADO':'CO',
    'MARYLAND':'MD','TENNESSEE':'TN','INDIANA':'IN','MINNESOTA':'MN',
  }
  for (const [name, code] of Object.entries(STATE_NAMES)) {
    if (upper.includes(name)) return code
  }

  // Match 2-letter code after comma or space
  const CODE_REGEX = /(?:,\s*|\s+)(CA|TX|FL|NY|PA|IL|OH|NJ|GA|MI|NC|VA|WA|MA|AZ|CO|MD|TN|IN|MN)\b/
  const match = upper.match(CODE_REGEX)
  return match ? match[1] : null
}

/** Get rules for a state code — returns null if state not in top 20 */
export function getStateRules(stateCode: string): StateRule | null {
  return STATE_RULES[stateCode.toUpperCase()] ?? null
}

/** Glass deductible message for a state */
export function getGlassDeductibleMessage(rule: StateRule, repairType: 'chip' | 'replacement'): { waived: boolean; message: string } {
  if (rule.glassDeductible === 'waived-all') {
    return { waived:true, message:`Glass deductible fully waived in ${rule.name}. No out-of-pocket cost. (${rule.glassNote})` }
  }
  if (rule.glassDeductible === 'waived-chip' && repairType === 'chip') {
    return { waived:true, message:`Chip repair deductible waived in ${rule.name}. No out-of-pocket cost. (${rule.glassNote})` }
  }
  return { waived:false, message:`Standard comprehensive deductible applies in ${rule.name}. (${rule.glassNote})` }
}

/** Negligence label for display */
export function negligenceLabel(std: NegligenceStandard): string {
  const MAP: Record<NegligenceStandard, string> = {
    'pure-comparative':  'Pure comparative negligence',
    'modified-51':       'Modified comparative (51% bar)',
    'modified-50':       'Modified comparative (50% bar)',
    'contributory':      'Contributory negligence',
  }
  return MAP[std]
}

/** DV eligibility label */
export function dvLabel(dv: StateRule['diminishedValue']): string {
  const MAP = { strong:'Strong — proactively assess', allowed:'Allowed — assess on request', limited:'Limited', none:'Not recognized' }
  return MAP[dv]
}
