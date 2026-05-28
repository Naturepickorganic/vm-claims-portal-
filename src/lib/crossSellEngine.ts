/* ═══════════════════════════════════════════════════════════════
   crossSellEngine.ts — CS/UP Rules Engine
   Maps: LOB × Tab → { upsellOffers[], crossSellOffers[], gapAlert? }
   Vendors: real API doc URLs from Connected Claims API Reference (May 2026)
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */

export type LobType = 'auto' | 'property' | 'commAuto' | 'wc' | 'cmp'
export type TabId   = 'coverage' | 'info' | 'contacts' | 'services' | 'documents' | 'payments' | 'closure'

export type RevenueType =
  | 'POLICY_UPSELL'
  | 'AFFILIATE_PARTNERSHIP'
  | 'EMBEDDED_INSURANCE'
  | 'MARKETPLACE_COMMISSION'
  | 'SUBSCRIPTION_ADDON'

export interface VendorLink {
  name:      string
  url:       string        // empty string = no public API
  available: boolean       // false = coming soon
}

export interface Offer {
  id:          string
  icon:        string
  badge:       string
  title:       string
  desc:        string
  cta:         string
  vendors:     VendorLink[]
  revenueType: RevenueType
}

export interface OfferSet {
  upsell:    Offer[]
  crossSell: Offer[]
  gapAlert?: string
}

/* ── Vendor link helpers ── */
const v  = (name:string, url:string): VendorLink => ({ name, url, available: true  })
const vx = (name:string, url:string): VendorLink => ({ name, url, available: false }) // coming soon

