/* ═══════════════════════════════════════════════════════════════
   crossSellEngine.ts — CS/UP Rules Engine
   Maps: LOB × Tab → { upsellOffers[], crossSellOffers[], gapAlert? }
   VM Claims Portal · Sprint 2
   ═══════════════════════════════════════════════════════════════ */

export type LobType = 'auto' | 'property' | 'commAuto' | 'wc' | 'cmp'
export type TabId   = 'coverage' | 'info' | 'contacts' | 'services' | 'documents' | 'payments' | 'closure'

export interface Offer {
  id:         string
  icon:       string
  badge:      string
  title:      string
  desc:       string
  cta:        string
  poweredBy:  string
  revenueType: 'POLICY_UPSELL' | 'AFFILIATE_PARTNERSHIP' | 'EMBEDDED_INSURANCE' | 'MARKETPLACE_COMMISSION' | 'SUBSCRIPTION_ADDON'
}

export interface OfferSet {
  upsell:     Offer[]
  crossSell:  Offer[]
  gapAlert?:  string
}

/* ── Offer library ── */
const O: Record<string, Offer> = {
  // ── Auto Upsell ──
  comprehensive:   { id:'comprehensive',   icon:'🛡️', badge:'Coverage gap',    title:'Add comprehensive coverage',        desc:'Theft, weather, and glass events not covered. Upgrade for full ACV protection.',                       cta:'Get quote',        poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  oemParts:        { id:'oemParts',        icon:'🔩', badge:'OEM protection',   title:'OEM parts + GAP warranty',          desc:'Ensure OEM parts in repair. Add GAP and mechanical breakdown warranty at point of repair.',            cta:'Add coverage',     poweredBy:'Cover Genius XCover · Munich Re',      revenueType:'EMBEDDED_INSURANCE'     },
  deductWaiver:    { id:'deductWaiver',    icon:'💳', badge:'Save $500',        title:'Deductible waiver endorsement',      desc:'Add deductible waiver now — could apply to this very claim and all future ones.',                        cta:'Add to policy',    poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  ubiTelematics:   { id:'ubiTelematics',   icon:'📊', badge:'Saves $180/yr',   title:'UBI telematics discount',            desc:'Safe drivers earn 10–20% additional premium discount with usage-based insurance telematics.',             cta:'Enroll now',       poweredBy:'LexisNexis · Octo Telematics',         revenueType:'POLICY_UPSELL'          },
  autoBundle:      { id:'autoBundle',      icon:'🏠', badge:'Saves $240/yr',   title:'Bundle auto + home — 15% off',       desc:'Add homeowners policy and get multi-policy discount on both premiums. Takes 2 minutes.',                  cta:'Get bundle quote', poweredBy:'Same carrier — multi-policy',          revenueType:'POLICY_UPSELL'          },
  loyaltyTier:     { id:'loyaltyTier',     icon:'🏆', badge:'Loyalty reward',  title:'Loyalty tier + deductible reduction', desc:'2+ years qualifies you for priority claims handling and $100 deductible reduction on renewal.',         cta:'Unlock now',       poweredBy:'Same carrier loyalty program',         revenueType:'POLICY_UPSELL'          },
  paperless:       { id:'paperless',       icon:'📋', badge:'3% off premium',  title:'Go paperless — earn discount',        desc:'Switch to digital documents and earn a 3% paperless discount on your next renewal.',                    cta:'Switch now',       poweredBy:'Same carrier — paperless program',     revenueType:'POLICY_UPSELL'          },
  priorityAdj:     { id:'priorityAdj',     icon:'🎯', badge:'Premium service', title:'Dedicated concierge adjuster',        desc:'Upgrade to priority adjuster access — faster responses and a dedicated direct phone line.',               cta:'Upgrade service',  poweredBy:'Same carrier — premium service tier',  revenueType:'POLICY_UPSELL'          },
  // ── Auto Cross-sell ──
  roadsideHONK:    { id:'roadsideHONK',    icon:'🚛', badge:'Free 30 days',    title:'Roadside assistance — now',          desc:'Request a tow, jump start, or lockout service in minutes. Available 24/7 anywhere in the US.',          cta:'Request now',      poweredBy:'HONK · Agero · Urgently',              revenueType:'AFFILIATE_PARTNERSHIP'  },
  rentalCar:       { id:'rentalCar',       icon:'🚗', badge:'Book instantly',  title:'Book a rental — Enterprise or Turo', desc:'Compare rental rates while your vehicle is in repair. Enterprise and Turo peer-to-peer available.',       cta:'Book rental',      poweredBy:'Turo API · Enterprise Rent-A-Car',     revenueType:'MARKETPLACE_COMMISSION' },
  repairShops:     { id:'repairShops',     icon:'🔧', badge:'10% off labor',   title:'Compare certified repair shops',      desc:'Price-transparent certified repair via RepairPal and Openbay. Safelite for glass. Work warranted.',        cta:'Find shop',        poweredBy:'RepairPal · Openbay · Safelite',       revenueType:'MARKETPLACE_COMMISSION' },
  vehicleValuation:{ id:'vehicleVal',      icon:'💰', badge:'Total loss?',     title:'Vehicle valuation + trade-in',       desc:'Get ACV instantly via Black Book or CARFAX. Compare dealer trade-in offers near you.',                    cta:'Check value',      poweredBy:'Black Book · J.D. Power · CARFAX',     revenueType:'AFFILIATE_PARTNERSHIP'  },
  identityTheft:   { id:'identityTheft',   icon:'🔐', badge:'First month free',title:'Identity theft protection',          desc:'Claims expose personal data. Experian and LifeLock monitoring — first month free.',                         cta:'Start free trial', poweredBy:'LifeLock · Experian API',              revenueType:'SUBSCRIPTION_ADDON'     },
  roadsideSub:     { id:'roadsideSub',     icon:'🛣️', badge:'$9.99/mo',       title:'Roadside + tire subscription',       desc:'Unlimited tows, tire repair, battery, and lockout for every vehicle in household. Cancel anytime.',     cta:'Subscribe',        poweredBy:'Nation Safe Drivers · Allstate Roadside', revenueType:'SUBSCRIPTION_ADDON'   },
  wellnessSub:     { id:'wellnessSub',     icon:'🧘', badge:'Free 60 days',   title:'Wellness + telehealth add-on',       desc:'Accidents are stressful. Mental health support and telehealth — free for 60 days.',                        cta:'Activate',         poweredBy:'Lyra · Spring Health · Teladoc',       revenueType:'SUBSCRIPTION_ADDON'     },
  legalAuto:       { id:'legalAuto',       icon:'⚖️', badge:'Legal support',  title:'Legal consultation services',        desc:'LegalZoom and RocketLawyer for liability advice after an at-fault or contested incident.',                  cta:'Get advice',       poweredBy:'LegalZoom · RocketLawyer',             revenueType:'AFFILIATE_PARTNERSHIP'  },
  cashback:        { id:'cashback',        icon:'💵', badge:'2% cashback',     title:'Cashback on your settlement',        desc:'Deposit payout to PayPal or Venmo wallet and earn 2% cashback — up to $50 back.',                          cta:'Claim cashback',   poweredBy:'PayPal · Venmo API',                   revenueType:'AFFILIATE_PARTNERSHIP'  },
  docuSign:        { id:'docuSign',        icon:'📄', badge:'E-signature',     title:'Sign documents digitally',           desc:'DocuSign for faster claim document processing — no printing, no mailing required.',                       cta:'Sign now',         poweredBy:'DocuSign API',                         revenueType:'AFFILIATE_PARTNERSHIP'  },
  damagePics:      { id:'damagePics',      icon:'📷', badge:'Easy upload',     title:'Certified damage photo capture',     desc:'Use HONK tools to capture and submit certified damage photos directly from your phone.',                   cta:'Take photos',      poweredBy:'HONK · Agero photo tools',             revenueType:'AFFILIATE_PARTNERSHIP'  },
  // ── Property Upsell ──
  rcvUpgrade:      { id:'rcvUpgrade',      icon:'🏗️', badge:'RCV upgrade',    title:'Extended replacement cost',          desc:'Upgrade from ACV to extended RCV — cover rebuild at today\'s full material and labor prices.',            cta:'Upgrade policy',   poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  umbrellaHO:      { id:'umbrellaHO',      icon:'🌂', badge:'Full protection', title:'Personal umbrella $1M+',             desc:'Add $1M+ umbrella liability above your current HO-3 limits — critical for homeowners.',                    cta:'Get umbrella',     poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  sewerBackup:     { id:'sewerBackup',     icon:'🏠', badge:'Coverage gap',    title:'Add sewer backup + ALE coverage',    desc:'Equipment breakdown, sewer backup, and ALE are excluded from HO-3. Add for ~$40/yr.',                     cta:'Add coverage',     poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  ordinanceLaw:    { id:'ordinanceLaw',    icon:'📜', badge:'Code protection', title:'Ordinance & law + service line',     desc:'Code upgrades add 15–25% to rebuild costs. O&L endorsement covers it — add during claim.',              cta:'Add to policy',    poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  homeWarranty:    { id:'homeWarranty',    icon:'🏡', badge:'Full protection', title:'Home warranty + umbrella bundle',    desc:'Protect appliances and add $1M+ liability umbrella. Complete post-claim protection package.',             cta:'Get covered',      poweredBy:'Super · Cinch · 2-10 Home Buyers',    revenueType:'EMBEDDED_INSURANCE'     },
  // ── Property Cross-sell ──
  tempLodging:     { id:'tempLodging',     icon:'🛏️', badge:'ALE lodging',    title:'Find temporary lodging today',       desc:'Hotel Engine and Airbnb extended-stay rates for displaced policyholders — no upfront cost.',              cta:'Find lodging',     poweredBy:'Hotel Engine · Airbnb API',            revenueType:'MARKETPLACE_COMMISSION' },
  contractors:     { id:'contractors',     icon:'🔨', badge:'Verified pros',   title:'Licensed contractor marketplace',    desc:'Thumbtack and Angi connect you with licensed, insured contractors — compare quotes, read reviews.',       cta:'Find contractors', poweredBy:'Thumbtack · Angi · HomeAdvisor Pro',   revenueType:'MARKETPLACE_COMMISSION' },
  smartSensors:    { id:'smartSensors',    icon:'📱', badge:'Prevent claims',  title:'Smart leak sensors + security',      desc:'Resideo and Ring sensors prevent 90% of water claims. ADT/SimpliSafe for post-fire security.',            cta:'Shop devices',     poweredBy:'Resideo · Ring · Ecobee · ADT',        revenueType:'AFFILIATE_PARTNERSHIP'  },
  pestControl:     { id:'pestControl',     icon:'🐛', badge:'Post-incident',   title:'Pest control — Terminix',            desc:'Water and fire damage invites pests. Terminix and Orkin available for assessment and treatment.',          cta:'Schedule visit',   poweredBy:'Terminix · Orkin (partial API)',        revenueType:'AFFILIATE_PARTNERSHIP'  },
  mitigation:      { id:'mitigation',      icon:'🧹', badge:'Emergency',       title:'Emergency mitigation crew',          desc:'Stop further damage — water extraction, board-up, debris removal dispatched in hours.',                    cta:'Dispatch now',     poweredBy:'Servpro · BMS CAT · Paul Davis',       revenueType:'MARKETPLACE_COMMISSION' },
  // ── Commercial Auto Upsell/Cross-sell ──
  fleetForgive:    { id:'fleetForgive',    icon:'🚐', badge:'Fleet protection', title:'Multi-driver accident forgiveness', desc:'Prevent rate increases post-claim. Add accident forgiveness for all fleet drivers.',                    cta:'Add to fleet',     poweredBy:'Same carrier fleet endorsement',       revenueType:'POLICY_UPSELL'          },
  safetyCredit:    { id:'safetyCredit',    icon:'📡', badge:'Safety credits',  title:'Dashcam + safety credit program',    desc:'Safety camera endorsement — earn credits reducing fleet premiums by up to 10%.',                        cta:'Enroll program',   poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  fleetTelematics: { id:'fleetTelem',      icon:'🗺️', badge:'Fleet uptime',   title:'Fleet management — Geotab',          desc:'Telematics and route optimization reduce future claims and driver incidents.',                           cta:'Learn more',       poweredBy:'Geotab · Samsara · Verizon Connect',   revenueType:'AFFILIATE_PARTNERSHIP'  },
  dashcam:         { id:'dashcam',         icon:'📷', badge:'Driver monitoring',title:'Dashcam + safety hardware',         desc:'Nauto and SmartDrive — driver behavior monitoring, collision alerts, and video evidence.',               cta:'Get hardware',     poweredBy:'Nauto · SmartDrive · KeepTruckin',     revenueType:'AFFILIATE_PARTNERSHIP'  },
  fleetMaint:      { id:'fleetMaint',      icon:'🔩', badge:'Maintenance',     title:'Fleet maintenance — Fleetio',        desc:'Scheduled maintenance and diagnostics via Fleetio — reduce downtime and future claims.',                  cta:'Schedule now',     poweredBy:'Fleetio · YourMechanic for Business',  revenueType:'MARKETPLACE_COMMISSION' },
  // ── Workers Comp Upsell/Cross-sell ──
  rtwProgram:      { id:'rtwProgram',      icon:'💼', badge:'RTW Toolkit',     title:'Return-to-work program',             desc:'Employers with RTW programs earn safety credits reducing WC premiums by up to 10%.',                    cta:'Enroll employer',  poweredBy:'Same carrier — RTW endorsement',       revenueType:'POLICY_UPSELL'          },
  safetyWC:        { id:'safetyWC',        icon:'🏗️', badge:'Safety credits', title:'Workplace safety + ergonomic program',desc:'Formal safety training and ergonomic review — earn WC premium credits on renewal.',                  cta:'Start program',    poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  teleRehab:       { id:'teleRehab',       icon:'💊', badge:'Injured worker',  title:'Tele-rehab + behavioral health',     desc:'Hinge Health for virtual PT, Lyra and Spring Health for mental wellness support.',                       cta:'Connect worker',   poweredBy:'Hinge Health · Sword Health · Lyra',   revenueType:'SUBSCRIPTION_ADDON'     },
  telehealth:      { id:'telehealth',      icon:'🩺', badge:'Virtual care',    title:'Telehealth — Teladoc',               desc:'Virtual doctor access for injured workers — faster treatment, lower cost than ER visits.',               cta:'Access now',       poweredBy:'Teladoc · MDLIVE · Amwell',            revenueType:'SUBSCRIPTION_ADDON'     },
  ergonomic:       { id:'ergonomic',       icon:'🪑', badge:'Injury prevention',title:'Ergonomic assessment program',      desc:'Workplace posture and safety review — reduces WC claim frequency by up to 30%.',                        cta:'Schedule visit',   poweredBy:'VelocityEHS · ErgoPlus',               revenueType:'AFFILIATE_PARTNERSHIP'  },
  // ── CMP Upsell/Cross-sell ──
  cyberSuite:      { id:'cyberSuite',      icon:'🔒', badge:'Cyber Suite',     title:'Cyber + data breach + EPLI bundle',  desc:'Bundle cyber, EPLI, and utility interruption into one SMB resilience endorsement.',                    cta:'Add bundle',       poweredBy:'Same carrier — Cyber Suite',           revenueType:'POLICY_UPSELL'          },
  bizIncome:       { id:'bizIncome',       icon:'💼', badge:'Business income', title:'Increase business income limits',     desc:'Add extra expense and increased BI limits — cover full operational costs during a covered loss.',        cta:'Upgrade limits',   poweredBy:'Same carrier endorsement',            revenueType:'POLICY_UPSELL'          },
  cyberTools:      { id:'cyberTools',      icon:'🛡️', badge:'Active threat',  title:'Cybersecurity — Coalition Cyber',    desc:'Coalition, Cowbell Cyber, and Zeguro provide real-time threat monitoring and active protection.',        cta:'Protect business', poweredBy:'Coalition · Cowbell Cyber · Zeguro',   revenueType:'SUBSCRIPTION_ADDON'     },
  legalHR:         { id:'legalHR',         icon:'⚖️', badge:'Legal + HR',     title:'Legal consultation + HR compliance', desc:'LegalZoom for liability advice. Mineral HR and BambooHR for labor law compliance post-claim.',           cta:'Get advice',       poweredBy:'LegalZoom · RocketLawyer · Mineral HR', revenueType:'AFFILIATE_PARTNERSHIP'  },
  smartProperty:   { id:'smartProperty',   icon:'📡', badge:'Smart sensors',  title:'Smart property sensors',             desc:'Notion, Resideo, Bosch — leak, flood, smoke, and motion detection to prevent future loss.',              cta:'Install sensors',  poweredBy:'Notion · Resideo · Bosch Connected',   revenueType:'AFFILIATE_PARTNERSHIP'  },
  bizContinuity:   { id:'bizContinuity',   icon:'🚨', badge:'Continuity',     title:'Business continuity planning',       desc:'Resilience360 and Everbridge for risk alerts and disruption planning during a loss event.',              cta:'Plan now',         poweredBy:'Resilience360 · Everbridge',            revenueType:'SUBSCRIPTION_ADDON'     },
}

/* ═══ RULES TABLE: [lob][tab] → OfferSet ═══ */
const RULES: Record<LobType, Partial<Record<TabId, OfferSet>>> = {
  auto: {
    coverage:  { upsell:[O.comprehensive, O.deductWaiver],  crossSell:[O.roadsideHONK, O.identityTheft],   gapAlert:'No comprehensive coverage detected — theft, weather, and glass events are not covered on your current policy.' },
    info:      { upsell:[O.loyaltyTier,   O.autoBundle],    crossSell:[O.identityTheft, O.ubiTelematics]   },
    contacts:  { upsell:[O.priorityAdj,   O.loyaltyTier],   crossSell:[O.legalAuto,     O.telehealth]      },
    services:  { upsell:[O.oemParts,      O.ubiTelematics],  crossSell:[O.repairShops,   O.rentalCar]       },
    documents: { upsell:[O.paperless,     O.deductWaiver],  crossSell:[O.damagePics,    O.docuSign]        },
    payments:  { upsell:[O.autoBundle,    O.deductWaiver],  crossSell:[O.cashback,      O.vehicleValuation] },
    closure:   { upsell:[O.loyaltyTier,   O.autoBundle],    crossSell:[O.roadsideSub,   O.wellnessSub]     },
  },
  property: {
    coverage:  { upsell:[O.rcvUpgrade,    O.umbrellaHO],    crossSell:[O.tempLodging,   O.mitigation],    gapAlert:'ALE (loss of use) coverage is not on your policy — temporary housing during repairs is not covered.' },
    info:      { upsell:[O.sewerBackup,   O.umbrellaHO],    crossSell:[O.tempLodging,   O.pestControl]    },
    contacts:  { upsell:[O.ordinanceLaw,  O.umbrellaHO],    crossSell:[O.contractors,   O.legalAuto]      },
    services:  { upsell:[O.ordinanceLaw,  O.rcvUpgrade],    crossSell:[O.contractors,   O.mitigation]     },
    documents: { upsell:[O.paperless,     O.rcvUpgrade],    crossSell:[O.damagePics,    O.docuSign]       },
    payments:  { upsell:[O.homeWarranty,  O.umbrellaHO],    crossSell:[O.smartSensors,  O.pestControl]    },
    closure:   { upsell:[O.homeWarranty,  O.rcvUpgrade],    crossSell:[O.smartSensors,  O.contractors]    },
  },
  commAuto: {
    coverage:  { upsell:[O.fleetForgive,  O.safetyCredit],  crossSell:[O.fleetTelematics, O.dashcam],     gapAlert:'Your fleet policy lacks accident forgiveness — a rate increase will apply after this claim.' },
    info:      { upsell:[O.fleetForgive,  O.safetyCredit],  crossSell:[O.fleetTelematics, O.dashcam]      },
    contacts:  { upsell:[O.fleetForgive,  O.safetyCredit],  crossSell:[O.legalAuto,       O.fleetTelematics] },
    services:  { upsell:[O.safetyCredit,  O.fleetForgive],  crossSell:[O.fleetMaint,      O.fleetTelematics] },
    documents: { upsell:[O.paperless,     O.safetyCredit],  crossSell:[O.damagePics,      O.docuSign]     },
    payments:  { upsell:[O.fleetForgive,  O.safetyCredit],  crossSell:[O.fleetMaint,      O.dashcam]      },
    closure:   { upsell:[O.fleetForgive,  O.safetyCredit],  crossSell:[O.fleetMaint,      O.dashcam]      },
  },
  wc: {
    coverage:  { upsell:[O.rtwProgram,    O.safetyWC],      crossSell:[O.teleRehab,     O.telehealth],    gapAlert:'No return-to-work program enrolled — injury duration and indemnity costs are typically 30% higher without one.' },
    info:      { upsell:[O.rtwProgram,    O.safetyWC],      crossSell:[O.teleRehab,     O.telehealth]     },
    contacts:  { upsell:[O.rtwProgram,    O.safetyWC],      crossSell:[O.legalAuto,     O.teleRehab]      },
    services:  { upsell:[O.ergonomic,     O.rtwProgram],    crossSell:[O.teleRehab,     O.telehealth]     },
    documents: { upsell:[O.paperless,     O.rtwProgram],    crossSell:[O.damagePics,    O.docuSign]       },
    payments:  { upsell:[O.ergonomic,     O.rtwProgram],    crossSell:[O.telehealth,    O.teleRehab]      },
    closure:   { upsell:[O.safetyWC,      O.rtwProgram],    crossSell:[O.ergonomic,     O.teleRehab]      },
  },
  cmp: {
    coverage:  { upsell:[O.cyberSuite,    O.bizIncome],     crossSell:[O.cyberTools,    O.smartProperty], gapAlert:'No cyber coverage detected — a data breach event is not covered under your current commercial policy.' },
    info:      { upsell:[O.cyberSuite,    O.bizIncome],     crossSell:[O.cyberTools,    O.smartProperty]  },
    contacts:  { upsell:[O.cyberSuite,    O.bizIncome],     crossSell:[O.legalHR,       O.bizContinuity]  },
    services:  { upsell:[O.bizIncome,     O.cyberSuite],    crossSell:[O.contractors,   O.bizContinuity]  },
    documents: { upsell:[O.paperless,     O.bizIncome],     crossSell:[O.damagePics,    O.docuSign]       },
    payments:  { upsell:[O.bizIncome,     O.cyberSuite],    crossSell:[O.legalHR,       O.smartProperty]  },
    closure:   { upsell:[O.cyberSuite,    O.bizIncome],     crossSell:[O.legalHR,       O.smartProperty]  },
  },
}

export function getOffers(lob: LobType, tab: TabId): OfferSet {
  return RULES[lob]?.[tab] || RULES[lob]?.coverage || { upsell:[], crossSell:[] }
}

export default getOffers
