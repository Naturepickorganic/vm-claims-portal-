/* ═══════════════════════════════════════════════════════════════
   revenueLeverConfig.ts — Vendor & monetization config
   5 revenue models × all LOBs
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */

export type RevenueType =
  | 'AFFILIATE_PARTNERSHIP'
  | 'EMBEDDED_INSURANCE'
  | 'MARKETPLACE_COMMISSION'
  | 'POLICY_UPSELL'
  | 'SUBSCRIPTION_ADDON'

export interface RevenueLever {
  id:          string
  revenueType: RevenueType
  vendorName:  string
  apiDocsUrl:  string
  offerContext: string[]   // which LOBs + tabs this applies to
  estimatedRPO: string     // revenue per offer click (estimate)
  notes:        string
}

export const REVENUE_LEVERS: RevenueLever[] = [
  /* ── AFFILIATE_PARTNERSHIP ── */
  { id:'honk_agero',        revenueType:'AFFILIATE_PARTNERSHIP',   vendorName:'HONK / Agero / Urgently',         apiDocsUrl:'https://developer.honk.com',                offerContext:['auto.coverage','auto.services','auto.closure'],          estimatedRPO:'$8–12 per referral',    notes:'Roadside dispatch — per tow referral fee' },
  { id:'black_book',        revenueType:'AFFILIATE_PARTNERSHIP',   vendorName:'Black Book / CARFAX / JD Power',  apiDocsUrl:'https://developer.carfax.com',              offerContext:['auto.payments','auto.closure'],                          estimatedRPO:'$2–5 per valuation',    notes:'Vehicle valuation and trade-in referral' },
  { id:'identitylock',      revenueType:'AFFILIATE_PARTNERSHIP',   vendorName:'LifeLock / Experian',             apiDocsUrl:'https://developer.experian.com',            offerContext:['auto.info','auto.documents','auto.coverage'],            estimatedRPO:'$15–20 per signup',     notes:'Identity theft monitoring referral fee' },
  { id:'legal_consultation',revenueType:'AFFILIATE_PARTNERSHIP',   vendorName:'LegalZoom / RocketLawyer',        apiDocsUrl:'https://developer.legalzoom.com',           offerContext:['auto.contacts','property.contacts','cmp.contacts'],      estimatedRPO:'$10–25 per referral',   notes:'Legal consultation CPA model' },
  { id:'paypal_cashback',   revenueType:'AFFILIATE_PARTNERSHIP',   vendorName:'PayPal / Venmo',                  apiDocsUrl:'https://developer.paypal.com',              offerContext:['auto.payments'],                                        estimatedRPO:'$3–5 per transaction',  notes:'Payment routing cashback revenue share' },
  { id:'docu_sign',         revenueType:'AFFILIATE_PARTNERSHIP',   vendorName:'DocuSign',                        apiDocsUrl:'https://developers.docusign.com',           offerContext:['auto.documents','property.documents','wc.documents'],   estimatedRPO:'$1–3 per signed doc',   notes:'E-signature volume deal' },

  /* ── EMBEDDED_INSURANCE ── */
  { id:'cover_genius',      revenueType:'EMBEDDED_INSURANCE',      vendorName:'Cover Genius XCover',             apiDocsUrl:'https://developer.covergenius.com',         offerContext:['auto.coverage','auto.services'],                         estimatedRPO:'$20–50 per policy sold',notes:'GAP, OEM warranty, mechanical breakdown embedded' },
  { id:'munich_re_digital', revenueType:'EMBEDDED_INSURANCE',      vendorName:'Munich Re Digital Partners',      apiDocsUrl:'https://www.munichre.com/digital-partners', offerContext:['auto.services','auto.coverage'],                         estimatedRPO:'$15–40 per policy',     notes:'Embedded auto warranty at point of repair' },
  { id:'home_warranty',     revenueType:'EMBEDDED_INSURANCE',      vendorName:'Super / Cinch / 2-10 HBW',        apiDocsUrl:'https://developer.super.com',               offerContext:['property.payments','property.closure'],                  estimatedRPO:'$25–60 per policy',     notes:'Embedded home warranty at payout stage' },

  /* ── MARKETPLACE_COMMISSION ── */
  { id:'repairpal_openbay', revenueType:'MARKETPLACE_COMMISSION',  vendorName:'RepairPal / Openbay / Safelite',  apiDocsUrl:'https://developer.repairpal.com',           offerContext:['auto.services','auto.coverage'],                         estimatedRPO:'$15–30 per booking',    notes:'Repair shop booking commission 8–12%' },
  { id:'turo_enterprise',   revenueType:'MARKETPLACE_COMMISSION',  vendorName:'Turo API / Enterprise ARMS',      apiDocsUrl:'https://developer.turo.com',                offerContext:['auto.info','auto.services','auto.contacts'],             estimatedRPO:'$10–20 per booking',    notes:'Rental car booking referral commission' },
  { id:'contractors',       revenueType:'MARKETPLACE_COMMISSION',  vendorName:'Thumbtack / Angi / HomeAdvisor',  apiDocsUrl:'https://developer.thumbtack.com',           offerContext:['property.services','property.contacts','cmp.services'],  estimatedRPO:'$20–40 per booking',    notes:'Contractor booking 10–15% commission' },
  { id:'hotel_airbnb',      revenueType:'MARKETPLACE_COMMISSION',  vendorName:'Hotel Engine / Airbnb API',       apiDocsUrl:'https://developer.airbnb.com',              offerContext:['property.coverage','property.info'],                    estimatedRPO:'$15–35 per booking',    notes:'ALE lodging booking commission' },
  { id:'fleet_maint',       revenueType:'MARKETPLACE_COMMISSION',  vendorName:'Fleetio / YourMechanic',          apiDocsUrl:'https://developer.fleetio.com',             offerContext:['commAuto.services','commAuto.payments'],                 estimatedRPO:'$25–50 per booking',    notes:'Fleet maintenance scheduling commission' },

  /* ── POLICY_UPSELL ── */
  { id:'comprehensive',     revenueType:'POLICY_UPSELL',           vendorName:'Same carrier endorsement',        apiDocsUrl:'',                                          offerContext:['auto.coverage'],                                        estimatedRPO:'$120–240/yr premium',   notes:'Comprehensive add-on — direct upsell' },
  { id:'multi_policy',      revenueType:'POLICY_UPSELL',           vendorName:'Same carrier — bundle',           apiDocsUrl:'',                                          offerContext:['auto.payments','auto.info'],                             estimatedRPO:'$300–600/yr premium',   notes:'Auto + home bundle — highest LTV upsell' },
  { id:'rcv_upgrade',       revenueType:'POLICY_UPSELL',           vendorName:'Same carrier endorsement',        apiDocsUrl:'',                                          offerContext:['property.coverage','property.services'],                 estimatedRPO:'$80–180/yr premium',    notes:'ACV → RCV upgrade endorsement' },
  { id:'umbrella',          revenueType:'POLICY_UPSELL',           vendorName:'Same carrier endorsement',        apiDocsUrl:'',                                          offerContext:['property.coverage','property.contacts'],                 estimatedRPO:'$200–400/yr premium',   notes:'Personal umbrella $1M+ — high-value' },
  { id:'cyber_suite',       revenueType:'POLICY_UPSELL',           vendorName:'Same carrier — Cyber Suite',      apiDocsUrl:'',                                          offerContext:['cmp.coverage','cmp.payments','cmp.closure'],             estimatedRPO:'$400–800/yr premium',   notes:'Cyber + EPLI + utility interruption bundle' },
  { id:'rtw_program',       revenueType:'POLICY_UPSELL',           vendorName:'Same carrier — RTW endorsement',  apiDocsUrl:'',                                          offerContext:['wc.coverage','wc.services','wc.closure'],                estimatedRPO:'10% premium reduction', notes:'RTW enrollment — safety credit offset' },
  { id:'fleet_forgive',     revenueType:'POLICY_UPSELL',           vendorName:'Same carrier fleet endorsement',  apiDocsUrl:'',                                          offerContext:['commAuto.coverage','commAuto.payments'],                  estimatedRPO:'$150–300/yr premium',   notes:'Accident forgiveness — prevents churn' },

  /* ── SUBSCRIPTION_ADDON ── */
  { id:'roadside_sub',      revenueType:'SUBSCRIPTION_ADDON',      vendorName:'Nation Safe Drivers / Allstate',  apiDocsUrl:'https://developer.nationsafedrivers.com',   offerContext:['auto.closure','auto.payments'],                          estimatedRPO:'$9.99/mo recurring',    notes:'Roadside subscription — recurring revenue' },
  { id:'wellness_sub',      revenueType:'SUBSCRIPTION_ADDON',      vendorName:'Lyra / Spring Health / Teladoc',  apiDocsUrl:'https://developer.lyrahealth.com',          offerContext:['auto.closure','wc.services','wc.payments'],              estimatedRPO:'$15–25/mo recurring',   notes:'Mental health + telehealth subscription' },
  { id:'cyber_monitoring',  revenueType:'SUBSCRIPTION_ADDON',      vendorName:'Coalition / Cowbell Cyber',       apiDocsUrl:'https://developer.coalitioninc.com',        offerContext:['cmp.coverage','cmp.info'],                               estimatedRPO:'$30–80/mo recurring',   notes:'Active cyber threat monitoring subscription' },
  { id:'telehealth_wc',     revenueType:'SUBSCRIPTION_ADDON',      vendorName:'Teladoc / MDLIVE / Amwell',       apiDocsUrl:'https://developer.teladoc.com',             offerContext:['wc.services','wc.payments','wc.contacts'],               estimatedRPO:'$10–20/mo per worker',  notes:'WC telehealth subscription for injured workers' },
  { id:'tele_rehab',        revenueType:'SUBSCRIPTION_ADDON',      vendorName:'Hinge Health / Sword Health',     apiDocsUrl:'https://developer.hingehealth.com',         offerContext:['wc.coverage','wc.services'],                             estimatedRPO:'$50–100/mo per worker', notes:'Virtual PT subscription — WC recovery program' },
]

/* Helper: filter by revenue type */
export const getLeversByType = (type: RevenueType) =>
  REVENUE_LEVERS.filter(l => l.revenueType === type)

/* Helper: filter by context (e.g. 'auto.coverage') */
export const getLeversByContext = (context: string) =>
  REVENUE_LEVERS.filter(l => l.offerContext.includes(context))

export default REVENUE_LEVERS