/* ── Offer library with real API URLs ── */
const O: Record<string, Offer> = {

  /* ────────────────────────────────
     AUTO — Upsell (same carrier)
  ──────────────────────────────── */
  comprehensive: {
    id:'comprehensive', icon:'🛡️', badge:'Coverage gap', cta:'Get quote',
    title:'Add comprehensive coverage',
    desc:'Theft, weather, and glass events not currently covered. Upgrade for full ACV protection.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  oemParts: {
    id:'oemParts', icon:'🔩', badge:'OEM protection', cta:'View API docs',
    title:'OEM parts + GAP warranty',
    desc:'Ensure OEM parts used in repair. Add GAP and mechanical breakdown warranty — embedded at point of repair.',
    revenueType:'EMBEDDED_INSURANCE',
    vendors:[ v('Cover Genius XCover','https://docs.covergenius.com/xcover'), vx('Munich Re Digital','mailto:digital-partners@munichre.com') ],
  },
  deductWaiver: {
    id:'deductWaiver', icon:'💳', badge:'Save $500', cta:'Add to policy',
    title:'Deductible waiver endorsement',
    desc:'Add deductible waiver now — could apply to this very claim and all future ones.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  ubiTelematics: {
    id:'ubiTelematics', icon:'📊', badge:'Saves $180/yr', cta:'View API docs',
    title:'UBI telematics discount',
    desc:'Safe drivers earn 10–20% additional premium discount with usage-based insurance telematics.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('LexisNexis','https://dev.lexisnexis.com/'), vx('Octo Telematics','https://www.octotelematics.com/partners/'), vx('TrueMotion','https://www.truemotion.co/developers') ],
  },
  autoBundle: {
    id:'autoBundle', icon:'🏠', badge:'Saves $240/yr', cta:'Get bundle quote',
    title:'Bundle auto + home — 15% off',
    desc:'Add homeowners policy and get multi-policy discount on both premiums. Takes 2 minutes.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  loyaltyTier: {
    id:'loyaltyTier', icon:'🏆', badge:'Loyalty reward', cta:'Unlock now',
    title:'Loyalty tier + deductible reduction',
    desc:'2+ years qualifies you for priority claims handling and $100 deductible reduction on renewal.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  paperless: {
    id:'paperless', icon:'📋', badge:'3% off premium', cta:'Switch now',
    title:'Go paperless — earn discount',
    desc:'Switch to digital documents and earn a 3% paperless discount on your next renewal.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  priorityAdj: {
    id:'priorityAdj', icon:'🎯', badge:'Premium service', cta:'Upgrade service',
    title:'Dedicated concierge adjuster',
    desc:'Upgrade to priority adjuster access — faster responses and a dedicated direct phone line.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },

  /* ────────────────────────────────
     AUTO — Cross-sell (partner)
  ──────────────────────────────── */
  roadsideHONK: {
    id:'roadsideHONK', icon:'🚛', badge:'Free 30 days', cta:'View API docs',
    title:'Roadside assistance — now',
    desc:'Request a tow, jump start, or lockout service in minutes. Available 24/7 anywhere in the US.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('HONK','https://www.honkforhelp.com/platform'), v('Agero','https://apiportal.agero.com/') ],
  },
  rentalCar: {
    id:'rentalCar', icon:'🚗', badge:'Book instantly', cta:'View API docs',
    title:'Book a rental — Enterprise or Turo',
    desc:'Compare rental rates while your vehicle is in repair. Enterprise and Turo peer-to-peer available.',
    revenueType:'MARKETPLACE_COMMISSION',
    vendors:[ v('Turo','https://turo.com/developers'), v('Enterprise','https://www.enterprise.com/en/about/facts/partner-programs.html') ],
  },
  repairShops: {
    id:'repairShops', icon:'🔧', badge:'10% off labor', cta:'View API docs',
    title:'Compare certified repair shops',
    desc:"Price-transparent certified repair via RepairPal and Openbay. Safelite for glass. Work warranted.",
    revenueType:'MARKETPLACE_COMMISSION',
    vendors:[ v('RepairPal','https://documenter.getpostman.com/view/16678580/TzshHjyY'), v('Openbay','https://www.openbay.com/api'), v('Safelite','https://www.safelite.com/commercial/api-integration') ],
  },
  vehicleValuation: {
    id:'vehicleVal', icon:'💰', badge:'Total loss?', cta:'View API docs',
    title:'Vehicle valuation + trade-in',
    desc:'Get ACV instantly via Black Book or CARFAX. Compare dealer trade-in offers near you.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('Black Book','https://developer.blackbookcloud.com/'), v('J.D. Power','https://portal.jdpower.com/'), vx('CARFAX','https://www.carfax.com/partner/') ],
  },
  identityTheft: {
    id:'identityTheft', icon:'🔐', badge:'First month free', cta:'View API docs',
    title:'Identity theft protection',
    desc:'Claims expose personal data. Experian monitoring — free developer sandbox available.',
    revenueType:'SUBSCRIPTION_ADDON',
    vendors:[ v('Experian','https://developer.experian.com/') ],
  },
  roadsideSub: {
    id:'roadsideSub', icon:'🛣️', badge:'$9.99/mo', cta:'View partner portal',
    title:'Roadside + tire subscription',
    desc:'Unlimited tows, tire repair, battery, and lockout for every vehicle in household. Cancel anytime.',
    revenueType:'SUBSCRIPTION_ADDON',
    vendors:[ v('Nation Safe Drivers','https://www.nationsafedrivers.com/partners') ],
  },
  wellnessSub: {
    id:'wellnessSub', icon:'🧘', badge:'Free 60 days', cta:'View API docs',
    title:'Wellness + telehealth add-on',
    desc:'Mental health support and telehealth access — Lyra, Spring Health, and Teladoc available.',
    revenueType:'SUBSCRIPTION_ADDON',
    vendors:[ v('Lyra Health','https://www.lyrahealth.com/enterprise/integrations/'), v('Spring Health','https://www.springhealth.com/employers/integrations'), v('Teladoc','https://teladochealth.com/integrations/') ],
  },
  legalAuto: {
    id:'legalAuto', icon:'⚖️', badge:'Legal support', cta:'View API docs',
    title:'Legal consultation services',
    desc:'LegalZoom and RocketLawyer for liability advice after an at-fault or contested incident.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('LegalZoom','https://developer.legalzoom.com/'), v('RocketLawyer','https://developer.rocketlawyer.com/') ],
  },
  cashback: {
    id:'cashback', icon:'💵', badge:'2% cashback', cta:'View API docs',
    title:'Cashback on your settlement',
    desc:'Deposit payout to PayPal or Venmo wallet and earn 2% cashback — up to $50 back.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('PayPal','https://developer.paypal.com/') ],
  },
  docuSign: {
    id:'docuSign', icon:'📄', badge:'E-signature', cta:'View API docs',
    title:'Sign documents digitally',
    desc:'DocuSign for faster claim document processing — no printing, no mailing required.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('DocuSign','https://developers.docusign.com/') ],
  },
  damagePics: {
    id:'damagePics', icon:'📷', badge:'Easy upload', cta:'View API docs',
    title:'Certified damage photo capture',
    desc:'Use HONK and Agero tools to capture and submit certified damage photos from your phone.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('HONK','https://www.honkforhelp.com/platform'), v('Agero','https://apiportal.agero.com/') ],
  },

  /* ────────────────────────────────
     PROPERTY — Upsell (same carrier)
  ──────────────────────────────── */
  rcvUpgrade: {
    id:'rcvUpgrade', icon:'🏗️', badge:'RCV upgrade', cta:'Upgrade policy',
    title:'Extended replacement cost',
    desc:"Upgrade from ACV to extended RCV — cover rebuild at today's full material and labor prices.",
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  umbrellaHO: {
    id:'umbrellaHO', icon:'🌂', badge:'Full protection', cta:'Get umbrella',
    title:'Personal umbrella $1M+',
    desc:'Add $1M+ umbrella liability above your current HO-3 limits — critical for homeowners.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  sewerBackup: {
    id:'sewerBackup', icon:'🏠', badge:'Coverage gap', cta:'Add coverage',
    title:'Add sewer backup + ALE coverage',
    desc:'Equipment breakdown, sewer backup, and ALE are excluded from HO-3. Add for ~$40/yr.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  ordinanceLaw: {
    id:'ordinanceLaw', icon:'📜', badge:'Code protection', cta:'Add to policy',
    title:'Ordinance & law + service line',
    desc:'Code upgrades add 15–25% to rebuild costs. O&L endorsement covers it — add during claim.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  homeWarranty: {
    id:'homeWarranty', icon:'🏡', badge:'Full protection', cta:'View API docs',
    title:'Home warranty + umbrella bundle',
    desc:'Protect appliances and add $1M+ liability umbrella. Complete post-claim protection package.',
    revenueType:'EMBEDDED_INSURANCE',
    vendors:[ v('Super','https://www.super.com/partners'), v('Cinch','https://www.cinchhomeservices.com/partner'), v('2-10 HBW','https://www.2-10.com/partners/') ],
  },

  /* ────────────────────────────────
     PROPERTY — Cross-sell (partner)
  ──────────────────────────────── */
  tempLodging: {
    id:'tempLodging', icon:'🛏️', badge:'ALE lodging', cta:'View API docs',
    title:'Find temporary lodging today',
    desc:'Hotel Engine and Airbnb extended-stay rates for displaced policyholders — no upfront cost.',
    revenueType:'MARKETPLACE_COMMISSION',
    vendors:[ v('Hotel Engine','https://www.hotelengine.com/lp/api-for-travel'), v('Airbnb','https://developer.withairbnb.com/') ],
  },
  contractors: {
    id:'contractors', icon:'🔨', badge:'Verified pros', cta:'View API docs',
    title:'Licensed contractor marketplace',
    desc:'Thumbtack and Angi connect you with licensed, insured contractors — compare quotes and reviews.',
    revenueType:'MARKETPLACE_COMMISSION',
    vendors:[ v('Thumbtack','https://pros.thumbtack.com/pro-partners'), v('Angi','https://www.angi.com/partner/') ],
  },
  smartSensors: {
    id:'smartSensors', icon:'📱', badge:'Prevent claims', cta:'View API docs',
    title:'Smart leak sensors + security',
    desc:'Resideo and Ring sensors prevent 90% of water claims. ADT/SimpliSafe for post-fire security.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('Resideo','https://developer.resideo.com/'), v('Ring','https://ring-api.com/'), v('Ecobee','https://www.ecobee.com/en-us/developers/'), v('ADT','https://developer.adt.com/') ],
  },
  pestControl: {
    id:'pestControl', icon:'🐛', badge:'Post-incident', cta:'Coming soon',
    title:'Pest control — Terminix / Orkin',
    desc:'Water and fire damage invites pests. Terminix and Orkin available for assessment and treatment.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ vx('Terminix',''), vx('Orkin','') ],
  },
  mitigation: {
    id:'mitigation', icon:'🧹', badge:'Emergency', cta:'Coming soon',
    title:'Emergency mitigation crew',
    desc:'Stop further damage — water extraction, board-up, debris removal dispatched in hours.',
    revenueType:'MARKETPLACE_COMMISSION',
    vendors:[ vx('Servpro',''), vx('BMS CAT',''), vx('Paul Davis','') ],
  },

  /* ────────────────────────────────
     COMMERCIAL AUTO — Upsell / Cross-sell
  ──────────────────────────────── */
  fleetForgive: {
    id:'fleetForgive', icon:'🚐', badge:'Fleet protection', cta:'Add to fleet',
    title:'Multi-driver accident forgiveness',
    desc:'Prevent rate increases post-claim. Add accident forgiveness for all fleet drivers.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  safetyCredit: {
    id:'safetyCredit', icon:'📡', badge:'Safety credits', cta:'Enroll program',
    title:'Dashcam + safety credit program',
    desc:'Safety camera endorsement — earn credits reducing fleet premiums by up to 10%.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  fleetTelematics: {
    id:'fleetTelem', icon:'🗺️', badge:'Fleet uptime', cta:'View API docs',
    title:'Fleet management — Geotab / Samsara',
    desc:'Telematics and route optimization reduce future claims and driver incidents.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('Geotab','https://developers.geotab.com/'), v('Samsara','https://developers.samsara.com/reference/overview'), v('Verizon Connect','https://developers.verizon.com/') ],
  },
  dashcam: {
    id:'dashcam', icon:'📷', badge:'Driver monitoring', cta:'View API docs',
    title:'Dashcam + safety hardware',
    desc:'Nauto, SmartDrive, and Motive — driver behavior monitoring, collision alerts, video evidence.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ vx('Nauto','https://www.nauto.com/solutions/api'), vx('SmartDrive','https://www.smartdrive.net/solutions/integrations/'), v('Motive','https://developer.gomotive.com/') ],
  },
  fleetMaint: {
    id:'fleetMaint', icon:'🔩', badge:'Maintenance', cta:'View API docs',
    title:'Fleet maintenance — Fleetio',
    desc:'Scheduled maintenance and diagnostics via Fleetio — reduce downtime and future claims.',
    revenueType:'MARKETPLACE_COMMISSION',
    vendors:[ v('Fleetio','https://developer.fleetio.com/'), v('YourMechanic','https://developer.yourmechanic.com') ],
  },

  /* ────────────────────────────────
     WORKERS COMP — Upsell / Cross-sell
  ──────────────────────────────── */
  rtwProgram: {
    id:'rtwProgram', icon:'💼', badge:'RTW Toolkit', cta:'Enroll employer',
    title:'Return-to-work program',
    desc:'Employers with RTW programs earn safety credits reducing WC premiums by up to 10%.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  safetyWC: {
    id:'safetyWC', icon:'🏗️', badge:'Safety credits', cta:'Start program',
    title:'Workplace safety + ergonomic program',
    desc:"Formal safety training and ergonomic review — earn WC premium credits on renewal.",
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  teleRehab: {
    id:'teleRehab', icon:'💊', badge:'Injured worker', cta:'View API docs',
    title:'Tele-rehab + behavioral health',
    desc:"Hinge Health for virtual PT, Lyra and Spring Health for mental wellness support.",
    revenueType:'SUBSCRIPTION_ADDON',
    vendors:[ v('Hinge Health','https://www.hingehealth.com/employers/integrations/'), v('Sword Health','https://swordhealth.com/employers'), v('Lyra Health','https://www.lyrahealth.com/enterprise/integrations/') ],
  },
  telehealth: {
    id:'telehealth', icon:'🩺', badge:'Virtual care', cta:'View API docs',
    title:'Telehealth — Teladoc',
    desc:'Virtual doctor access for injured workers — faster treatment, lower cost than ER visits.',
    revenueType:'SUBSCRIPTION_ADDON',
    vendors:[ v('Teladoc','https://teladochealth.com/integrations/'), v('MDLIVE','https://www.mdlive.com/partners/'), v('Amwell','https://business.amwell.com/partners/') ],
  },
  ergonomic: {
    id:'ergonomic', icon:'🪑', badge:'Injury prevention', cta:'View API docs',
    title:'Ergonomic assessment program',
    desc:'Workplace posture and safety review — reduces WC claim frequency by up to 30%.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('VelocityEHS','https://developer.velocityehs.com/'), vx('ErgoPlus','') ],
  },

  /* ────────────────────────────────
     CMP — Upsell / Cross-sell
  ──────────────────────────────── */
  cyberSuite: {
    id:'cyberSuite', icon:'🔒', badge:'Cyber Suite', cta:'Add bundle',
    title:'Cyber + data breach + EPLI bundle',
    desc:"Bundle cyber, EPLI, and utility interruption into one SMB resilience endorsement.",
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  bizIncome: {
    id:'bizIncome', icon:'💼', badge:'Business income', cta:'Upgrade limits',
    title:'Increase business income limits',
    desc:'Add extra expense and increased BI limits — cover full operational costs during a covered loss.',
    revenueType:'POLICY_UPSELL',
    vendors:[ v('ValueMomentum','https://valuemomentum.com') ],
  },
  cyberTools: {
    id:'cyberTools', icon:'🛡️', badge:'Active threat', cta:'View API docs',
    title:'Cybersecurity — Coalition Cyber',
    desc:'Coalition, Cowbell Cyber, and Zeguro provide real-time threat monitoring and active protection.',
    revenueType:'SUBSCRIPTION_ADDON',
    vendors:[ v('Coalition','https://www.coalitioninc.com/brokers/api'), v('Cowbell Cyber','https://developers.cowbellcyber.ai/reference/cyber-api-quickstart'), v('Zeguro','https://www.zeguro.com/integrations') ],
  },
  legalHR: {
    id:'legalHR', icon:'⚖️', badge:'Legal + HR', cta:'View API docs',
    title:'Legal consultation + HR compliance',
    desc:'LegalZoom for liability advice. Mineral HR and BambooHR for labor law compliance post-claim.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('LegalZoom','https://developer.legalzoom.com/'), v('RocketLawyer','https://developer.rocketlawyer.com/'), v('Mineral HR','https://www.trustmineral.com/partners/'), v('BambooHR','https://documentation.bamboohr.com/docs') ],
  },
  smartProperty: {
    id:'smartProperty', icon:'📡', badge:'Smart sensors', cta:'View API docs',
    title:'Smart property sensors',
    desc:'Notion, Resideo, Bosch — leak, flood, smoke, and motion detection to prevent future loss.',
    revenueType:'AFFILIATE_PARTNERSHIP',
    vendors:[ v('Resideo','https://developer.resideo.com/'), v('Bosch IoT','https://www.bosch-connected-industry.com/en/developer-tools/') ],
  },
  bizContinuity: {
    id:'bizContinuity', icon:'🚨', badge:'Continuity', cta:'View API docs',
    title:'Business continuity planning',
    desc:'Resilience360 and Everbridge for risk alerts and disruption planning during a loss event.',
    revenueType:'SUBSCRIPTION_ADDON',
    vendors:[ v('Resilience360','https://resilience360.dhl.com/api'), v('Everbridge','https://developers.everbridge.net/home') ],
  },
}

/* ═══ RULES TABLE: [lob][tab] → OfferSet ═══ */
const RULES: Record<LobType, Partial<Record<TabId, OfferSet>>> = {
  auto: {
    coverage:  { upsell:[O.comprehensive, O.deductWaiver],  crossSell:[O.roadsideHONK,  O.identityTheft],    gapAlert:'No comprehensive coverage detected — theft, weather, and glass events are not covered on your current policy.' },
    info:      { upsell:[O.loyaltyTier,   O.autoBundle],    crossSell:[O.identityTheft,  O.ubiTelematics]    },
    contacts:  { upsell:[O.priorityAdj,   O.loyaltyTier],   crossSell:[O.legalAuto,      O.telehealth]       },
    services:  { upsell:[O.oemParts,      O.ubiTelematics], crossSell:[O.repairShops,    O.rentalCar]        },
    documents: { upsell:[O.paperless,     O.deductWaiver],  crossSell:[O.damagePics,     O.docuSign]         },
    payments:  { upsell:[O.autoBundle,    O.deductWaiver],  crossSell:[O.cashback,       O.vehicleValuation] },
    closure:   { upsell:[O.loyaltyTier,   O.autoBundle],    crossSell:[O.roadsideSub,    O.wellnessSub]      },
  },
  property: {
    coverage:  { upsell:[O.rcvUpgrade,   O.umbrellaHO],   crossSell:[O.tempLodging,  O.mitigation],    gapAlert:'ALE (loss of use) coverage is not on your policy — temporary housing during repairs is not covered.' },
    info:      { upsell:[O.sewerBackup,  O.umbrellaHO],   crossSell:[O.tempLodging,  O.pestControl]   },
    contacts:  { upsell:[O.ordinanceLaw, O.umbrellaHO],   crossSell:[O.contractors,  O.legalAuto]     },
    services:  { upsell:[O.ordinanceLaw, O.rcvUpgrade],   crossSell:[O.contractors,  O.mitigation]    },
    documents: { upsell:[O.paperless,    O.rcvUpgrade],   crossSell:[O.damagePics,   O.docuSign]      },
    payments:  { upsell:[O.homeWarranty, O.umbrellaHO],   crossSell:[O.smartSensors, O.pestControl]   },
    closure:   { upsell:[O.homeWarranty, O.rcvUpgrade],   crossSell:[O.smartSensors, O.contractors]   },
  },
  commAuto: {
    coverage:  { upsell:[O.fleetForgive, O.safetyCredit], crossSell:[O.fleetTelematics, O.dashcam],    gapAlert:'Your fleet policy lacks accident forgiveness — a rate increase will apply after this claim.' },
    info:      { upsell:[O.fleetForgive, O.safetyCredit], crossSell:[O.fleetTelematics, O.dashcam]    },
    contacts:  { upsell:[O.fleetForgive, O.safetyCredit], crossSell:[O.legalAuto,       O.fleetTelematics] },
    services:  { upsell:[O.safetyCredit, O.fleetForgive], crossSell:[O.fleetMaint,      O.fleetTelematics] },
    documents: { upsell:[O.paperless,    O.safetyCredit], crossSell:[O.damagePics,      O.docuSign]   },
    payments:  { upsell:[O.fleetForgive, O.safetyCredit], crossSell:[O.fleetMaint,      O.dashcam]    },
    closure:   { upsell:[O.fleetForgive, O.safetyCredit], crossSell:[O.fleetMaint,      O.dashcam]    },
  },
  wc: {
    coverage:  { upsell:[O.rtwProgram,  O.safetyWC],  crossSell:[O.teleRehab,  O.telehealth],  gapAlert:'No return-to-work program enrolled — injury duration and indemnity costs are typically 30% higher without one.' },
    info:      { upsell:[O.rtwProgram,  O.safetyWC],  crossSell:[O.teleRehab,  O.telehealth]  },
    contacts:  { upsell:[O.rtwProgram,  O.safetyWC],  crossSell:[O.legalAuto,  O.teleRehab]   },
    services:  { upsell:[O.ergonomic,   O.rtwProgram], crossSell:[O.teleRehab,  O.telehealth]  },
    documents: { upsell:[O.paperless,   O.rtwProgram], crossSell:[O.damagePics, O.docuSign]    },
    payments:  { upsell:[O.ergonomic,   O.rtwProgram], crossSell:[O.telehealth, O.teleRehab]   },
    closure:   { upsell:[O.safetyWC,    O.rtwProgram], crossSell:[O.ergonomic,  O.teleRehab]   },
  },
  cmp: {
    coverage:  { upsell:[O.cyberSuite, O.bizIncome], crossSell:[O.cyberTools,    O.smartProperty], gapAlert:'No cyber coverage detected — a data breach event is not covered under your current commercial policy.' },
    info:      { upsell:[O.cyberSuite, O.bizIncome], crossSell:[O.cyberTools,    O.smartProperty]  },
    contacts:  { upsell:[O.cyberSuite, O.bizIncome], crossSell:[O.legalHR,       O.bizContinuity]  },
    services:  { upsell:[O.bizIncome,  O.cyberSuite], crossSell:[O.contractors,  O.bizContinuity]  },
    documents: { upsell:[O.paperless,  O.bizIncome],  crossSell:[O.damagePics,   O.docuSign]       },
    payments:  { upsell:[O.bizIncome,  O.cyberSuite], crossSell:[O.legalHR,      O.smartProperty]  },
    closure:   { upsell:[O.cyberSuite, O.bizIncome],  crossSell:[O.legalHR,      O.smartProperty]  },
  },
}

export function getOffers(lob: LobType, tab: TabId): OfferSet {
  return RULES[lob]?.[tab] || RULES[lob]?.coverage || { upsell:[], crossSell:[] }
}

export default getOffers
