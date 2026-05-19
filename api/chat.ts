/* ═══════════════════════════════════════════════════════════════
   api/chat.ts — ValueMomentum Claims Assistant
   Vercel serverless function — Claude API + GW tools + FNOL
   Reuses: fnol_prompts.py, loss_type_mappings.py, claim_api_tools.py
   ═══════════════════════════════════════════════════════════════ */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VercelRequest, VercelResponse } from '@vercel/node'

/* ── Disable SSL for GW dev env (mirrors Python verify=False) ── */
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

/* ── In-memory FNOL session store (cleared on cold start — fine for demo) ── */
const fnolSessions = new Map<string, Record<string, any>>()

/* ══════════════════════════════════════════════════════
   LOSS TYPE MAPPINGS — ported from loss_type_mappings.py
   ══════════════════════════════════════════════════════ */
const BASE_REQUIRED = ['policyNumber','lossDate','lossLocation','description','lossType','lossCause','reporter']

const LOSS_REQUIRED: Record<string, string[]> = {
  auto:     [...BASE_REQUIRED, 'vehicleIncidents'],
  property: [...BASE_REQUIRED, 'propertyIncidents'],
  injury:   [...BASE_REQUIRED, 'injuryIncidents', 'isAnyoneInjured'],
  liability:[...BASE_REQUIRED],
  travel:   [...BASE_REQUIRED],
}

const AUTO_CAUSES   = ['vehcollision','rearend','theft','vandalism','hail','glass']
const PROP_CAUSES   = ['fire','waterdamage','wind','burglary','FallingObject']
const LOSS_CAUSES: Record<string,string[]> = {
  auto: AUTO_CAUSES, property: PROP_CAUSES, injury: ['vehcollision','other'],
  liability: ['other'], travel: ['other'],
}

/* ══════════════════════════════════════════════════════
   FIELD PROMPTS — ported from fnol_prompts.py FIELD_PROMPTS
   ══════════════════════════════════════════════════════ */
const FIELD_PROMPTS: Record<string,string> = {
  lossDate:                      'When did this loss occur? Date and approximate time.',
  lossLocation:                  'Where did this happen? Street address, city, state, ZIP.',
  description:                   'Can you describe what happened in your own words?',
  'reporter.firstName':          'May I have your first name?',
  'reporter.lastName':           'And your last name?',
  'reporter.phone':              "What's the best phone number to reach you?",
  'reporter.emailAddress':       'Email address for claim updates?',
  lossCause:                     'What was the primary cause? (collision, fire, theft, weather, etc.)',
  'vehicleIncidents.damageDescription': 'Describe the damage to your vehicle.',
  'vehicleIncidents.vehicle':    "Vehicle details — make, model, year, license plate?",
  'injuryIncidents.description': 'Describe the injury and how it occurred.',
  'injuryIncidents.ambulanceUsed':'Was an ambulance called to the scene?',
  isAnyoneInjured:               'Was anyone injured in this incident?',
  propertyAddress:               "What is the property's address?",
  'propertyIncidents.isHomeHabitable': 'Is the property still habitable right now?',
  'propertyIncidents.damageDescription': 'Describe the property damage.',
}

/* ══════════════════════════════════════════════════════
   SYSTEM PROMPT — reuses fnol_prompts.py guidelines
   ══════════════════════════════════════════════════════ */
function buildSystemPrompt(claimContext: any, fnolData: any): string {
  const today = new Date().toLocaleDateString('en-US', {weekday:'long',year:'numeric',month:'long',day:'numeric'})

  return `You are the ValueMomentum Claims Assistant — an empathetic, knowledgeable AI assistant for insurance claims. Today is ${today}.

## YOUR CAPABILITIES
1. CLAIM STATUS — Answer questions about existing claims using real data tools
2. FILE A NEW CLAIM (FNOL) — Guide through Auto or Property FNOL, one question at a time
3. PAYMENT QUESTIONS — Explain payment status, amounts, and timelines
4. ADJUSTER CONTACT — Provide contact info and escalate if needed
5. ROADSIDE ASSISTANCE — Direct customers to roadside help
6. GENERAL INSURANCE Q&A — Answer coverage and process questions

## EMPATHY GUIDELINES (from insurance best practices)
- People reporting claims may be stressed or upset — always acknowledge this first
- Ask ONE question at a time — never ask multiple things at once
- Confirm important details by summarizing what you understood
- Explain WHY you need certain information when it might not be obvious
- If someone seems confused or distressed, offer human adjuster escalation
- Use plain language — avoid insurance jargon
- Keep responses concise and clear

## SAFETY FIRST — ALWAYS
- Auto claims: FIRST ask "Was anyone injured?" before anything else
- Property claims: FIRST ask "Is everyone safe and is the property habitable?" before anything else
- If someone is in immediate danger, tell them to call 911 first

## FNOL DATA COLLECTED SO FAR
${fnolData && Object.keys(fnolData).length > 0 
  ? JSON.stringify(fnolData, null, 2)
  : 'Nothing collected yet for this session.'}

## ACTIVE CLAIM CONTEXT
${claimContext ? `The following claim is open in the portal — use this data to answer questions without asking the customer to repeat anything:

Claim Number: ${claimContext.claimNumber}
Insured: ${claimContext.insuredName}
Policy: ${claimContext.policyNumber}
LOB: ${claimContext.lobType?.toUpperCase()}
Status: ${claimContext.claimStatus} — ${claimContext.statusType?.replace('-',' ')}
Vehicle/Property: ${claimContext.vehicle}
Loss Type: ${claimContext.lossType}
Date of Loss: ${claimContext.dateOfLoss}
Reported: ${claimContext.reportedDate}
Adjuster: ${claimContext.adjusterName} | ${claimContext.adjusterPhone}
Current Stage: Step ${claimContext.activeStep} of 8 — ${claimContext.statusMsg?.split('.')[0]}
Repair Shop: ${claimContext.repairShop}
Rental: ${claimContext.rentalInfo}
` : 'No specific claim is currently open. Ask for the claim number if the user has questions about a specific claim.'}

## LOSS TYPE MAPPINGS FOR FNOL
Auto required fields: ${LOSS_REQUIRED.auto.join(', ')}
Property required fields: ${LOSS_REQUIRED.property.join(', ')}
Auto loss causes: ${AUTO_CAUSES.join(', ')}
Property loss causes: ${PROP_CAUSES.join(', ')}

## FIELD QUESTION TEMPLATES
Use these exact phrasings when asking for each field:
${Object.entries(FIELD_PROMPTS).map(([k,v]) => `${k}: "${v}"`).join('\n')}

## TOOLS AVAILABLE
- get_claim_status: Fetch real-time claim data from Guidewire
- get_claim_payments: Fetch payment details (amounts, dates, status)
- get_claim_contacts: Get adjuster contact information
- get_claim_timeline: Get recent claim events and updates
- get_policy_claims: List all claims for a policy number
- save_fnol_field: Save a collected FNOL field value
- get_fnol_summary: Review all FNOL data collected so far
- check_fnol_ready: Check if enough data collected to create claim
- create_draft_claim: Create claim in Guidewire (call when all required fields present)
- submit_claim: Submit a draft claim for processing

## RESPONSE RULES
- Never fabricate claim data — only use what tools return or what is in the context above
- Never show internal IDs, system codes, or raw JSON to the user
- For payment amounts, always use what the tools return
- When creating a draft claim, show a clear summary first and ask for confirmation
- After submitting a claim, provide the claim number and next steps
- Always end with a clear question or next action`
}

/* ══════════════════════════════════════════════════════
   TOOL DEFINITIONS — Claude tool_use schema
   ══════════════════════════════════════════════════════ */
const TOOLS = [
  {
    name: 'get_claim_status',
    description: 'Fetch real-time claim status, stage, ETA, and details from Guidewire ClaimCenter',
    input_schema: {
      type: 'object',
      properties: {
        claim_number: { type: 'string', description: 'The claim number e.g. 000-00-000480' },
      },
      required: ['claim_number'],
    },
  },
  {
    name: 'get_claim_payments',
    description: 'Fetch all payment details for a claim including amounts, dates, and status',
    input_schema: {
      type: 'object',
      properties: {
        claim_number: { type: 'string', description: 'The claim number' },
      },
      required: ['claim_number'],
    },
  },
  {
    name: 'get_claim_contacts',
    description: 'Get adjuster and all contact details for a claim',
    input_schema: {
      type: 'object',
      properties: {
        claim_number: { type: 'string', description: 'The claim number' },
      },
      required: ['claim_number'],
    },
  },
  {
    name: 'get_claim_timeline',
    description: 'Get recent events and timeline updates for a claim',
    input_schema: {
      type: 'object',
      properties: {
        claim_number: { type: 'string', description: 'The claim number' },
      },
      required: ['claim_number'],
    },
  },
  {
    name: 'get_policy_claims',
    description: 'Get all claims associated with a policy number',
    input_schema: {
      type: 'object',
      properties: {
        policy_number: { type: 'string', description: 'The policy number' },
      },
      required: ['policy_number'],
    },
  },
  {
    name: 'save_fnol_field',
    description: 'Save a collected FNOL field value. Call this every time the user provides a piece of claim information.',
    input_schema: {
      type: 'object',
      properties: {
        key:   { type: 'string', description: 'Field name e.g. lossDate, description, reporter.firstName' },
        value: { description: 'The value to save — string, number, boolean, or object' },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'get_fnol_summary',
    description: 'Get a summary of all FNOL data collected so far in this session',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'check_fnol_ready',
    description: 'Check if all required fields are collected for a given loss type and what is still missing',
    input_schema: {
      type: 'object',
      properties: {
        loss_type: { type: 'string', enum: ['auto','property','injury','liability','travel'], description: 'The loss type' },
      },
      required: ['loss_type'],
    },
  },
  {
    name: 'create_draft_claim',
    description: 'Create a draft claim in Guidewire ClaimCenter using all collected FNOL data. Call only after user confirms the summary.',
    input_schema: {
      type: 'object',
      properties: {
        loss_type: { type: 'string', description: 'The loss type: auto, property, etc.' },
      },
      required: ['loss_type'],
    },
  },
  {
    name: 'submit_claim',
    description: 'Submit a draft claim to open it for processing. Requires claim_id from create_draft_claim.',
    input_schema: {
      type: 'object',
      properties: {
        claim_id: { type: 'string', description: 'The draft claim ID returned by create_draft_claim' },
      },
      required: ['claim_id'],
    },
  },
]

/* ══════════════════════════════════════════════════════
   GW CLIENT — ported from claim_api_tools.py
   ══════════════════════════════════════════════════════ */
const GW_BASE  = process.env.GW_BASE_URL || ''
const GW_USER  = process.env.GW_USERNAME || 'su'
const GW_PASS  = process.env.GW_PASSWORD || 'gw'
const GW_AUTH  = 'Basic ' + Buffer.from(`${GW_USER}:${GW_PASS}`).toString('base64')
const GW_HEADS = { 'Authorization': GW_AUTH, 'Content-Type': 'application/json' }

async function gwFetch(path: string, method = 'GET', body?: any) {
  try {
    const url = `${GW_BASE}${path}`
    const res = await fetch(url, {
      method,
      headers: GW_HEADS,
      body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    return { ok: res.ok, status: res.status, data }
  } catch (e: any) {
    return { ok: false, status: 0, data: { error: e.message } }
  }
}

/* Build GW payload — ported from claim_api_tools.py build_claim_payload() */
function buildGWPayload(fnolData: Record<string,any>, lossType: string) {
  const attrs: any = {}
  if (!fnolData.policyNumber) throw new Error('policyNumber is required')
  if (!fnolData.lossDate)     throw new Error('lossDate is required')

  attrs.policyNumber  = fnolData.policyNumber
  attrs.lossDate      = fnolData.lossDate.includes('T') ? fnolData.lossDate : `${fnolData.lossDate}T00:00:00.000Z`
  attrs.reportedDate  = fnolData.reportedDate || new Date().toISOString()
  if (fnolData.description) attrs.description = fnolData.description
  if (fnolData.lossCause)   attrs.lossCause = typeof fnolData.lossCause === 'string' ? {code:fnolData.lossCause} : fnolData.lossCause

  if (fnolData.lossLocation) {
    const loc = {...fnolData.lossLocation}
    if (typeof loc.state === 'string') loc.state = {code: loc.state}
    if (!loc.country) loc.country = 'US'
    attrs.lossLocation = loc
  }

  const payload: any = { data: { attributes: attrs } }

  /* Reporter contact — mirrors Python reporter handling */
  if (fnolData.reporter && (fnolData.reporter.firstName || fnolData.reporter.lastName)) {
    const r = fnolData.reporter
    payload.included = { ClaimContact: [{
      attributes: {
        contactSubtype: 'Person',
        firstName:  r.firstName  || 'Unknown',
        lastName:   r.lastName   || 'Reporter',
        ...(r.emailAddress ? { emailAddress1: r.emailAddress } : {}),
        ...(r.phone ? { workPhone: { countryCode:{code:'US'}, number: String(r.phone).replace(/\D/g,'').slice(-10) } } : {}),
        ...(fnolData.lossLocation ? { primaryAddress: {
          addressLine1: fnolData.lossLocation.addressLine1 || 'Not Provided',
          city:         fnolData.lossLocation.city         || 'Unknown',
          state:        fnolData.lossLocation.state        || {code:'TX'},
          postalCode:   fnolData.lossLocation.postalCode   || '00000',
          country:      'US',
        }} : {}),
      },
      method: 'post',
      refid:  'reporterContact',
      uri:    '/claim/v1/claims/this/contacts',
    }]}
    attrs.reporter = { refid: 'reporterContact' }
  }

  /* Vehicle incidents for auto — mirrors Python vehicleIncidents handling */
  if (lossType === 'auto' && fnolData.vehicleIncidents) {
    if (!payload.included) payload.included = {}
    const incidents = Array.isArray(fnolData.vehicleIncidents) ? fnolData.vehicleIncidents : [fnolData.vehicleIncidents]
    payload.included.VehicleIncident = incidents.map((inc: any) => ({
      attributes: {
        damageDescription: inc.damageDescription || fnolData.description || 'Vehicle damage',
        lossParty: {code:'insured'},
        severity:  {code:'minor'},
        ...(inc.vehicle ? {vehicle: inc.vehicle} : {}),
      },
      method: 'post',
      uri: '/claim/v1/claims/this/vehicle-incidents',
    }))
  }

  return payload
}

/* ══════════════════════════════════════════════════════
   MOCK DATA — used when GW returns no data (day 1 fallback)
   mirrors MOCK_CLAIMS from ClaimSearch.tsx
   ══════════════════════════════════════════════════════ */
const MOCK_STATUS: Record<string,any> = {
  '000-00-000480': { claimNumber:'000-00-000480', insuredName:'Rosario Marinello', status:'Open', stage:'Repair In Progress', step:6, total:8, eta:'Est. May 28, 2025', adjuster:'Emily Rodriguez', adjusterPhone:'(214) 555-0142', vehicle:'2022 Honda CR-V EX-L', lossType:'Collision — Rear End', repairShop:'Caliber Collision Dallas', rental:'Enterprise #ENT-88421 · 9 days remaining', payments:'1 payment sent · 1 payment pending' },
  '000-00-000521': { claimNumber:'000-00-000521', insuredName:'Marcus T. Williams', status:'Open', stage:'Inspection Scheduled', step:3, total:8, eta:'Drop-off by May 23', adjuster:'Scott Henson', adjusterPhone:'(214) 555-0188', vehicle:'2021 Ford F-150 XLT 4WD', lossType:'Hail / Weather', repairShop:'Joe Myers Ford Collision Houston', rental:'Authorized at drop-off', payments:'No payments yet' },
  '000-00-000612': { claimNumber:'000-00-000612', insuredName:'Jennifer K. Okafor', status:'Closed', stage:'Claim Closed', step:8, total:8, eta:'Settled Jan 30, 2025', adjuster:'Linda Park', adjusterPhone:'(214) 555-0166', vehicle:'2020 Toyota Camry SE', lossType:'Vehicle Theft', repairShop:'N/A — Total Loss', rental:'Closed Jan 28, 20 days covered', payments:'All payments cleared' },
  '000-00-000750': { claimNumber:'000-00-000750', insuredName:'Sarah Mitchell', status:'Open', stage:'Rebuild In Progress', step:6, total:8, eta:'Est. Jun 6, 2025', adjuster:'Maria Delgado', adjusterPhone:'(214) 555-0220', vehicle:'4512 Oak Ridge Dr, Plano TX', lossType:'Wind/Hail', repairShop:'ABC Restoration & Roofing', rental:'N/A — Home habitable', payments:'1 payment sent · 1 pending' },
  '000-00-000751': { claimNumber:'000-00-000751', insuredName:'James & Carol Webb', status:'Open', stage:'Contractor Selection', step:5, total:8, eta:'Pending contractor', adjuster:'Kevin Tran', adjusterPhone:'(214) 555-0233', vehicle:'2201 Willow Creek Rd, Frisco TX', lossType:'Water — Burst Pipe', repairShop:'TBD', rental:'ALE Active — Extended Stay America Frisco', payments:'2 payments sent · 1 pending' },
  '000-00-000752': { claimNumber:'000-00-000752', insuredName:'Robert Chen', status:'Closed', stage:'Claim Closed', step:8, total:8, eta:'Settled Nov 8, 2024', adjuster:'Patricia Vasquez', adjusterPhone:'(214) 555-0244', vehicle:'5801 Clearwater Blvd, Allen TX', lossType:'Fire — Kitchen', repairShop:'Servpro Allen/McKinney', rental:'ALE Closed — 42 days covered', payments:'All payments cleared' },
}

/* ══════════════════════════════════════════════════════
   TOOL EXECUTOR — calls GW API or falls back to mock
   ══════════════════════════════════════════════════════ */
async function executeTool(name: string, input: any, sessionId: string): Promise<string> {
  const session = fnolSessions.get(sessionId) || {}

  switch (name) {

    case 'get_claim_status': {
      const num = input.claim_number?.trim()
      const gw = await gwFetch(`/claim/v1/claims?claimNumber=${num}&pageSize=1`)
      if (gw.ok && gw.data?.data?.[0]) {
        const c = gw.data.data[0].attributes
        return JSON.stringify({ source:'guidewire', claimNumber:num, status:c.state, lossDate:c.lossDate, description:c.description, adjuster:c.assignedUser?.displayName })
      }
      const mock = MOCK_STATUS[num]
      if (mock) return JSON.stringify({ source:'demo', ...mock })
      return JSON.stringify({ error: `Claim ${num} not found` })
    }

    case 'get_claim_payments': {
      const num = input.claim_number?.trim()
      const gw = await gwFetch(`/claim/v1/claims/${num}/checks`)
      if (gw.ok) return JSON.stringify({ source:'guidewire', payments: gw.data?.data || [] })
      const mock = MOCK_STATUS[num]
      return JSON.stringify({ source:'demo', summary: mock?.payments || 'No payment data found' })
    }

    case 'get_claim_contacts': {
      const num = input.claim_number?.trim()
      const gw = await gwFetch(`/claim/v1/claims/${num}/contacts`)
      if (gw.ok) return JSON.stringify({ source:'guidewire', contacts: gw.data?.data || [] })
      const mock = MOCK_STATUS[num]
      if (mock) return JSON.stringify({ source:'demo', adjuster:mock.adjuster, phone:mock.adjusterPhone })
      return JSON.stringify({ error: 'Contacts not found' })
    }

    case 'get_claim_timeline': {
      const num = input.claim_number?.trim()
      const gw = await gwFetch(`/claim/v1/claims/${num}/notes`)
      if (gw.ok) return JSON.stringify({ source:'guidewire', notes: gw.data?.data || [] })
      return JSON.stringify({ source:'demo', message: 'Timeline data available after GW integration' })
    }

    case 'get_policy_claims': {
      const pol = input.policy_number?.trim()
      const gw = await gwFetch(`/claim/v1/claims?policyNumber=${pol}`)
      if (gw.ok && gw.data?.data?.length) return JSON.stringify({ source:'guidewire', claims:gw.data.data })
      const mock = Object.values(MOCK_STATUS).filter((c:any) => c.policyNumber === pol)
      return JSON.stringify({ source:'demo', claims: mock.length ? mock : 'No claims found for this policy' })
    }

    case 'save_fnol_field': {
      let val = input.value
      if (['lossType','lossCause'].includes(input.key) && typeof val === 'string') val = {code: val}
      const key = input.key
      if (key.includes('.')) {
        const [parent, child] = key.split('.')
        if (!session[parent]) session[parent] = {}
        session[parent][child] = val
      } else {
        session[key] = val
      }
      fnolSessions.set(sessionId, session)
      return JSON.stringify({ success:true, key:input.key, value:val, totalFields: Object.keys(session).length })
    }

    case 'get_fnol_summary': {
      return JSON.stringify({ success:true, data:session, fieldCount:Object.keys(session).length })
    }

    case 'check_fnol_ready': {
      const lt = input.loss_type
      const required = LOSS_REQUIRED[lt] || BASE_REQUIRED
      const missing = required.filter(f => !session[f])
      return JSON.stringify({ lossType:lt, isReady:missing.length===0, missing, collected:Object.keys(session) })
    }

    case 'create_draft_claim': {
      const lt = input.loss_type
      /* Auto-fill vehicleIncidents if auto and description exists */
      if (lt === 'auto' && !session.vehicleIncidents && session.description) {
        session.vehicleIncidents = [{ damageDescription: session.description, lossParty:{code:'insured'} }]
      }
      if (lt === 'property' && !session.propertyIncidents && session.description) {
        session.propertyIncidents = [{ description: session.description }]
      }
      if (!session.lossCause) session.lossCause = {code: lt==='auto'?'vehcollision':'other'}
      if (!session.lossType)  session.lossType  = {code: lt}
      fnolSessions.set(sessionId, session)

      try {
        const payload = buildGWPayload(session, lt)
        console.log('[GW] Calling POST', GW_BASE + '/claim/v1/claims')
        console.log('[GW] Payload:', JSON.stringify(payload).slice(0,600))
        const gw = await gwFetch('/claim/v1/claims', 'POST', payload)
        console.log('[GW] Response:', gw.status, JSON.stringify(gw.data).slice(0,400))
        if (gw.ok && gw.status === 201) {
          const attrs = gw.data?.data?.attributes || {}
          const claimId  = attrs.id
          const claimNum = attrs.claimNumber
          session._draftClaimId  = claimId
          session._draftClaimNum = claimNum
          fnolSessions.set(sessionId, session)
          return JSON.stringify({ success:true, source:'guidewire', claimId, claimNumber:claimNum, message:`Draft claim created: ${claimNum}` })
        }
        /* GW call failed — return actual error for debugging */
        const errBody = JSON.stringify(gw.data).slice(0, 800)
        console.error(`[GW] create_draft_claim failed: ${gw.status}`, errBody)
        return JSON.stringify({
          success: false,
          source:  'guidewire',
          gwStatus: gw.status,
          gwError:  gw.data,
          message: `Guidewire returned status ${gw.status}. Please check claim data and try again.`,
          debug: `URL: ${GW_BASE}/claim/v1/claims | Status: ${gw.status}`
        })
      } catch(e:any) {
        return JSON.stringify({ success:false, error:e.message })
      }
    }

    case 'submit_claim': {
      const cid = input.claim_id || session._draftClaimId
      if (!cid) return JSON.stringify({ success:false, error:'No draft claim ID found. Create a draft first.' })
      const gw = await gwFetch(`/claim/v1/claims/${cid}/submit`, 'POST')
      if (gw.ok) {
        const num = gw.data?.data?.attributes?.claimNumber || session._draftClaimNum
        fnolSessions.set(sessionId, {})
        return JSON.stringify({ success:true, source:'guidewire', claimNumber:num, message:'Claim submitted successfully' })
      }
      const num = session._draftClaimNum || cid
      fnolSessions.set(sessionId, {})
      return JSON.stringify({ success:true, source:'demo', claimNumber:num, message:`Demo: Claim ${num} submitted. An adjuster will contact you within 24–48 hours.` })
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}

/* ══════════════════════════════════════════════════════
   CLAUDE CALL LOOP — handles tool_use recursively
   ══════════════════════════════════════════════════════ */
async function callClaude(messages: any[], systemPrompt: string, sessionId: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  let history = [...messages]
  let maxLoops = 8

  while (maxLoops-- > 0) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system:     systemPrompt,
        tools:      TOOLS,
        messages:   history,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic API error ${res.status}: ${err}`)
    }

    const data = await res.json() as any
    const stopReason = data.stop_reason

    /* Add assistant response to history */
    history.push({ role: 'assistant', content: data.content })

    /* If no tool use — we have the final text response */
    if (stopReason !== 'tool_use') {
      const textBlock = data.content.find((b: any) => b.type === 'text')
      return textBlock?.text || ''
    }

    /* Execute all tool calls and add results */
    const toolResults = []
    for (const block of data.content) {
      if (block.type !== 'tool_use') continue
      const result = await executeTool(block.name, block.input, sessionId)
      toolResults.push({
        type:        'tool_result',
        tool_use_id: block.id,
        content:     result,
      })
    }
    history.push({ role: 'user', content: toolResults })
  }

  return 'I ran into an issue processing your request. Please try again.'
}

/* ══════════════════════════════════════════════════════
   MAIN HANDLER
   ══════════════════════════════════════════════════════ */
export default async function handler(req: VercelRequest, res: VercelResponse) {

  /* CORS */
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { messages, claimContext, sessionId = 'default' } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' })
    }

    /* Load FNOL session data */
    const fnolData   = fnolSessions.get(sessionId) || {}
    const systemPrompt = buildSystemPrompt(claimContext, fnolData)

    /* Call Claude with tool loop */
    const response = await callClaude(messages, systemPrompt, sessionId)

    /* Stream response word by word via SSE */
    res.setHeader('Content-Type',  'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection',    'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const words = response.split(' ')
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`)
      await new Promise(r => setTimeout(r, 18))
    }
    res.write('data: [DONE]\n\n')
    res.end()

  } catch (err: any) {
    console.error('[chat] Error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: err.message })
    }
  }
}
